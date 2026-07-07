import { GENRES, PLATFORMS } from '../data/titles.js'

const HUES = [355, 20, 210, 260, 160, 300, 40, 190, 120, 330]
export function posterStyle(title) {
  let h = 0
  for (const c of title.id) h = (h * 31 + c.charCodeAt(0)) % 997
  const hue = HUES[h % HUES.length]
  return {
    background: `linear-gradient(160deg, hsl(${hue},55%,26%) 0%, hsl(${(hue + 40) % 360},60%,14%) 100%)`,
  }
}

export function genreEmoji(title) {
  const g = GENRES.find((g) => g.id === title.genres[0])
  return g ? g.emoji : '🎬'
}

export default function TitleCard({ title, onOpen, inWatchlist, wide }) {
  return (
    <button className={`card ${wide ? 'card-wide' : ''}`} onClick={() => onOpen(title)} aria-label={title.title}>
      <div className="poster" style={posterStyle(title)}>
        <span className="poster-emoji">{genreEmoji(title)}</span>
        <span className="poster-title">{title.title}</span>
        <div className="poster-badges">
          {title.kidsSafe && <span className="badge badge-kids">👶 Kids OK</span>}
          {title.leavingSoon && <span className="badge badge-leaving">⏳ {title.leaving}</span>}
          {title.comingSoon && <span className="badge badge-coming">🔜 {title.expected}</span>}
          {inWatchlist && <span className="badge badge-wl">🔖</span>}
        </div>
        <div className="poster-platforms">
          {title.platforms.map((p) => (
            <span key={p} className="plat-dot" style={{ background: PLATFORMS[p].color }} title={PLATFORMS[p].name} />
          ))}
        </div>
      </div>
      <div className="card-meta">
        <span className="card-sub">
          {title.type === 'series' ? 'Series' : 'Movie'} · {title.lang}
          {title.rating ? ` · ⭐ ${title.rating}` : ''}
        </span>
      </div>
    </button>
  )
}
