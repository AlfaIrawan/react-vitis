import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function loadWorkflowModule(file, localStorage) {
  const source = readFileSync(new URL('../src/modules/workflows/utils/' + file, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', 'localStorage', outputText)(module, module.exports, require, localStorage)
  return module.exports
}

test('legacy workflow opens, saves and reopens with a routed edge without changing its graph identity', () => {
  const original = {
    id: 'legacy-flow', ownerProjectId: 'workspace-a', groupId: 'existing-group',
    name: 'Legacy workflow', version: 4, status: 'draft',
    nodes: [{ id: 'start', data: { type: 'legacy-task' } }, { id: 'finish', data: { type: 'legacy-task' } }],
    edges: [
      { id: 'edge-1', source: 'start', target: 'finish', sourceHandle: 'branch-a', data: { custom: 'keep' } },
      { id: 'edge-2', source: 'start', target: 'finish', type: 'straight' },
    ],
  }
  const key = 'vitis_workflows_workspace-a'
  const stored = new Map([[key, JSON.stringify([original])]])
  const localStorage = { getItem: k => stored.get(k), setItem: (k, v) => stored.set(k, v) }
  const { getWorkflow, updateWorkflow } = loadWorkflowModule('workflowStorage.ts', localStorage)
  const { getWorkflowWaypoint, setWorkflowWaypoint, workflowWaypointPath } = loadWorkflowModule('edgeRouting.ts')
  const loaded = getWorkflow('workspace-a', original.id)
  assert.deepEqual(loaded, original)
  assert.equal(stored.get(key), JSON.stringify([original]))
  assert.equal(getWorkflowWaypoint(loaded.edges[0].data), undefined)
  const point = { x: 60, y: 40 }
  const routed = setWorkflowWaypoint(loaded.edges, 'edge-1', point)
  assert.deepEqual(loaded, original)
  assert.equal(routed[1], loaded.edges[1])
  assert.equal(workflowWaypointPath({ x: 0, y: 0 }, 'right', point, { x: 100, y: 80 }, 'left'),
    'M 0,0 L 60,0 L 60,40 L 60,80 L 100,80')
  updateWorkflow('workspace-a', original.id, { edges: routed })
  const reopened = getWorkflow('workspace-a', original.id)
  assert.equal(reopened.id, original.id)
  assert.equal(reopened.ownerProjectId, original.ownerProjectId)
  assert.equal(reopened.groupId, original.groupId)
  assert.equal(reopened.version, original.version)
  assert.deepEqual(reopened.nodes, original.nodes)
  assert.deepEqual(getWorkflowWaypoint(reopened.edges[0].data), point)
  assert.deepEqual(setWorkflowWaypoint(reopened.edges, 'edge-1'), original.edges)
  assert.deepEqual([...stored.keys()], [key])
})
