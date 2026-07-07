import { GENRES, platformColor } from '../data/titles.js'

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

export default function TitleCard({ title, onOpen, inWatchlist }) {
  return (
    <button className="card" onClick={() => onOpen(title)} aria-label={title.title}>
      <div className="poster" style={posterStyle(title)}>
        {title.poster
          ? <img className="poster-img" src={title.poster} alt="" loading="lazy" />
          : <span className="poster-title">{title.title}</span>}
        <div className="poster-badges">
          {title.kidsSafe && <span className="badge badge-kids">👶</span>}
          {title.leavingSoon && <span className="badge badge-leaving">⏳ Leaving soon</span>}
          {title.comingSoon && <span className="badge badge-coming">🔜 Soon</span>}
          {inWatchlist && <span className="badge badge-wl">🔖</span>}
        </div>
        <div className="poster-platforms">
          {title.platforms.map((p) => (
            <span key={p.id} className="plat-dot" style={{ background: platformColor(p.id) }} title={p.name} />
          ))}
        </div>
      </div>
      <div className="card-meta">
        <span className="card-title">{title.title}</span>
        <span className="card-sub">
          {title.type === 'series' ? 'Series' : 'Movie'}
          {title.year ? ` · ${title.year}` : ''}
          {title.rating ? ` · ⭐ ${title.rating.toFixed(1)}` : ''}
        </span>
      </div>
    </button>
  )
}
