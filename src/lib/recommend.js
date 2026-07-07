import { TITLES } from '../data/titles.js'

// Learned genre affinity: selected genres seed it, likes/dislikes/watchlist adjust it.
export function genreAffinity(selectedGenres, feedback, watchlist) {
  const aff = {}
  for (const g of selectedGenres) aff[g] = (aff[g] || 0) + 3
  const byId = Object.fromEntries(TITLES.map((t) => [t.id, t]))
  for (const [id, verdict] of Object.entries(feedback)) {
    const title = byId[id]
    if (!title) continue
    const delta = verdict === 'like' ? 1.5 : -2
    for (const g of title.genres) aff[g] = (aff[g] || 0) + delta
  }
  for (const id of watchlist) {
    const title = byId[id]
    if (!title) continue
    for (const g of title.genres) aff[g] = (aff[g] || 0) + 0.75
  }
  return aff
}

export function scoreTitle(title, aff, feedback) {
  let score = 0
  for (const g of title.genres) score += aff[g] || 0
  score = score / Math.sqrt(title.genres.length)
  score += (title.rating || 7) - 7 // quality nudge
  if (feedback[title.id] === 'dislike') score -= 100
  if (feedback[title.id] === 'like') score += 0.5
  return score
}

export function recommend({ selectedGenres, feedback, watchlist, kidsMode, typeFilter, limit = 40 }) {
  const aff = genreAffinity(selectedGenres, feedback, watchlist)
  return TITLES.filter((t) => !t.comingSoon)
    .filter((t) => !kidsMode || t.kidsSafe)
    .filter((t) => !typeFilter || t.type === typeFilter)
    .map((t) => ({ ...t, score: scoreTitle(t, aff, feedback) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// "More like this": shared genres weighted by rarity + same language/type bonus.
export function moreLikeThis(title, { kidsMode } = {}, limit = 8) {
  const genreCount = {}
  for (const t of TITLES) for (const g of t.genres) genreCount[g] = (genreCount[g] || 0) + 1
  return TITLES.filter((t) => t.id !== title.id && !t.comingSoon)
    .filter((t) => !kidsMode || t.kidsSafe)
    .map((t) => {
      let s = 0
      for (const g of t.genres) if (title.genres.includes(g)) s += 10 / Math.sqrt(genreCount[g])
      if (t.lang === title.lang) s += 1.5
      if (t.type === title.type) s += 1
      s += ((t.rating || 7) - 7) * 0.5
      return { ...t, score: s }
    })
    .filter((t) => t.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
