import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { shell, app } from 'electron';
import { google } from 'googleapis';
const REDIRECT_PATH = '/oauth2callback';
const LOOPBACK_HOST = '127.0.0.1';
const DEFAULT_REDIRECT_URI = `http://${LOOPBACK_HOST}`;
const SCOPES = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];
const REQUIRED_YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube';
function normalizeTokens(tokens) {
    return {
        ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
        ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
        ...(tokens.scope ? { scope: tokens.scope } : {}),
        ...(tokens.token_type ? { token_type: tokens.token_type } : {}),
        ...(typeof tokens.expiry_date === 'number' ? { expiry_date: tokens.expiry_date } : {}),
    };
}
function hasRequiredYoutubeScope(scopeValue) {
    if (!scopeValue) {
        return false;
    }
    return scopeValue.split(' ').includes(REQUIRED_YOUTUBE_SCOPE);
}
function getTokenPath() {
    return path.join(app.getPath('userData'), 'google-oauth-token.json');
}
function createClient(redirectUri = DEFAULT_REDIRECT_URI) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment');
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
async function readStoredTokens() {
    try {
        const payload = await fs.readFile(getTokenPath(), 'utf8');
        return JSON.parse(payload);
    }
    catch {
        return null;
    }
}
async function saveTokens(tokens) {
    await fs.mkdir(path.dirname(getTokenPath()), { recursive: true });
    await fs.writeFile(getTokenPath(), JSON.stringify(tokens, null, 2), 'utf8');
}
async function exchangeCode(code, redirectUri) {
    const oauth2 = createClient(redirectUri);
    const { tokens } = await oauth2.getToken(code);
    return normalizeTokens(tokens);
}
async function waitForCode() {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const address = server.address();
            if (!address) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('OAuth server not ready. You can close this window.');
                return;
            }
            const redirectUri = `http://${LOOPBACK_HOST}:${address.port}${REDIRECT_PATH}`;
            const url = new URL(req.url ?? '', redirectUri);
            if (url.pathname !== REDIRECT_PATH) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
                return;
            }
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            if (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Authorization failed. You can close this window.');
                server.close();
                reject(new Error(`Google OAuth failed: ${error}`));
                return;
            }
            if (!code) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Missing OAuth code. You can close this window.');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Authorization complete. You can return to the app.');
            server.close();
            resolve({ code, redirectUri });
        });
        server.on('error', (error) => {
            reject(error);
        });
        server.listen(0, LOOPBACK_HOST, async () => {
            try {
                const address = server.address();
                if (!address) {
                    throw new Error('Failed to acquire local OAuth callback port');
                }
                const redirectUri = `http://${LOOPBACK_HOST}:${address.port}${REDIRECT_PATH}`;
                const oauth2 = createClient(redirectUri);
                const authUrl = oauth2.generateAuthUrl({
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: SCOPES,
                });
                await shell.openExternal(authUrl);
            }
            catch (error) {
                server.close();
                reject(error);
            }
        });
    });
}
export async function signInWithGoogle() {
    const { code, redirectUri } = await waitForCode();
    const tokens = await exchangeCode(code, redirectUri);
    await saveTokens(normalizeTokens(tokens));
    const oauth2 = createClient(redirectUri);
    oauth2.setCredentials(normalizeTokens(tokens));
    const oauth2Api = google.oauth2({ auth: oauth2, version: 'v2' });
    const { data } = await oauth2Api.userinfo.get();
    return {
        signedIn: true,
        ...(data.email ? { email: data.email } : {}),
        ...(data.name ? { displayName: data.name } : {}),
    };
}
export async function getAuthorizedClient() {
    const tokens = await readStoredTokens();
    if (!tokens?.access_token && !tokens?.refresh_token) {
        return null;
    }
    if (!hasRequiredYoutubeScope(tokens.scope)) {
        return null;
    }
    const oauth2 = createClient();
    oauth2.setCredentials(normalizeTokens(tokens));
    return oauth2;
}
export async function getAuthStatus() {
    const oauth2 = await getAuthorizedClient();
    if (!oauth2) {
        return { signedIn: false };
    }
    try {
        const oauth2Api = google.oauth2({ auth: oauth2, version: 'v2' });
        const { data } = await oauth2Api.userinfo.get();
        return {
            signedIn: true,
            ...(data.email ? { email: data.email } : {}),
            ...(data.name ? { displayName: data.name } : {}),
        };
    }
    catch {
        return { signedIn: false };
    }
}
export async function signOut() {
    const tokenPath = getTokenPath();
    await fs.rm(tokenPath, { force: true });
}
