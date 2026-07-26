import {
  Database,
  FileText,
  Filter,
  GitBranch,
  Code,
  Terminal,
  Sparkles,
  ArrowRightLeft,
  Layers,
  Split,
  Merge,
  BarChart3,
  TrendingUp,
  ArrowUpDown,
  Table,
  FileCode,
  DatabaseZap,
  Cpu,
} from 'lucide-react'

export type NodeCategory = 'data-preparation' | 'code-execution'
export type NodeSubCategory =
  | 'ingestion-sync'
  | 'cleansing-shaping'
  | 'join-aggregation'
  | 'analytical-transform'
  | 'general-code'
  | 'sql-execution'
  | 'distributed-processing'

export interface NodeInput {
  id: string
  name: string
  type: 'dataset' | 'any'
  required: boolean
}

export interface NodeOutput {
  id: string
  name: string
  type: 'dataset' | 'any'
}

export interface NodeConfigSchema {
  type: 'form' | 'code'
  fields?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect'
    label: string
    required?: boolean
    options?: Array<{ value: string; label: string }>
    placeholder?: string
    default?: any
  }>
  codeLanguage?: 'python' | 'r' | 'shell' | 'sql' | 'spark-sql'
}

export interface CatalogNode {
  id: string
  name: string
  description: string
  category: NodeCategory
  subCategory: NodeSubCategory
  icon: React.ComponentType<{ className?: string }>
  inputs: NodeInput[]
  outputs: NodeOutput[]
  configSchema: NodeConfigSchema
  requiresExpertise?: boolean
  previewable?: boolean
}

export const NODE_CATALOG: CatalogNode[] = [
  // ==================================================
  // DATA PREPARATION - Ingestion & Sync
  // ==================================================
  {
    id: 'sync',
    name: 'Sync',
    description: 'Copy datasets between storage locations (Database, Object Storage, File System)',
    category: 'data-preparation',
    subCategory: 'ingestion-sync',
    icon: ArrowRightLeft,
    inputs: [{ id: 'input', name: 'Source Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Synced Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'sourceType',
          type: 'select',
          label: 'Source Type',
          required: true,
          options: [
            { value: 'database', label: 'Database' },
            { value: 'object-storage', label: 'Object Storage' },
            { value: 'file-system', label: 'File System' },
          ],
        },
        {
          name: 'targetType',
          type: 'select',
          label: 'Target Type',
          required: true,
          options: [
            { value: 'database', label: 'Database' },
            { value: 'object-storage', label: 'Object Storage' },
            { value: 'file-system', label: 'File System' },
          ],
        },
        {
          name: 'sourcePath',
          type: 'string',
          label: 'Source Path',
          required: true,
          placeholder: 'e.g., s3://bucket/path',
        },
        {
          name: 'targetPath',
          type: 'string',
          label: 'Target Path',
          required: true,
          placeholder: 'e.g., s3://bucket/path',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'prepare',
    name: 'Prepare',
    description: 'Initial schema validation, type casting, null checks',
    category: 'data-preparation',
    subCategory: 'ingestion-sync',
    icon: Layers,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Prepared Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'validateSchema',
          type: 'boolean',
          label: 'Validate Schema',
          default: true,
        },
        {
          name: 'castTypes',
          type: 'boolean',
          label: 'Auto Cast Types',
          default: true,
        },
        {
          name: 'handleNulls',
          type: 'select',
          label: 'Handle Nulls',
          options: [
            { value: 'drop', label: 'Drop Rows' },
            { value: 'fill', label: 'Fill with Default' },
            { value: 'keep', label: 'Keep as Null' },
          ],
        },
      ],
    },
    previewable: true,
  },

  // ==================================================
  // DATA PREPARATION - Cleansing & Shaping
  // ==================================================
  {
    id: 'cleanse',
    name: 'Cleanse',
    description: 'Cleanse, normalize, and enrich data using predefined processors',
    category: 'data-preparation',
    subCategory: 'cleansing-shaping',
    icon: Filter,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Cleansed Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'operations',
          type: 'multiselect',
          label: 'Cleansing Operations',
          options: [
            { value: 'trim-whitespace', label: 'Trim Whitespace' },
            { value: 'lowercase', label: 'Lowercase' },
            { value: 'uppercase', label: 'Uppercase' },
            { value: 'remove-special', label: 'Remove Special Characters' },
            { value: 'normalize-unicode', label: 'Normalize Unicode' },
          ],
        },
        {
          name: 'columns',
          type: 'string',
          label: 'Target Columns (comma-separated)',
          placeholder: 'column1, column2',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'distinct',
    name: 'Distinct',
    description: 'Remove duplicate rows',
    category: 'data-preparation',
    subCategory: 'cleansing-shaping',
    icon: Database,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Unique Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'columns',
          type: 'string',
          label: 'Columns to Check (leave empty for all)',
          placeholder: 'column1, column2',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Split dataset into multiple outputs based on conditions',
    category: 'data-preparation',
    subCategory: 'cleansing-shaping',
    icon: Split,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [
      { id: 'output1', name: 'Output 1', type: 'dataset' },
      { id: 'output2', name: 'Output 2', type: 'dataset' },
    ],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'condition',
          type: 'string',
          label: 'Split Condition',
          required: true,
          placeholder: 'e.g., column1 > 100',
        },
        {
          name: 'output1Name',
          type: 'string',
          label: 'Output 1 Name',
          default: 'True Branch',
        },
        {
          name: 'output2Name',
          type: 'string',
          label: 'Output 2 Name',
          default: 'False Branch',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'Combine multiple datasets into one',
    category: 'data-preparation',
    subCategory: 'cleansing-shaping',
    icon: Merge,
    inputs: [
      { id: 'input1', name: 'Dataset 1', type: 'dataset', required: true },
      { id: 'input2', name: 'Dataset 2', type: 'dataset', required: true },
    ],
    outputs: [{ id: 'output', name: 'Stacked Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'mode',
          type: 'select',
          label: 'Stack Mode',
          required: true,
          options: [
            { value: 'vertical', label: 'Vertical (Append Rows)' },
            { value: 'horizontal', label: 'Horizontal (Append Columns)' },
          ],
        },
      ],
    },
    previewable: true,
  },

  // ==================================================
  // DATA PREPARATION - Join & Aggregation
  // ==================================================
  {
    id: 'join',
    name: 'Join',
    description: 'Merge datasets by key. Join types: Inner, Left, Right, Full',
    category: 'data-preparation',
    subCategory: 'join-aggregation',
    icon: Merge,
    inputs: [
      { id: 'left', name: 'Left Dataset', type: 'dataset', required: true },
      { id: 'right', name: 'Right Dataset', type: 'dataset', required: true },
    ],
    outputs: [{ id: 'output', name: 'Joined Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'joinType',
          type: 'select',
          label: 'Join Type',
          required: true,
          options: [
            { value: 'inner', label: 'Inner Join' },
            { value: 'left', label: 'Left Join' },
            { value: 'right', label: 'Right Join' },
            { value: 'full', label: 'Full Outer Join' },
          ],
        },
        {
          name: 'leftKey',
          type: 'string',
          label: 'Left Key Column',
          required: true,
        },
        {
          name: 'rightKey',
          type: 'string',
          label: 'Right Key Column',
          required: true,
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'group',
    name: 'Group',
    description: 'Aggregate data (SUM, AVG, COUNT, MIN, MAX)',
    category: 'data-preparation',
    subCategory: 'join-aggregation',
    icon: BarChart3,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Aggregated Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'groupBy',
          type: 'string',
          label: 'Group By Columns',
          required: true,
          placeholder: 'column1, column2',
        },
        {
          name: 'aggregations',
          type: 'string',
          label: 'Aggregations (JSON)',
          required: true,
          placeholder: '{"column1": "sum", "column2": "avg"}',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'window',
    name: 'Window',
    description: 'Analytical functions (rank, lag, lead, moving average)',
    category: 'data-preparation',
    subCategory: 'join-aggregation',
    icon: TrendingUp,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Windowed Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'partitionBy',
          type: 'string',
          label: 'Partition By',
          placeholder: 'column1, column2',
        },
        {
          name: 'orderBy',
          type: 'string',
          label: 'Order By',
          required: true,
          placeholder: 'column1 ASC',
        },
        {
          name: 'function',
          type: 'select',
          label: 'Window Function',
          required: true,
          options: [
            { value: 'rank', label: 'Rank' },
            { value: 'dense_rank', label: 'Dense Rank' },
            { value: 'lag', label: 'Lag' },
            { value: 'lead', label: 'Lead' },
            { value: 'moving_avg', label: 'Moving Average' },
          ],
        },
        {
          name: 'windowSize',
          type: 'number',
          label: 'Window Size',
          placeholder: '3',
        },
      ],
    },
    previewable: true,
  },

  // ==================================================
  // DATA PREPARATION - Analytical Transform
  // ==================================================
  {
    id: 'top-n',
    name: 'Top N',
    description: 'Select top or bottom records based on metrics',
    category: 'data-preparation',
    subCategory: 'analytical-transform',
    icon: ArrowUpDown,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Top N Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'n',
          type: 'number',
          label: 'N',
          required: true,
          default: 10,
        },
        {
          name: 'orderBy',
          type: 'string',
          label: 'Order By Column',
          required: true,
        },
        {
          name: 'direction',
          type: 'select',
          label: 'Direction',
          required: true,
          options: [
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
          ],
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'pivot',
    name: 'Pivot',
    description: 'Rotate rows into columns',
    category: 'data-preparation',
    subCategory: 'analytical-transform',
    icon: Table,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Pivoted Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'index',
          type: 'string',
          label: 'Index Column',
          required: true,
        },
        {
          name: 'columns',
          type: 'string',
          label: 'Columns to Pivot',
          required: true,
        },
        {
          name: 'values',
          type: 'string',
          label: 'Values Column',
          required: true,
        },
        {
          name: 'aggfunc',
          type: 'select',
          label: 'Aggregation Function',
          options: [
            { value: 'sum', label: 'Sum' },
            { value: 'mean', label: 'Mean' },
            { value: 'count', label: 'Count' },
            { value: 'max', label: 'Max' },
            { value: 'min', label: 'Min' },
          ],
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'filter',
    name: 'Filter',
    description: 'Filter rows using conditions',
    category: 'data-preparation',
    subCategory: 'analytical-transform',
    icon: Filter,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Filtered Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'condition',
          type: 'string',
          label: 'Filter Condition',
          required: true,
          placeholder: 'e.g., column1 > 100 AND column2 == "value"',
        },
      ],
    },
    previewable: true,
  },
  {
    id: 'sort',
    name: 'Sort',
    description: 'Sort dataset by one or more columns',
    category: 'data-preparation',
    subCategory: 'analytical-transform',
    icon: ArrowUpDown,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: true }],
    outputs: [{ id: 'output', name: 'Sorted Dataset', type: 'dataset' }],
    configSchema: {
      type: 'form',
      fields: [
        {
          name: 'columns',
          type: 'string',
          label: 'Sort Columns',
          required: true,
          placeholder: 'column1 ASC, column2 DESC',
        },
      ],
    },
    previewable: true,
  },

  // ==================================================
  // CODE & EXECUTION - General Purpose Code
  // ==================================================
  {
    id: 'python',
    name: 'Python',
    description: 'Pandas / NumPy based data processing',
    category: 'code-execution',
    subCategory: 'general-code',
    icon: FileCode,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Output Dataset', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'python',
    },
    requiresExpertise: true,
  },
  {
    id: 'r',
    name: 'R',
    description: 'Statistical and data science scripting',
    category: 'code-execution',
    subCategory: 'general-code',
    icon: Code,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Output Dataset', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'r',
    },
    requiresExpertise: true,
  },
  {
    id: 'shell',
    name: 'Shell',
    description: 'Run shell commands and scripts',
    category: 'code-execution',
    subCategory: 'general-code',
    icon: Terminal,
    inputs: [{ id: 'input', name: 'Input', type: 'any', required: false }],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'shell',
    },
    requiresExpertise: true,
  },

  // ==================================================
  // CODE & EXECUTION - SQL Execution
  // ==================================================
  {
    id: 'sql',
    name: 'SQL',
    description: 'Execute raw SQL against a database',
    category: 'code-execution',
    subCategory: 'sql-execution',
    icon: DatabaseZap,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Query Result', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'sql',
    },
    requiresExpertise: true,
  },
  {
    id: 'spark-sql',
    name: 'Spark SQL',
    description: 'Distributed SQL execution using Spark',
    category: 'code-execution',
    subCategory: 'sql-execution',
    icon: Sparkles,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Query Result', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'spark-sql',
    },
    requiresExpertise: true,
  },

  // ==================================================
  // CODE & EXECUTION - Distributed Processing
  // ==================================================
  {
    id: 'pyspark',
    name: 'PySpark',
    description: 'Python-based Spark processing',
    category: 'code-execution',
    subCategory: 'distributed-processing',
    icon: Cpu,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Output Dataset', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'python',
    },
    requiresExpertise: true,
  },
  {
    id: 'sparkr',
    name: 'SparkR',
    description: 'Spark execution using R',
    category: 'code-execution',
    subCategory: 'distributed-processing',
    icon: Cpu,
    inputs: [{ id: 'input', name: 'Input Dataset', type: 'dataset', required: false }],
    outputs: [{ id: 'output', name: 'Output Dataset', type: 'dataset' }],
    configSchema: {
      type: 'code',
      codeLanguage: 'r',
    },
    requiresExpertise: true,
  },
]

// Helper functions
export function getNodeById(id: string): CatalogNode | undefined {
  return NODE_CATALOG.find((node) => node.id === id)
}

export function getNodesByCategory(category: NodeCategory): CatalogNode[] {
  return NODE_CATALOG.filter((node) => node.category === category)
}

export function getNodesBySubCategory(subCategory: NodeSubCategory): CatalogNode[] {
  return NODE_CATALOG.filter((node) => node.subCategory === subCategory)
}

export function searchNodes(query: string): CatalogNode[] {
  const lowerQuery = query.toLowerCase()
  return NODE_CATALOG.filter(
    (node) =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery)
  )
}

// Category metadata
export const CATEGORY_METADATA = {
  'data-preparation': {
    label: 'Data Preparation',
    description: 'No-Code, Visual',
    icon: Database,
    color: 'bg-blue-500/20 border-blue-500/50 text-blue-600',
  },
  'code-execution': {
    label: 'Code & Execution',
    description: 'Advanced',
    icon: Code,
    color: 'bg-orange-500/20 border-orange-500/50 text-orange-600',
  },
} as const

// Sub-category metadata
export const SUB_CATEGORY_METADATA: Record<NodeSubCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'ingestion-sync': { label: 'Ingestion & Sync', icon: ArrowRightLeft },
  'cleansing-shaping': { label: 'Cleansing & Shaping', icon: Filter },
  'join-aggregation': { label: 'Join & Aggregation', icon: Merge },
  'analytical-transform': { label: 'Analytical Transform', icon: BarChart3 },
  'general-code': { label: 'General Purpose Code', icon: FileCode },
  'sql-execution': { label: 'SQL Execution', icon: DatabaseZap },
  'distributed-processing': { label: 'Distributed Processing', icon: Cpu },
}
