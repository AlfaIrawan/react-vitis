/**
 * Isolated REAL Vitis auth/provisioning slice. Never uses Vite config or dotenv.
 * This is not a full-app, SSO-provider, passkey, or visual-regression harness.
 * Run without flags for plan. Use --build only after the isolated backend is ready.
 * Static output must be served by the fixture on the SAME loopback origin as Identity.
 * The server must additionally enforce the CSP below, not expose the repository,
 * disable access/body logging, and use a fresh isolated browser profile/context.
 */
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const ROOT = path.resolve(__dirname, '..')
const CSP = "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'"
const plan = {
  client: 'vitis-spa',
  mode: 'real-components-real-auth-service-no-session-adapter',
  routes: ['/login', '/internal-users', '/register', '/request-access'],
  identityRoutes: ['/api/identity-lite/oauth2/token', '/api/identity-lite/oauth2/userinfo', '/api/identity-lite/oauth2/session/bootstrap', '/api/identity-lite/oauth2/logout', '/api/identity-lite/v1/internal-access/check', '/api/identity-lite/v1/internal-apps/vitis-spa/users'],
  constraints: ['Synthetic credentials only', 'Fresh browser context', 'All API requests same-origin to fixture', 'No live services or public directory exposure', 'Password-only login; no passkey or external-provider actions'],
  csp: CSP,
}
if (!process.argv.includes('--build')) {
  console.log(JSON.stringify(plan, null, 2))
  process.exit(0)
}
const esbuild = require('esbuild')
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vitis-isolated-auth-ui-'))
const entry = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { InternalUsersPage } from '@/pages/InternalUsersPage'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { InternalAccessDenied } from '@/auth/InternalAccessGate'
import { logoutAsync } from '@/auth/authService'
function Harness() {
  const location = useLocation()
  return <><header className="harness-notice" data-route={location.pathname}>
    Isolated synthetic Vitis auth/provisioning test. Real source components, simplified harness styling.
    <button type="button" onClick={() => void logoutAsync().finally(() => window.location.assign('/login'))}>Sign out of fixture</button>
  </header><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/internal-users" element={<ProtectedRoute><InternalUsersPage /></ProtectedRoute>} />
    <Route path="/register" element={<InternalAccessDenied />} />
    <Route path="/request-access" element={<InternalAccessDenied />} />
    <Route path="*" element={<Navigate to="/internal-users" replace />} />
  </Routes></>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Harness /></BrowserRouter>)
`
;(async () => {
  const result = await esbuild.build({
    absWorkingDir: ROOT,
    stdin: { contents: entry, resolveDir: ROOT, sourcefile: 'isolated-auth-entry.tsx', loader: 'tsx' },
    outfile: path.join(output, 'bundle.js'), bundle: true, write: true,
    platform: 'browser', format: 'esm', target: 'es2022', jsx: 'automatic',
    sourcemap: false, metafile: true, minify: false,
    tsconfigRaw: { compilerOptions: { jsx: 'react-jsx', baseUrl: ROOT, paths: { '@/*': ['./src/*'] } } },
    define: {
      'import.meta.env': JSON.stringify({ DEV: false, MODE: 'isolated-test', BASE_URL: '/',
        VITE_IDENTITY_LITE_API_URL: '/api/identity-lite', VITE_VITIS_OIDC_CLIENT_ID: 'vitis-spa', VITE_AUTH_PROVIDERS: 'password' }),
      'process.env.NODE_ENV': '"production"',
      '__APP_VERSION__': '"isolated-test"', '__APP_BUILD_HASH__': '"synthetic-fixture"',
    },
    logLevel: 'silent',
  })
  const inputs = Object.keys(result.metafile.inputs)
  if (inputs.some(name => /(^|[\\/])\.env(?:\.|$)/.test(name))) throw new Error('Unexpected environment-file input')
  fs.writeFileSync(path.join(output, 'harness.css'), `
*{box-sizing:border-box}body{font:16px system-ui;color:#142030;background:#eff3f8;margin:0;padding:4rem 1rem 2rem}button,input,select{font:inherit}button{padding:.5rem 1rem;margin:.25rem;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}input:not([type=checkbox]){padding:.55rem;width:100%;max-width:40rem}label{display:block;margin:.75rem 0}h1{font-size:1.5rem}main{max-width:70rem;margin:auto}section,article{padding:1rem;border:1px solid #bbc8d8;border-radius:.5rem;margin:.5rem 0;background:white}p{overflow-wrap:anywhere}.harness-notice{position:fixed;top:0;left:0;right:0;z-index:1000;background:#24384f;color:white;padding:.5rem;font-size:12px}.platform-login{position:relative!important;min-height:75vh!important}.platform-login-card{background:white;padding:1.5rem;max-width:32rem;margin:2rem auto}[role=alert]{color:#a12020}[role=status]{color:#164b32}.flex{display:flex}.gap-4{gap:1rem}.space-y-4>*+*{margin-top:1rem}.text-sm{font-size:.875rem}img{max-width:100%;max-height:7rem}
`)
  fs.mkdirSync(path.join(output, 'images'))
  const image = path.join(ROOT, 'public/images/vitis-wordmark.svg')
  if (fs.existsSync(image)) fs.copyFileSync(image, path.join(output, 'images/vitis-wordmark.svg'))
  fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${CSP}"><title>Isolated Vitis auth test</title><link rel="stylesheet" href="/bundle.css"><link rel="stylesheet" href="/harness.css"></head><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>`)
  fs.writeFileSync(path.join(output, 'harness-manifest.json'), JSON.stringify({ ...plan, inputFiles: inputs, exclusions: ['Full application shell/resource clients', 'External federation', 'Passkey ceremony', 'Production styling'], environmentFilesLoaded: false }, null, 2))
  console.log(JSON.stringify({ outputDirectory: output, manifest: path.join(output, 'harness-manifest.json'), inputCount: inputs.length, bytes: fs.statSync(path.join(output, 'bundle.js')).size, ...plan }, null, 2))
})().catch(error => { console.error(error.message); process.exitCode = 1 })
