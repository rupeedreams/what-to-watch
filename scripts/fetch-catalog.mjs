#!/usr/bin/env node
// Fetches the live Indian OTT catalog from JustWatch's public GraphQL API
// and writes src/data/catalog.json. Run: node scripts/fetch-catalog.mjs

const API = 'https://apis.justwatch.com/graphql'
const COUNTRY = 'IN'
// Major Indian streaming services (JustWatch shortNames)
const PACKAGES = ['nfx', 'prv', 'jhs', 'zee', 'snl', 'atp', 'mxp', 'cru']

const GENRE_MAP = {
  act: 'action', wsn: 'action', war: 'action',
  ani: 'animation',
  cmy: 'comedy',
  crm: 'crime',
  doc: 'documentary', rly: 'documentary', spt: 'documentary',
  drm: 'drama', hst: 'drama', msc: 'drama', eur: 'drama',
  fml: 'family',
  fnt: 'fantasy',
  hrr: 'horror',
  rma: 'romance',
  scf: 'scifi',
  trl: 'thriller',
}

const KID_CERTS = new Set(['U', 'UA7+', 'U/A 7+', 'UA 7+', '7+', 'G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'ALL'])

const CONTENT_FIELDS = `
  title
  originalReleaseYear
  shortDescription
  genres { shortName }
  ageCertification
  posterUrl
  fullPath
  scoring { imdbScore imdbVotes tmdbPopularity }
`

const OFFER_FIELDS = `
  offers(country: $country, platform: WEB, filter: {monetizationTypes: [FLATRATE, FREE, ADS], packages: ${JSON.stringify(PACKAGES)}}) {
    package { shortName clearName }
    standardWebURL
    audioLanguages
  }
`

const POPULAR_QUERY = `
query($country: Country!, $first: Int!, $objectTypes: [ObjectType!]!, $after: String, $packages: [String!]!, $sortBy: PopularTitlesSorting! = POPULAR) {
  popularTitles(country: $country, first: $first, after: $after, sortBy: $sortBy,
    filter: {objectTypes: $objectTypes, packages: $packages, monetizationTypes: [FLATRATE, FREE, ADS]}) {
    pageInfo { endCursor hasNextPage }
    edges { node {
      id objectType
      content(country: $country, language: "en") { ${CONTENT_FIELDS} }
      ... on Movie { ${OFFER_FIELDS} }
      ... on Show { ${OFFER_FIELDS} }
    } }
  }
}`

const NEW_QUERY = `
query($country: Country!, $first: Int!, $pageType: NewPageType!) {
  newTitles(country: $country, first: $first, pageType: $pageType,
    filter: {packages: ${JSON.stringify(PACKAGES)}}) {
    edges { node {
      ... on Movie {
        id objectType
        content(country: $country, language: "en") { ${CONTENT_FIELDS} }
        ${OFFER_FIELDS}
      }
      ... on Season {
        id objectType
        show {
          id objectType
          content(country: $country, language: "en") { ${CONTENT_FIELDS} }
          ${OFFER_FIELDS}
        }
      }
    } }
  }
}`

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'WhatToWatch/1.0 (github.com/rupeedreams/what-to-watch)' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`JustWatch HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error('GraphQL: ' + JSON.stringify(json.errors).slice(0, 500))
  return json.data
}

function poster(url) {
  return url ? `https://images.justwatch.com${url.replace('{profile}', 's332').replace('{format}', 'webp')}` : null
}

function normalize(node, flags = {}) {
  if (node?.show) node = { ...node.show, objectType: 'SHOW' }
  const c = node?.content
  if (!c || !c.title) return null
  const genres = [...new Set((c.genres || []).map((g) => GENRE_MAP[g.shortName]).filter(Boolean))]
  if (!genres.length) genres.push('drama')
  const cert = c.ageCertification || ''
  // Conservative kids flag: certified U/7+ AND no crime/horror (upstream certs are sometimes lax)
  const kidsSafe = KID_CERTS.has(cert) && !genres.some((g) => g === 'crime' || g === 'horror')
  const platforms = (node.offers || []).map((o) => ({
    id: o.package.shortName,
    name: o.package.clearName,
    url: o.standardWebURL || null,
  }))
  // Audio languages available across all offers (ISO 639-1/-2 codes)
  const languages = [...new Set((node.offers || []).flatMap((o) => o.audioLanguages || []))].sort()
  // dedupe platforms
  const seen = new Set()
  const uniqPlatforms = platforms.filter((p) => !seen.has(p.id) && seen.add(p.id))
  return {
    id: node.id,
    type: node.objectType === 'SHOW' ? 'series' : 'movie',
    title: c.title,
    year: c.originalReleaseYear || null,
    summary: c.shortDescription || 'No synopsis available yet.',
    genres,
    maturity: cert || 'NR',
    kidsSafe,
    rating: c.scoring?.imdbScore || null,
    votes: c.scoring?.imdbVotes || 0,
    popularity: c.scoring?.tmdbPopularity || 0,
    languages,
    poster: poster(c.posterUrl),
    jwUrl: c.fullPath ? `https://www.justwatch.com${c.fullPath}` : null,
    platforms: uniqPlatforms,
    ...flags,
  }
}

async function fetchPopular(objectTypes, total, packages, sortBy = 'POPULAR') {
  const edges = []
  let after = null
  while (edges.length < total) {
    const data = await gql(POPULAR_QUERY, { country: COUNTRY, first: 40, objectTypes, after, packages, sortBy })
    const page = data.popularTitles
    edges.push(...page.edges)
    if (!page.pageInfo.hasNextPage) break
    after = page.pageInfo.endCursor
  }
  return edges
}

// Per-platform depth: each service's own top movies + shows, so every
// platform is represented with a real catalog, not just the global chart.
const PER_PLATFORM = { movies: 140, shows: 140 }
const jobs = []
for (const pkg of PACKAGES) {
  jobs.push(() => fetchPopular(['MOVIE'], PER_PLATFORM.movies, [pkg]))
  jobs.push(() => fetchPopular(['SHOW'], PER_PLATFORM.shows, [pkg]))
}
jobs.push(() => gql(NEW_QUERY, { country: COUNTRY, first: 40, pageType: 'LEAVING_SOON' }))
jobs.push(() => gql(NEW_QUERY, { country: COUNTRY, first: 40, pageType: 'UPCOMING' }))
// What India is watching right now (JustWatch trending chart)
jobs.push(() => fetchPopular(['MOVIE', 'SHOW'], 40, PACKAGES, 'TRENDING'))

const results = []
// throttle: 4 concurrent jobs to be polite to the API
for (let i = 0; i < jobs.length; i += 4) {
  results.push(...(await Promise.all(jobs.slice(i, i + 4).map((fn) => fn()))))
  console.log(`  fetched ${Math.min(i + 4, jobs.length)}/${jobs.length} job batches`)
}
const trendingEdges = results.pop()
const upcoming = results.pop()
const leaving = results.pop()
const popularEdges = results.flat()

const byId = new Map()
const add = (edges, flags) => {
  for (const { node } of edges) {
    const t = normalize(node, flags)
    if (!t) continue
    const existing = byId.get(t.id)
    if (existing) Object.assign(existing, flags)
    else byId.set(t.id, t)
  }
}
add(popularEdges, {})
add(leaving.newTitles.edges, { leavingSoon: true })
add(upcoming.newTitles.edges, { comingSoon: true })
trendingEdges.forEach(({ node }, i) => {
  const t = normalize(node, { trendingRank: i + 1 })
  if (!t) return
  const existing = byId.get(t.id)
  if (existing) existing.trendingRank = i + 1
  else byId.set(t.id, t)
})

let titles = [...byId.values()]
  // popular titles must have at least one platform; coming-soon may not yet
  .filter((t) => t.platforms.length > 0 || t.comingSoon)
  // drop shovelware: no rating AND negligible popularity (unless coming/leaving)
  .filter((t) => t.comingSoon || t.leavingSoon || t.rating || t.popularity > 5)

// A title can't be both — "leaving" wins (it's actionable now)
for (const t of titles) if (t.leavingSoon && t.comingSoon) delete t.comingSoon

const platformsSeen = {}
for (const t of titles) for (const p of t.platforms) platformsSeen[p.id] = p.name

const catalog = {
  fetchedAt: new Date().toISOString(),
  country: COUNTRY,
  source: 'JustWatch (apis.justwatch.com)',
  counts: {
    total: titles.length,
    movies: titles.filter((t) => t.type === 'movie').length,
    series: titles.filter((t) => t.type === 'series').length,
    leavingSoon: titles.filter((t) => t.leavingSoon).length,
    comingSoon: titles.filter((t) => t.comingSoon).length,
    kidsSafe: titles.filter((t) => t.kidsSafe).length,
    trending: titles.filter((t) => t.trendingRank).length,
  },
  platforms: platformsSeen,
  titles,
}

const { writeFileSync, mkdirSync } = await import('node:fs')
mkdirSync(new URL('../public/', import.meta.url), { recursive: true })
writeFileSync(new URL('../public/catalog.json', import.meta.url), JSON.stringify(catalog))
const perPlatform = {}
for (const t of titles) for (const p of t.platforms) perPlatform[p.name] = (perPlatform[p.name] || 0) + 1
console.log('Catalog written:', JSON.stringify(catalog.counts))
console.log('Per platform:', JSON.stringify(perPlatform))
