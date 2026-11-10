/** Isolated four-app auth/provisioning slice builder. No dotenv, Vite config, live config, server or browser launch.
 * Default: print plan. Build only after coordinator approval: --build --app vitis|acacia|tilia|laurus.
 * Serve only STATIC_ROOT on the fixture's loopback origin. Apply CSP as an HTTP header too.
 */
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const REPO = path.resolve(__dirname, '../../..')
const APPS = { vitis: 'Integration & Process Orchestration Management', acacia: 'AI Gateway Management', tilia: 'Service Registry Management', laurus: 'API Gateway Management' }
const requested = process.argv[process.argv.indexOf('--app') + 1]
const app = Object.hasOwn(APPS, requested) ? requested : 'vitis'
const ROOT = path.join(REPO, APPS[app], `react-${app}`)
const STATIC_ROOT = path.resolve(os.tmpdir(), 'internal-auth-browser-fixture/static')
if (!STATIC_ROOT.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Output must stay in temporary storage')
const CSP = "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'"
const plan = { app, client: `${app}-spa`, output: STATIC_ROOT, csp: CSP, routes: [`/${app}/login`, `/${app}/internal-users`, `/${app}/register`, `/${app}/request-access`],
  realComponents: ['Login', 'authService', 'identityApi', 'InternalAccessGate', 'InternalUsersPage', ...(app === 'acacia' ? [] : ['ProtectedRoute'])],
  limitations: ['Auth/provisioning slice, not full app E2E or visual QA', 'Synthetic accounts; fresh browser context per app', 'No external federation or passkey ceremony', 'Harness bridge for root /login redirects', ...(app === 'acacia' ? ['Harness authenticated wrapper instead of tenant/workspace ProtectedRoute providers', 'Presence/beacon and PWA cache clearing are no-op side-effect stubs; Identity APIs are real'] : [])],
  environmentFilesLoaded: false,
}
if (!process.argv.includes('--build')) { console.log(JSON.stringify(plan, null, 2)); process.exit(0) }
const esbuild = require(path.join(ROOT, 'node_modules/esbuild'))
const output = path.join(STATIC_ROOT, app)
fs.mkdirSync(output, { recursive: true })
const wrapperImport = app === 'acacia' ? `import { ensureFreshSession, getSession } from '@/auth/authService'` : `import { ProtectedRoute } from '@/auth/ProtectedRoute'`
const wrapper = app === 'acacia' ? `
function ProtectedSlice({ children }: { children: React.ReactNode }) {
 const [ready, setReady] = React.useState(false)
 React.useEffect(() => { let active=true; void ensureFreshSession().catch(() => null).finally(() => {if(active)setReady(true)}); return()=>{active=false} }, [])
 if(!ready) return <p>Verifying fixture session.</p>
 if(!getSession()) return <Navigate to="/login" replace />
 return <InternalAccessGate>{children}</InternalAccessGate>
}` : `const ProtectedSlice = ProtectedRoute`
const entry = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/Login'
import { InternalUsersPage } from '@/pages/InternalUsersPage'
import { InternalAccessDenied, InternalAccessGate } from '@/auth/InternalAccessGate'
import { logoutAsync } from '@/auth/authService'
import { ToastProvider } from '@/components/ui/toast'
${wrapperImport}
${wrapper}
function Harness() {
 const location = useLocation()
 return <><header className="harness-notice" data-route={location.pathname}>Synthetic ${app} auth/provisioning slice. Real Identity API, simplified styling.
 <button type="button" onClick={() => void logoutAsync().finally(() => window.location.assign('/${app}/login'))}>Sign out of fixture</button></header>
 <Routes><Route path="/login" element={<LoginPage />} />
 <Route path="/internal-users" element={<ProtectedSlice><InternalUsersPage /></ProtectedSlice>} />
 <Route path="/register" element={<InternalAccessDenied />} /><Route path="/request-access" element={<InternalAccessDenied />} />
 <Route path="*" element={<Navigate to="/internal-users" replace />} /></Routes></>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter basename="/${app}"><ToastProvider><Harness /></ToastProvider></BrowserRouter>)
`
const plugins = app === 'acacia' ? [{ name: 'isolate-non-auth-side-effects', setup(build) {
 build.onResolve({ filter: /(?:api\/collaborationContextApi|pwa\/initPwa)$/ }, args => ({ path: args.path, namespace: 'fixture-noop' }))
 build.onLoad({ filter: /.*/, namespace: 'fixture-noop' }, args => ({ contents: args.path.endsWith('initPwa')
  ? 'export async function clearSensitiveRuntimeCaches() {}'
  : 'export async function upsertWorkspacePresenceWithToken() {} export function sendOfflinePresenceBeacon() {} export async function upsertMyWorkspacePresence() {} export async function listWorkspacePresence() { throw new Error("Non-auth presence directory excluded from fixture") } export const TECTONA_CHAT_WORKSPACE_ID = "fixture-disabled-presence"', loader: 'js' }))
} }] : []
;(async () => {
 const result = await esbuild.build({ absWorkingDir: ROOT,
  stdin: { contents: entry, resolveDir: ROOT, sourcefile: 'isolated-auth-entry.tsx', loader: 'tsx' },
  outfile: path.join(output, 'bundle.js'), bundle: true, write: true, platform: 'browser', format: 'esm', target: 'es2022', jsx: 'automatic',
  sourcemap: false, metafile: true, minify: false, plugins,
  tsconfigRaw: { compilerOptions: { jsx: 'react-jsx', baseUrl: ROOT, paths: { '@/*': ['./src/*'] } } },
  define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'isolated-test', BASE_URL: '/',
   VITE_IDENTITY_LITE_API_URL: '/api/identity-lite', [`VITE_${app.toUpperCase()}_OIDC_CLIENT_ID`]: `${app}-spa`, VITE_AUTH_PROVIDERS: 'password', VITE_LAURUS_AUTH_PROVIDERS: 'password' }),
   'process.env.NODE_ENV': '"production"', '__APP_VERSION__': '"isolated-test"', '__APP_BUILD_HASH__': '"synthetic-fixture"' }, logLevel: 'silent',
 })
 const inputFiles = Object.keys(result.metafile.inputs)
 if (inputFiles.some(name => /(^|[\\/])\.env(?:\.|$)/.test(name))) throw new Error('Unexpected environment-file input')
 fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ ...plan, inputFiles }, null, 2))
 fs.mkdirSync(path.join(STATIC_ROOT, 'images'), { recursive: true })
 for (const name of [`${app}-wordmark.svg`, `${app}-icon.svg`]) {
  const image = path.join(ROOT, 'public/images', name)
  if (fs.existsSync(image)) fs.copyFileSync(image, path.join(STATIC_ROOT, 'images', name))
 }
 fs.writeFileSync(path.join(STATIC_ROOT, 'harness.css'), `*{box-sizing:border-box}body{font:16px system-ui;color:#142030;background:#eff3f8;margin:0;padding:4rem 1rem 2rem}button,input,select{font:inherit}button{padding:.5rem 1rem;margin:.25rem;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}input:not([type=checkbox]){padding:.55rem;width:100%;max-width:40rem}label{display:block;margin:.75rem 0}h1{font-size:1.5rem}main{max-width:70rem;margin:auto}section,article{padding:1rem;border:1px solid #bbc8d8;border-radius:.5rem;margin:.5rem 0;background:white}p{overflow-wrap:anywhere}.harness-notice{position:fixed;top:0;left:0;right:0;z-index:1000;background:#24384f;color:white;padding:.5rem;font-size:12px}.platform-login{position:relative!important;min-height:75vh!important}.platform-login-card{background:white;padding:1.5rem;max-width:32rem;margin:2rem auto}[role=alert]{color:#a12020}[role=status]{color:#164b32}.flex{display:flex}.gap-4{gap:1rem}.space-y-4>*+*{margin-top:1rem}.text-sm{font-size:.875rem}img{max-width:100%;max-height:7rem}`)
 fs.writeFileSync(path.join(STATIC_ROOT, 'bootstrap.js'), `const diag=document.createElement('aside');diag.id='fixture-diagnostics';diag.setAttribute('aria-label','Fixture diagnostics');Object.assign(diag.style,{position:'fixed',right:'8px',bottom:'8px',zIndex:'2000',maxWidth:'420px',background:'#fff',color:'#111',border:'1px solid #555',padding:'6px',font:'11px monospace',pointerEvents:'none',whiteSpace:'pre-wrap'});document.body.appendChild(diag);const events=[];const note=value=>{events.push(value);while(events.length>8)events.shift();diag.textContent='Test-only diagnostics (no credentials)\\n'+events.join('\\n')};note('Fixture loaded '+location.pathname);for(const kind of ['focusin','click','submit','invalid'])document.addEventListener(kind,event=>{const target=event.target;if(target instanceof HTMLElement)note(kind+': '+(target.id||target.tagName))},true);const originalFetch=window.fetch.bind(window);window.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);const path=url.origin===location.origin?url.pathname:'blocked-external-origin';note((init?.method||'GET')+' '+path);try{const response=await originalFetch(input,init);note(response.status+' '+path);return response}catch(error){note('network error '+path);throw error}};const fail=(error)=>{const root=document.getElementById('root');if(root)root.textContent='Fixture loading error: '+String(error?.message||error).slice(0,600)};window.addEventListener('error',event=>fail(event.error||event.message));window.addEventListener('unhandledrejection',event=>fail(event.reason));try{const apps=['vitis','acacia','tilia','laurus'];const requested=location.pathname.split('/')[1];const app=apps.includes(requested)?requested:(sessionStorage.getItem('fixture-app')||'vitis');sessionStorage.setItem('fixture-app',app);if(!apps.includes(requested)){location.replace('/'+app+(location.pathname==='/'?'/internal-users':location.pathname)+location.search)}else{const link=document.createElement('link');link.rel='stylesheet';link.href='/'+app+'/bundle.css';document.head.appendChild(link);import('/'+app+'/bundle.js').catch(fail)}}catch(error){fail(error)}`)
 fs.writeFileSync(path.join(STATIC_ROOT, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${CSP}"><title>Isolated internal auth test</title><link rel="stylesheet" href="/harness.css"></head><body><div id="root">Loading isolated auth fixture...</div><script type="module" src="/bootstrap.js"></script></body></html>`)
 console.log(JSON.stringify({ app, output, manifest: path.join(output, 'manifest.json'), inputCount: inputFiles.length, bytes: fs.statSync(path.join(output, 'bundle.js')).size }))
})().catch(error => { console.error(error.message); process.exitCode=1 })
