// Offline DOM/API regression checks. No live requests, accounts or services.
// Set ADMIN_TEST_JSDOM to an existing jsdom package path when it is supplied by
// a separate test harness; no dependency is downloaded or installed here.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const rootDir = path.resolve(__dirname, '..')
const { JSDOM } = require(process.env.ADMIN_TEST_JSDOM || 'jsdom')
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Event', 'MouseEvent']) global[key] = dom.window[key]
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { createRoot } = require('react-dom/client')
const ts = require('typescript')
const app = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).name.replace('react-', '')
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(rootDir, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
const lifecycle = {}
vm.runInNewContext(transpile('src/lib/internalUserLifecycle.ts'), { exports: lifecycle, window })
const api = {}
let responseMode = 'network'
vm.runInNewContext(transpile('src/lib/api/internalUsersApi.ts'), {
 exports: api, window, AbortController, Error, TypeError,
 require: name => name.includes('authService') ? { getSession: () => ({ token: 'synthetic-only' }) } : { IDENTITY_API_BASE: '/mock-only' },
 fetch: async () => {
  if (responseMode === 'network') throw new TypeError('offline')
  if (responseMode === 'abort') { const error = new Error('interrupted'); error.name = 'AbortError'; throw error }
  if (responseMode === 'json') return { ok: true, json: async () => { throw new SyntaxError('truncated') } }
  return { ok: false, status: responseMode === 'server' ? 503 : 409, json: async () => ({ detail: 'grant_conflict_or_successor_required' }) }
 },
})
const memberId = '00000000-0000-0000-0000-000000000001'
const member = { user_id: memberId, email: 'member@example.test', display_name: 'Member', roles: [`${app}_member`], enabled: true, revision: 1, account_status: 'active' }
let items, calls, listFails, listImpl, updateImpl, provisionImpl
const page = {}
vm.runInNewContext(transpile('src/pages/InternalUsersPage.tsx'), {
 exports: page, window, Date,
 require(name) {
  if (name === 'react') return React
  if (name === 'react/jsx-runtime') return require('react/jsx-runtime')
  if (name === 'react-router-dom') return { Link: ({ children }) => React.createElement('a', null, children) }
  if (name.includes('internalAccessRoles')) return { useInternalAccessRoles: () => [`${app}_root`], canAdministerInternalApp: () => true }
  if (name.includes('InternalAccessGate')) return { InternalAccessDenied: () => React.createElement('p', null, 'Denied') }
  if (name.includes('internalUserLifecycle')) return lifecycle
  if (name.includes('internalUsersApi')) return { ...api,
    listInternalUsers: async () => { if (listImpl) return listImpl(); if (listFails) throw new Error('Directory unavailable'); return { items } },
    updateInternalGrant: async (...args) => { calls++; return updateImpl(...args) },
    provisionInternalUser: async (...args) => { calls++; return provisionImpl(...args) },
  }
  return { getSession: () => ({ user: { id: 'synthetic-actor' } }) }
 },
})
let container, root
async function mount() {
 container = document.createElement('div'); document.body.append(container); root = createRoot(container)
 await React.act(async () => root.render(React.createElement(page.InternalUsersPage)))
}
async function unmount() { await React.act(async () => root.unmount()); container.remove() }
const button = text => [...container.querySelectorAll('button')].find(item => item.textContent === text)
const click = element => React.act(async () => element.click())
const input = (element, value) => React.act(async () => {
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value)
 element.dispatchEvent(new Event('input', { bubbles: true }))
})
const confirm = () => [...container.querySelectorAll('input[type="checkbox"]')].at(-1)
async function reset() {
 window.sessionStorage.clear(); items = [{ ...member }]; calls = 0; listFails = false; listImpl = null
 updateImpl = async () => { throw new api.InternalMutationOutcomeUnknownError('Unconfirmed test mutation') }
 provisionImpl = updateImpl
 await mount()
}
;(async () => {
 // Transport failures after sending are always uncertain; definitive 4xx errors are not.
 for (const mode of ['network', 'abort', 'server', 'json']) {
  responseMode = mode
  await assert.rejects(api.updateInternalGrant(memberId, { roles: member.roles, enabled: false }), error => api.isInternalMutationOutcomeUnknown(error))
 }
 responseMode = 'conflict'
 await assert.rejects(api.updateInternalGrant(memberId, { roles: member.roles, enabled: false }), error => !api.isInternalMutationOutcomeUnknown(error))
 const now = Date.parse('2026-11-12T12:00:00Z')
 const ready = { ...member, roles: [`${app}_root`], updated_at: '2026-11-12T10:00:00Z', login_verified_at: '2026-11-12T11:00:00Z', admin_verified_at: '2026-11-12T11:30:00Z' }
 assert.match(lifecycle.rootSuccessorReadiness(ready, app, now), /^Ready/)
 for (const delta of [{ is_bootstrap: true }, { roles: [`${app}_member`] }, { enabled: false }, { account_status: 'disabled' }, { valid_until: '2027-01-01' }, { updated_at: null }, { login_verified_at: null }, { login_verified_at: '2026-11-12T09:00:00Z' }, { admin_verified_at: null }, { admin_verified_at: '2026-11-12T10:30:00Z' }, { updated_at: '2026-11-10T09:00:00Z', login_verified_at: '2026-11-10T10:00:00Z', admin_verified_at: '2026-11-11T12:00:00Z' }, { admin_verified_at: '2026-11-13T12:00:00Z' }]) {
  assert.doesNotMatch(lifecycle.rootSuccessorReadiness({ ...ready, ...delta }, app, now), /^Ready/)
 }
 await reset()
 await click(button('Edit access'))
 await click(container.querySelector('input[type="checkbox"]'))
 await click(confirm())
 await click(button('Save application access'))
 assert.equal(calls, 1)
 assert.equal(button('Save application access').disabled, true)
 assert.equal(button('Provision new identity').disabled, true)
 await click(button('Save application access'))
 assert.equal(calls, 1, 'unknown mutation must not retry')
 listFails = true; await click(button('Refresh directory'))
 assert.equal(button('Save application access').disabled, true, 'failed refresh must retain lock')
 listFails = false; await click(button('Refresh directory'))
 assert.equal(button('Save application access').disabled, true, 'unmatched refresh must retain lock')
 await unmount(); await mount()
 assert.match(container.textContent, /unconfirmed outcome/)
 assert.equal(button('Create identity and grant access').disabled, true, 'reload must retain lock')
 items = [{ ...member, enabled: false, revision: 2 }]
 await click(button('Refresh directory'))
 assert.doesNotMatch(container.textContent, /previous change has an unconfirmed outcome/)
 assert.match(container.textContent, /No change was resubmitted/)
 assert.equal(calls, 1)
 assert.equal(confirm().checked, false)
 await unmount()
 // Identical state with the old revision is not proof that a mutation completed.
 const expected = { kind: 'existing', userId: memberId, email: '', roles: member.roles, enabled: false, baselineRevision: 1 }
 assert.equal(lifecycle.internalMutationMatches(expected, [{ ...member, enabled: false }]), false)
 assert.equal(lifecycle.internalMutationMatches(expected, [{ ...member, enabled: false, revision: 2 }]), true)
 // No-op submission sends nothing.
 await reset(); await click(button('Edit access')); await click(confirm()); await click(button('Save application access'))
 assert.equal(calls, 0); assert.match(container.textContent, /No changes to save/)
 await unmount()
 // Missing baseline version cannot be used for a safely reconcilable change.
 await reset(); items = [{ ...member, revision: undefined }]; await click(button('Refresh directory'))
 await click(button('Edit access')); await click(container.querySelector('input[type="checkbox"]')); await click(confirm()); await click(button('Save application access'))
 assert.equal(calls, 0); assert.match(container.textContent, /grant version is unavailable/)
 await unmount()
 // A directory fetch in flight blocks submission, including a programmatic submit.
 await reset(); await click(button('Edit access')); await click(container.querySelector('input[type="checkbox"]')); await click(confirm())
 let finishList
 listImpl = () => new Promise(resolve => { finishList = resolve })
 await click(button('Refresh directory'))
 await React.act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
 assert.equal(calls, 0)
 listImpl = null
 await React.act(async () => finishList({ items }))
 await unmount()
 // Definitive rejection clears the stored pending operation but requires review again.
 await reset(); updateImpl = async () => { throw new Error('Known rejection') }
 await click(button('Edit access')); await click(container.querySelector('input[type="checkbox"]')); await click(confirm()); await click(button('Save application access'))
 assert.equal(confirm().checked, false)
 assert.equal(window.sessionStorage.length, 0)
 await unmount()
 // Repeated submission while pending cannot send a second mutation.
 await reset(); let release; updateImpl = () => new Promise(resolve => { release = resolve })
 await click(button('Edit access')); await click(container.querySelector('input[type="checkbox"]')); await click(confirm())
 await React.act(async () => {
  const form = container.querySelector('form')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
 })
 assert.equal(calls, 1)
 await React.act(async () => release({}))
 assert.equal(confirm().checked, false); assert.equal(window.sessionStorage.length, 0)
 await unmount()
 // Unavailable recovery storage fails before sending any mutation.
 await reset()
 await click(button('Edit access')); await click(container.querySelector('input[type="checkbox"]')); await click(confirm())
 const originalSetItem = dom.window.Storage.prototype.setItem
 dom.window.Storage.prototype.setItem = () => { throw new Error('Storage unavailable') }
 await click(button('Save application access'))
 dom.window.Storage.prototype.setItem = originalSetItem
 assert.equal(calls, 0); assert.match(container.textContent, /No change was sent/)
 await unmount()
 // Provisioning recovery does not store the local password and reconciles by identity email.
 await reset()
 const inputs = container.querySelectorAll('input')
 await input(inputs[0], 'new@example.test'); await input(inputs[1], 'New member')
 await click(container.querySelector('input[type="checkbox"]'))
 await input(container.querySelector('input[type="password"]'), 'SyntheticTestOnly123!')
 await click(confirm()); await click(button('Create identity and grant access'))
 assert.equal(calls, 1)
 const stored = window.sessionStorage.getItem(window.sessionStorage.key(0))
 assert(!stored.includes('SyntheticTestOnly123!') && !stored.includes('password'))
 assert.equal(container.querySelector('input[type="password"]').value, '')
 items = [...items, { ...member, user_id: '00000000-0000-0000-0000-000000000002', email: 'new@example.test' }]
 await click(button('Refresh directory'))
 assert.equal(window.sessionStorage.length, 0); assert.equal(calls, 1)
 await unmount()
 dom.window.close()
 console.log(`${app}: offline DOM/API lifecycle checks passed (uncertain retry, reload, failure, reconciliation, double submit, no secret storage, successor readiness)`)
})().catch(error => { console.error(error); dom.window.close(); process.exitCode = 1 })
