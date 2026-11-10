const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
let fresh = { token: 'fresh-token' }, stored = { token: 'stale-token' }, request, calls = 0
const exportsObject = {}
const source = fs.readFileSync(path.join(root, 'src/lib/api/authenticatedResourceFetch.ts'), 'utf8')
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
 exports: exportsObject, Headers, Error,
 require: () => ({ ensureFreshSession: async () => fresh, getSession: () => stored }),
 fetch: async (url, init) => { calls++; request = { url, init }; return { ok: true } },
})
;(async () => {
 await exportsObject.authenticatedResourceFetch('/api/resource', { headers: { 'X-Test': 'preserved' } })
 assert.equal(request.init.headers.get('Authorization'), 'Bearer fresh-token')
 assert.equal(request.init.headers.get('X-Test'), 'preserved')
 assert.equal(request.init.credentials, 'include')
 const headers = new Headers({ Authorization: 'Bearer explicit-token' })
 await exportsObject.authenticatedResourceFetch('/api/resource', { method: 'POST', headers, body: 'test' })
 assert.equal(request.init.headers.get('Authorization'), 'Bearer explicit-token')
 assert.equal(headers.get('Authorization'), 'Bearer explicit-token')
 assert.equal(request.init.body, 'test')
 fresh = { token: '', cookieSession: true }
 await exportsObject.authenticatedResourceFetch('/api/resource')
 assert.equal(request.init.headers.has('Authorization'), false)
 assert.equal(request.init.credentials, 'include')
 fresh = null; stored = null
 const before = calls
 await assert.rejects(exportsObject.authenticatedResourceFetch('/api/resource'), /Sign in/)
 assert.equal(calls, before, 'signed-out requests never reach fetch')
 console.log('Authenticated resource transport: token, cookie, signed-out and explicit-header tests passed')
})().catch(error => { console.error(error); process.exitCode = 1 })
