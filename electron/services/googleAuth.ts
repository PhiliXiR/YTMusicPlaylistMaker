import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { shell, app } from 'electron'
import { google } from 'googleapis'
import type { AuthStatus } from '../../src/types/shared.js'

const REDIRECT_URI = 'http://127.0.0.1:42813/oauth2callback'
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

interface StoredTokens {
  access_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date?: number
}

interface IncomingTokens {
  access_token?: string | null
  refresh_token?: string | null
  scope?: string | null
  token_type?: string | null
  expiry_date?: number | null
}

function normalizeTokens(tokens: IncomingTokens): StoredTokens {
  return {
    ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    ...(tokens.scope ? { scope: tokens.scope } : {}),
    ...(tokens.token_type ? { token_type: tokens.token_type } : {}),
    ...(typeof tokens.expiry_date === 'number' ? { expiry_date: tokens.expiry_date } : {}),
  }
}

function getTokenPath(): string {
  return path.join(app.getPath('userData'), 'google-oauth-token.json')
}

function createClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment')
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)
}

async function readStoredTokens(): Promise<StoredTokens | null> {
  try {
    const payload = await fs.readFile(getTokenPath(), 'utf8')
    return JSON.parse(payload) as StoredTokens
  } catch {
    return null
  }
}

async function saveTokens(tokens: StoredTokens): Promise<void> {
  await fs.mkdir(path.dirname(getTokenPath()), { recursive: true })
  await fs.writeFile(getTokenPath(), JSON.stringify(tokens, null, 2), 'utf8')
}

async function exchangeCode(code: string): Promise<StoredTokens> {
  const oauth2 = createClient()
  const { tokens } = await oauth2.getToken(code)
  return normalizeTokens(tokens)
}

async function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '', REDIRECT_URI)
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Authorization failed. You can close this window.')
        server.close()
        reject(new Error(`Google OAuth failed: ${error}`))
        return
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Missing OAuth code. You can close this window.')
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Authorization complete. You can return to the app.')
      server.close()
      resolve(code)
    })

    server.listen(42813, '127.0.0.1')
  })
}

export async function signInWithGoogle(): Promise<AuthStatus> {
  const oauth2 = createClient()
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })

  await shell.openExternal(authUrl)
  const code = await waitForCode()
  const tokens = await exchangeCode(code)
  await saveTokens(normalizeTokens(tokens))

  oauth2.setCredentials(normalizeTokens(tokens))
  const oauth2Api = google.oauth2({ auth: oauth2, version: 'v2' })
  const { data } = await oauth2Api.userinfo.get()

  return {
    signedIn: true,
    ...(data.email ? { email: data.email } : {}),
    ...(data.name ? { displayName: data.name } : {}),
  }
}

export async function getAuthorizedClient() {
  const tokens = await readStoredTokens()
  if (!tokens?.access_token && !tokens?.refresh_token) {
    return null
  }

  const oauth2 = createClient()
  oauth2.setCredentials(normalizeTokens(tokens))
  return oauth2
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const oauth2 = await getAuthorizedClient()
  if (!oauth2) {
    return { signedIn: false }
  }

  try {
    const oauth2Api = google.oauth2({ auth: oauth2, version: 'v2' })
    const { data } = await oauth2Api.userinfo.get()

    return {
      signedIn: true,
      ...(data.email ? { email: data.email } : {}),
      ...(data.name ? { displayName: data.name } : {}),
    }
  } catch {
    return { signedIn: false }
  }
}

export async function signOut(): Promise<void> {
  const tokenPath = getTokenPath()
  await fs.rm(tokenPath, { force: true })
}
