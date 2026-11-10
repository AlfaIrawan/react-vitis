// Focused entitlement-gate regression checks. Run: node scripts/check-internal-access.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'src/auth/InternalAccessGate.tsx'), 'utf8')
const app = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name.replace('react-', '')
const client = `${app}-spa`
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
async function check(response, expected, options = {}) {
  let session = { token: options.cookie ? '' : 'old-token', user: { id: 'subject-1' } }
  let result, effect, cleanup, request
  const exports = {}
  const listeners = {}
  const context = {
    exports, AbortController,
    require(name) {
      if (name === './internalAccessRoles') return { InternalAccessRoles: { Provider: 'roles-provider' } }
      if (name === 'react') return { useEffect: f => { effect = f }, useState: () => [null, value => { result = value }] }
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
      if (name === 'react-router-dom') return { useLocation: () => ({ key: 'route-1' }) }
      if (name === './authService') return { getSession: () => session, logoutAsync: async () => {} }
      return { IDENTITY_API_BASE: '/api/identity-lite' }
    },
    window: { setTimeout: () => 1, clearTimeout() {}, setInterval: () => 2, clearInterval() {}, addEventListener: (k, f) => { listeners[k] = f }, removeEventListener() {} },
    fetch: async (url, init) => { request = { url, init }; if (response instanceof Error) throw response; return response },
  }
  vm.runInNewContext(compiled, context)
  const initial = exports.InternalAccessGate({ children: 'protected-content' })
  assert.equal(initial.props.role, 'status', 'must not render content before entitlement check')
  cleanup = effect()
  await new Promise(setImmediate)
  assert.equal(result.status, expected)
  assert.equal(request.url, '/api/identity-lite/v1/internal-access/check')
  assert.equal(JSON.parse(request.init.body).client_id, client)
  assert.equal(request.init.credentials, 'include')
  if (options.cookie) assert.equal(request.init.headers.Authorization, undefined)
  else assert.equal(request.init.headers.Authorization, 'Bearer old-token')
  if (expected === 'allowed' && !options.cookie) {
    session = { ...session, token: 'refreshed-token' }
    listeners.focus()
    await new Promise(setImmediate)
    assert.equal(request.init.headers.Authorization, 'Bearer refreshed-token', 'rechecks use the current session token')
  }
  cleanup()
}
const ok = payload => ({ ok: true, status: 200, json: async () => payload })
;(async () => {
  const allowed = { active: true, sub: 'subject-1', client_id: client }
  await check(ok(allowed), 'allowed')
  await check(ok(allowed), 'allowed', { cookie: true })
  await check({ ok: false, status: 401 }, 'denied')
  await check({ ok: false, status: 403 }, 'denied')
  await check({ ok: false, status: 503 }, 'unavailable')
  await check(new Error('network failure'), 'unavailable')
  await check(ok({ ...allowed, active: false }), 'denied')
  await check(ok({ ...allowed, sub: 'another-user' }), 'denied')
  await check(ok({ ...allowed, client_id: 'tectona-spa' }), 'denied')
  await check(ok({}), 'denied')
  const routes = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
  assert(!routes.includes('<RegisterPage'))
  assert(!routes.includes('<NoWorkspaceAccessPage'))
  assert(routes.includes('<InternalAccessDenied'))
  const login = fs.readFileSync(path.join(root, 'src/pages/Login.tsx'), 'utf8')
  assert(!login.includes('href="/register"'))
  assert(!login.includes('Sign up first'))
  console.log(`${app}: 10 entitlement scenarios and sign-in-only route checks passed`)
})().catch(error => { console.error(error); process.exitCode = 1 })
