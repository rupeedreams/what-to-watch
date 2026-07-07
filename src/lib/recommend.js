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
  score += Math.min(title.popularity || 0, 100) / 150 // current-buzz tiebreak
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

// ── "More like this" — item-to-item content similarity ──────────────────────
// The same shape Netflix/Prime use for this rail (item-item similarity), but
// computed over metadata instead of co-watch data. Weights (max ≈ 10):
//
//   genre similarity (Jaccard, rarity-weighted)  0–5.0  — what the story is
//   audio-language overlap                       0–1.5  — Hindi ≠ Korean for most viewers
//   same format (movie vs series)                0–0.7  — series watchers want series
//   era proximity (release-year distance)        0–0.6  — tonal proxy
//   quality (IMDb, vote-weighted)               -1–1.2  — don't recommend junk
//   personal genre affinity                      0–1.0  — tilt ties toward user's taste
//
// A candidate must share at least one *specific* genre signal (score gate),
// which kills the "both are dramas" false matches.
export function moreLikeThis(title, { kidsMode, aff = null } = {}, limit = 10) {
  const genreCount = {}
  for (const t of TITLES) for (const g of t.genres) genreCount[g] = (genreCount[g] || 0) + 1
  const rarity = (g) => 1 / Math.log2(2 + (genreCount[g] || 1)) // rare genres are stronger signals

  const srcGenres = new Set(title.genres)
  const srcLangs = new Set(title.languages || [])
  const srcGenreWeight = title.genres.reduce((s, g) => s + rarity(g), 0) || 1

  return TITLES.filter((t) => t.id !== title.id && !t.comingSoon)
    .filter((t) => !kidsMode || t.kidsSafe)
    .map((t) => {
      // 1. Genre: rarity-weighted Jaccard — penalizes unshared genres on BOTH sides,
      //    so a pure thriller matches a pure thriller better than a 5-genre masala mix.
      let shared = 0
      let unionWeight = srcGenreWeight
      for (const g of t.genres) {
        if (srcGenres.has(g)) shared += rarity(g)
        else unionWeight += rarity(g)
      }
      const genreScore = 5 * (shared / unionWeight)

      // 2. Language: any shared audio language
      const langShared = (t.languages || []).some((l) => srcLangs.has(l))
      const langScore = srcLangs.size && (t.languages || []).length ? (langShared ? 1.5 : 0) : 0.75

      // 3. Format
      const typeScore = t.type === title.type ? 0.7 : 0

      // 4. Era: within ~8 years feels contemporary
      const eraScore = title.year && t.year ? Math.max(0, 0.6 - Math.abs(title.year - t.year) * 0.075) : 0.3

      // 5. Quality: shrink IMDb toward 6.5 when votes are few
      const votes = t.votes || 0
      const shrunk = ((t.rating || 6.5) * votes + 6.5 * 3000) / (votes + 3000)
      const qualityScore = (shrunk - 6.5) * 0.6

      // 6. Personal taste tilt (small — this rail is about the seed title, not the user)
      let affScore = 0
      if (aff) {
        for (const g of t.genres) affScore += aff[g] || 0
        affScore = Math.max(-1, Math.min(1, affScore / 10))
      }

      return { ...t, score: genreScore + langScore + typeScore + eraScore + qualityScore + affScore }
    })
    // Gate: require meaningful genre match, not just any positive score
    .filter((t) => t.score > 2.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
