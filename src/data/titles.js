// Live catalog fetched from JustWatch (India) by scripts/fetch-catalog.mjs
// into public/catalog.json, loaded at runtime. Refresh: npm run fetch-data

export const GENRES = [
  { id: 'action', label: 'Action', emoji: '💥' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'drama', label: 'Drama', emoji: '🎭' },
  { id: 'thriller', label: 'Thriller', emoji: '🔪' },
  { id: 'crime', label: 'Crime', emoji: '🕵️' },
  { id: 'romance', label: 'Romance', emoji: '❤️' },
  { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'horror', label: 'Horror', emoji: '👻' },
  { id: 'family', label: 'Family & Kids', emoji: '👨‍👩‍👧' },
  { id: 'animation', label: 'Animation', emoji: '🎨' },
  { id: 'documentary', label: 'Documentary', emoji: '🎥' },
]

// Brand colors keyed by JustWatch package shortName; fallback for anything new.
const PLATFORM_COLORS = {
  nfx: '#E50914',
  prv: '#00A8E1',
  jhs: '#1F80E0',
  snl: '#7B2CBF',
  zee: '#8230C6',
  atp: '#8E8E93',
  mxp: '#F5C518',
  cru: '#F47521',
}
export const platformColor = (id) => PLATFORM_COLORS[id] || '#64748b'

// Populated by loadCatalog(); ES live bindings keep importers up to date.
export let TITLES = []
export let PLATFORMS = {}
export let CATALOG_META = { fetchedAt: null, source: '', counts: { total: 0 } }

export async function loadCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL}catalog.json`)
  if (!res.ok) throw new Error(`Catalog load failed (HTTP ${res.status})`)
  const catalog = await res.json()
  TITLES = catalog.titles
  PLATFORMS = catalog.platforms
  CATALOG_META = { fetchedAt: catalog.fetchedAt, source: catalog.source, counts: catalog.counts }
  return catalog
}
