const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const workspace = '10000000-0000-0000-0000-000000000001'
let session = { user: { id: '20000000-0000-0000-0000-000000000002' }, token: 'synthetic-token' }, request, calls = 0
const scopes = {}
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('import.meta.env', 'testEnv'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
vm.runInNewContext(compile('src/auth/vitisWorkspace.ts'), {
 exports: scopes, Error,
 require: name => name === 'zustand' ? require('zustand') : { getSession: () => session },
})
const api = {}
vm.runInNewContext(compile('src/lib/api/projectApi.ts'), {
 exports: api, Error, URLSearchParams, testEnv: { DEV: true },
 require(name) {
  if (name.includes('vitisWorkspace')) return scopes
  if (name.includes('authService')) return { ensureFreshSession: async () => session }
  return { authenticatedResourceFetch: async (url, init) => { calls++; request = { url, init }; return { ok: true, json: async () => ({ projects: [], workspace_id: workspace }) } } }
 },
})
const folders = {}
vm.runInNewContext(compile('src/lib/api/folderApi.ts'), {
 exports: folders, Error, URLSearchParams, testEnv: { DEV: true },
 require(name) {
  if (name.includes('vitisWorkspace')) return scopes
  if (name.includes('authService')) return { ensureFreshSession: async () => session }
  return { authenticatedResourceFetch: async (url, init) => { calls++; request = { url, init }; return { ok: true, json: async () => ({ projects: [], workspace_id: workspace }) } } }
 },
})
;(async () => {
 await assert.rejects(api.fetchProjects(), /workspace/)
 assert.equal(calls, 0)
 scopes.useVitisWorkspace.getState().setMemberships(session.user.id, [workspace])
 assert.throws(() => scopes.useVitisWorkspace.getState().select('30000000-0000-0000-0000-000000000003'), /active memberships/)
 scopes.useVitisWorkspace.getState().select(workspace)
 await api.fetchProjects({ workspace_id: workspace })
 assert.equal(new URL(request.url, 'https://example.test').searchParams.get('workspace_id'), workspace)
 await api.createProject({ name: 'test', workspace_id: workspace, owner_id: 'attacker-supplied' })
 const body = JSON.parse(request.init.body)
 assert.equal(body.owner_id, session.user.id)
 assert.equal(body.workspace_id, workspace)
 assert.equal(request.init.method, 'POST')
 await folders.fetchFolders({ workspace_id: workspace })
 assert.equal(new URL(request.url, 'https://example.test').searchParams.get('workspace_id'), workspace)
 await folders.createFolder({ name: 'folder', workspace_id: workspace, owner_id: 'untrusted-owner' })
 assert.equal(JSON.parse(request.init.body).owner_id, session.user.id)
 assert.equal(JSON.parse(request.init.body).workspace_id, workspace)
 await assert.rejects(folders.fetchFolderTree(), /workspace folder list/)
 session = { user: { id: '40000000-0000-0000-0000-000000000004' }, token: 'different' }
 const previous = calls
 await assert.rejects(api.createProject({ name: 'test', workspace_id: workspace }), /authorized workspace/)
 assert.equal(calls, previous)
 await assert.rejects(folders.createFolder({ name: 'folder', workspace_id: workspace }), /authorized workspace/)
 assert.equal(calls, previous)
 assert.throws(() => scopes.requireVitisWorkspace(workspace), /authorized workspace/)
 const selector = fs.readFileSync(path.join(root, 'src/modules/projects/components/VitisWorkspaceSelector.tsx'), 'utf8')
 assert(selector.includes('VITE_VITIS_AUTHZ_APP_ID'))
 assert(selector.includes('active_only=true'))
 assert(selector.includes("item.app_id === appId && item.subject_id === subject && item.status_code === 'active'"))
 assert(!selector.includes('TECTONA'))
 console.log('Vitis project transport: explicit workspace, active subject owner, cross-subject isolation and missing-scope checks passed')
})().catch(error => { console.error(error); process.exitCode = 1 })
