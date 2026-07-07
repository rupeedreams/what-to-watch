import { useEffect } from 'react'
import { GENRES, platformColor } from '../data/titles.js'
import { moreLikeThis } from '../lib/recommend.js'
import TitleCard, { posterStyle } from './TitleCard.jsx'

export default function DetailSheet({ title, onClose, onOpen, watchlist, toggleWatchlist, feedback, setFeedback, kidsMode }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!title) return null
  const similar = moreLikeThis(title, { kidsMode })
  const verdict = feedback[title.id]
  const inWl = watchlist.includes(title.id)

  const vote = (v) =>
    setFeedback((f) => {
      const next = { ...f }
      if (next[title.id] === v) delete next[title.id]
      else next[title.id] = v
      return next
    })

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="sheet-hero" style={posterStyle(title)}>
          {title.poster && <img className="sheet-poster" src={title.poster} alt="" />}
          <div className="sheet-hero-text">
            <h2>{title.title}</h2>
            <p className="sheet-sub">
              {title.type === 'series' ? 'TV Series' : 'Movie'}
              {title.year ? ` · ${title.year}` : ''}
              {title.rating ? ` · ⭐ ${title.rating.toFixed(1)} IMDb` : ''}
            </p>
            <div className="sheet-flags">
              <span className={`badge ${title.kidsSafe ? 'badge-kids' : 'badge-adult'}`}>
                {title.kidsSafe
                  ? '👶 Safe for children'
                  : title.maturity === 'NR'
                    ? '⚠️ Not rated — parental discretion'
                    : `🔞 ${title.maturity} — not for young kids`}
              </span>
              {title.comingSoon && <span className="badge badge-coming">🔜 Coming soon</span>}
              {title.leavingSoon && <span className="badge badge-leaving">⏳ Leaving soon</span>}
            </div>
          </div>
        </div>

        <div className="sheet-body">
          <div className="chip-row">
            {title.genres.map((g) => {
              const genre = GENRES.find((x) => x.id === g)
              return <span key={g} className="chip chip-static">{genre?.emoji} {genre?.label || g}</span>
            })}
          </div>

          <p className="summary">{title.summary}</p>

          <h3>Where to watch</h3>
          {title.platforms.length === 0 ? (
            <p className="hint">Streaming platform yet to be announced — add it to your watchlist to keep an eye on it.</p>
          ) : (
            <div className="platform-list">
              {title.platforms.map((p) => (
                <a key={p.id} className="platform-pill" href={p.url || title.jwUrl} target="_blank" rel="noreferrer"
                   style={{ borderColor: platformColor(p.id) }}>
                  <span className="plat-dot" style={{ background: platformColor(p.id) }} />
                  {p.name} ↗
                </a>
              ))}
            </div>
          )}
          {title.jwUrl && (
            <p className="hint">
              <a href={title.jwUrl} target="_blank" rel="noreferrer" className="jw-link">
                Check latest availability on JustWatch ↗
              </a>
            </p>
          )}

          <div className="action-row">
            <button className={`action ${inWl ? 'active' : ''}`} onClick={() => toggleWatchlist(title.id)}>
              {inWl ? '🔖 In watchlist' : '➕ Watchlist'}
            </button>
            <button className={`action ${verdict === 'like' ? 'active like' : ''}`} onClick={() => vote('like')}>
              👍 {verdict === 'like' ? 'Liked' : 'Like'}
            </button>
            <button className={`action ${verdict === 'dislike' ? 'active dislike' : ''}`} onClick={() => vote('dislike')}>
              👎 {verdict === 'dislike' ? 'Disliked' : 'Dislike'}
            </button>
          </div>
          <p className="hint">Your likes and dislikes tune your recommendations automatically.</p>

          {similar.length > 0 && (
            <>
              <h3>More like this</h3>
              <div className="row-scroll">
                {similar.map((s) => (
                  <TitleCard key={s.id} title={s} onOpen={onOpen} inWatchlist={watchlist.includes(s.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
