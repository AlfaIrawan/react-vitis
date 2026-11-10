// No live services: request bodies, authorization and admin visibility are tested using mocks.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const root = path.resolve(__dirname, '..')
const app = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name.replace('react-', '')
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
let request, token = 'test-token', status = 200, detail = '', calls = 0
const api = {}
vm.runInNewContext(transpile('src/lib/api/internalUsersApi.ts'), {
 exports: api, AbortController, Error, TypeError,
 window: { setTimeout: () => 1, clearTimeout() {} },
 require: name => name.includes('authService') ? { getSession: () => ({ token }) } : { IDENTITY_API_BASE: '/api/identity-lite' },
 fetch: async (url, init) => { calls++; request = { url, init }; return { ok: status === 200, status, json: async () => status === 200 ? { items: [] } : { detail } } },
})
const roles = {}
vm.runInNewContext(transpile('src/auth/internalAccessRoles.ts'), { exports: roles, require: () => React })
;(async () => {
 assert.equal(roles.canAdministerInternalApp([`${app}_root`]), true)
 assert.equal(roles.canAdministerInternalApp([`${app}_admin`]), true)
 for (const value of ['admin', 'root', 'tectona_root', `${app}_member`, 'gateway_admin']) assert.equal(roles.canAdministerInternalApp([value]), false)
 assert.deepEqual([...api.parseInternalRoles(`${app}_member, ${app}_member`)], [`${app}_member`])
 assert.throws(() => api.parseInternalRoles('tectona_admin'))
 assert.throws(() => api.parseInternalRoles(''))
 await api.listInternalUsers()
 assert.equal(request.url, `/api/identity-lite/v1/internal-apps/${app}-spa/users`)
 assert.equal(request.init.headers.Authorization, 'Bearer test-token')
 assert.equal(request.init.credentials, 'include')
 await api.provisionInternalUser({ email: 'new@example.test', display_name: 'New user', roles: [`${app}_member`] })
 assert.equal(request.init.method, 'POST')
 assert.equal(JSON.parse(request.init.body).password, undefined, 'federated-only does not send a password')
 await api.provisionInternalUser({ email: 'new@example.test', display_name: 'New user', roles: [`${app}_member`], password: 'synthetic-test-only' })
 assert.equal(JSON.parse(request.init.body).password, 'synthetic-test-only')
 token = ''
 await api.updateInternalGrant('00000000-0000-0000-0000-000000000001', { roles: [`${app}_member`], enabled: false })
 assert.equal(request.init.method, 'PUT')
 assert.equal(request.init.headers.Authorization, undefined)
 assert.equal(JSON.parse(request.init.body).enabled, false)
 const previous = calls
 await assert.rejects(api.updateInternalGrant('not-a-uuid', { roles: [`${app}_member`], enabled: true }), /UUID/)
 assert.equal(calls, previous)
 status = 409; detail = 'grant_conflict_or_successor_required'
 await assert.rejects(api.listInternalUsers(), /durable administrator/)
 status = 500; detail = 'private backend stacktrace and credential'
 await assert.rejects(api.listInternalUsers(), error => !error.message.includes(detail) && /identity service/.test(error.message))
 // The real denial view distinguishes an entitled member from a missing app grant.
 const denial = {}
 vm.runInNewContext(transpile('src/auth/InternalAccessGate.tsx'), { exports: denial, require(name) {
  if (name === 'react') return React
  if (name === 'react/jsx-runtime') return require('react/jsx-runtime')
  if (name.includes('internalAccessRoles')) return roles
  if (name.includes('authService')) return { getSession: () => null, logoutAsync: async () => {} }
  return { IDENTITY_API_BASE: '/api/identity-lite' }
 } })
 const memberDenial = renderToStaticMarkup(React.createElement(denial.InternalAccessDenied, { administration: true }))
 assert(memberDenial.includes('Administrator access required'))
 assert(memberDenial.includes('You are signed in'))
 assert(!memberDenial.includes('before you can sign in'))
 const grantDenial = renderToStaticMarkup(React.createElement(denial.InternalAccessDenied))
 assert(grantDenial.includes('before you can sign in'))
 const unavailable = renderToStaticMarkup(React.createElement(denial.InternalAccessDenied, { unavailable: true, administration: true }))
 assert(unavailable.includes('Access verification unavailable'))
 // Server render proves direct page access denies members/inherited roles and exposes only app admins.
 let currentRoles = []
 const page = {}
 vm.runInNewContext(transpile('src/pages/InternalUsersPage.tsx'), {
  exports: page,
  require(name) {
   if (name === 'react') return React
   if (name === 'react/jsx-runtime') return require('react/jsx-runtime')
   if (name === 'react-router-dom') return { Link: ({ children }) => React.createElement('a', null, children) }
   if (name.includes('internalAccessRoles')) return { ...roles, useInternalAccessRoles: () => currentRoles }
   if (name.includes('InternalAccessGate')) return { InternalAccessDenied: ({ administration }) => React.createElement('p', null, administration ? 'Administrator access required' : 'Access denied') }
   if (name.includes('internalUsersApi')) return api
   return { getSession: () => null }
  },
 })
 for (const value of [[`${app}_member`], ['tectona_root'], ['root']]) {
  currentRoles = value
  const html = renderToStaticMarkup(React.createElement(page.InternalUsersPage))
  assert(html.includes('Administrator access required')); assert(!html.includes('<form'))
 }
 currentRoles = [`${app}_admin`]
 const admin = renderToStaticMarkup(React.createElement(page.InternalUsersPage))
 assert(admin.includes('Provision new identity')); assert(admin.includes('Grant existing identity'))
 assert(admin.includes('federated-only')); assert(!admin.includes('type="password"'))
 assert(admin.includes('disabled=""'), 'saving starts disabled until confirmed')
 assert(admin.includes('durable non-bootstrap root successor'))
 const launcher = fs.readFileSync(path.join(root, 'src/modules/core-shell/components/AppLauncher.tsx'), 'utf8')
 assert(launcher.includes('canAdministerInternalApp(useInternalAccessRoles())'))
 assert(launcher.includes('/internal-users'))
 console.log(`${app}: admin API, role isolation, direct-page denial and launcher checks passed`)
})().catch(error => { console.error(error); process.exitCode = 1 })
