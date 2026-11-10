/** Offline only: execute actual logout function AST with all transports mocked. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const repo = path.resolve(__dirname, '../../..')
const apps = { vitis: 'Integration & Process Orchestration Management', acacia: 'AI Gateway Management', tilia: 'Service Registry Management', laurus: 'API Gateway Management' }
;(async () => {
 for (const [app, directory] of Object.entries(apps)) {
  const filename = path.join(repo, directory, `react-${app}`, 'src/lib/api/identityApi.ts')
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true)
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'revokeServerSession')
  assert.ok(fn, `${app}: actual logout function exists`)
  const output = ts.transpileModule(fn.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  let requests = [], fail = false
  const transport = async (url, init) => { requests.push({ url, init }); if (fail) throw new Error('Synthetic transport failure'); return { ok: true, json: async () => ({ revoked: true }) } }
  const exports = {}
  vm.runInNewContext(output, { exports, URLSearchParams, IDENTITY_API_BASE: '/api/identity-lite', [`${app.toUpperCase()}_OIDC_CLIENT_ID`]: `${app}-spa`, fetch: transport, fetchWithTimeout: transport, identityFetch: transport })
  const run = async (refresh, access) => { requests = []; await exports.revokeServerSession(refresh, access); return requests[0] }
  const check = request => {
   assert.ok(request, `${app}: expected request`)
   assert.equal(request.url, '/api/identity-lite/oauth2/logout')
   assert.equal(request.init.method, 'POST')
   assert.equal(request.init.credentials, 'include')
   assert.equal(request.init.body.get('client_id'), `${app}-spa`)
  }
  let request = await run('synthetic-refresh', 'synthetic-access')
  check(request)
  assert.equal(request.init.body.get('refresh_token'), 'synthetic-refresh')
  if (app !== 'vitis') {
   assert.equal(request.init.headers.Authorization, 'Bearer synthetic-access')
   request = await run(undefined, 'synthetic-access')
   check(request)
   assert.equal(request.init.body.has('refresh_token'), false)
   assert.equal(request.init.headers.Authorization, 'Bearer synthetic-access')
  }
  request = await run(undefined, undefined)
  {
   check(request)
   assert.equal(request.init.body.has('refresh_token'), false)
   assert.equal(request.init.headers.Authorization, undefined)
  }
  const authFilename = path.join(repo, directory, `react-${app}`, 'src/auth/authService.ts')
  const authSource = ts.createSourceFile(authFilename, fs.readFileSync(authFilename, 'utf8'), ts.ScriptTarget.Latest, true)
  const logoutFunctions = authSource.statements.filter(node => ts.isFunctionDeclaration(node) && ['logout', 'logoutAsync'].includes(node.name?.text)).map(node => node.getText(authSource)).join('\n')
  assert.equal(authSource.statements.filter(node => ts.isFunctionDeclaration(node) && ['logout', 'logoutAsync'].includes(node.name?.text)).length, 2)
  const authExports = {}, cleanups = []
  let stored = { user: { id: 'synthetic-subject' }, cookieSession: true }
  vm.runInNewContext(ts.transpileModule(logoutFunctions, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
   exports: authExports, readStoredSession: () => stored, getSession: () => stored,
   clearSession: () => cleanups.push(true), clearLocalSession: () => cleanups.push(true),
   markIntentionalSignOut() {}, setExplicitSignOut() {}, signOutGeneration: 0,
   publishOfflinePresence: async () => {}, recordTokenEvent() {}, maskToken: value => value,
   revokeServerSession: exports.revokeServerSession,
  })
  for (const session of [stored, null]) {
   stored = session
   for (const name of ['logoutAsync', 'logout']) {
    requests = []
    const before = cleanups.length
    await authExports[name]()
    await Promise.resolve(); await Promise.resolve()
    assert.equal(requests.length, 1, `${app}: ${name} cookie/no-local-session reaches actual transport`)
    check(requests[0])
    assert.equal(requests[0].init.headers.Authorization, undefined)
    assert.equal(requests[0].init.body.has('refresh_token'), false)
    assert.equal(cleanups.length, before + 1, `${app}: local cleanup preserved`)
   }
  }
  fail = true
  await assert.doesNotReject(() => run('synthetic-refresh', undefined), `${app}: best-effort failure semantics preserved`)
  console.log(`${app}: scoped client, credentials, refresh/access/cookie-only, and failure regression PASS`)
 }
})().catch(error => { console.error(error); process.exitCode = 1 })
