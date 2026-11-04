export type AccentColor = 'gradient' | 'vitis-silver' | 'vitis-steel' | 'vitis-slate' | 'vitis-midnight'

export const VITIS_THEMES = [
  { id: 'gradient', label: 'Default', description: 'Original Vitis', swatch: 'linear-gradient(90deg,#D1D5DB,#9CA3AF)' },
  { id: 'vitis-silver', label: 'Vitis Silver', description: 'Flowing Pearl – Silver', swatch: 'linear-gradient(135deg,#fcfcfa,#c4c6c8,#85888c)' },
  { id: 'vitis-steel', label: 'Vitis Steel', description: 'Glass Sphere · Blue Satin', swatch: 'linear-gradient(135deg,#dff4ff,#8ac5df,#5485a4)' },
  { id: 'vitis-slate', label: 'Vitis Slate', description: 'Slate Gray · Deep Blue', swatch: 'linear-gradient(135deg,#475569,#174b96)' },
  { id: 'vitis-midnight', label: 'Vitis Midnight', description: 'Charcoal · Midnight blue', swatch: 'linear-gradient(135deg,#1f2937,#102c60)' },
] as const

const LEGACY_THEMES: Record<string, AccentColor> = {
  'frosted-steel': 'vitis-silver',
  'indigo-command': 'vitis-steel',
  'blue-granite': 'vitis-slate',
  'deep-cosmic': 'vitis-midnight',
}

export function normalizeAccent(value: unknown): AccentColor {
  if (typeof value !== 'string') return 'gradient'
  if (Object.prototype.hasOwnProperty.call(LEGACY_THEMES, value)) return LEGACY_THEMES[value]
  return VITIS_THEMES.some(theme => theme.id === value) ? value as AccentColor : 'gradient'
}

export function getVitisTheme(value: unknown) {
  const id = normalizeAccent(value)
  return VITIS_THEMES.find(theme => theme.id === id)!
}
