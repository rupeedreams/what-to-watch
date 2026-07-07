import { useMemo, useState } from 'react'
import { TITLES, GENRES, PLATFORMS } from './data/titles.js'
import { recommend } from './lib/recommend.js'
import { useStored } from './lib/store.js'
import Onboarding from './components/Onboarding.jsx'
import TitleCard from './components/TitleCard.jsx'
import DetailSheet from './components/DetailSheet.jsx'

function Row({ heading, sub, items, onOpen, watchlist }) {
  if (!items.length) return null
  return (
    <section className="row">
      <div className="row-head">
        <h2>{heading}</h2>
        {sub && <span className="row-sub">{sub}</span>}
      </div>
      <div className="row-scroll">
        {items.map((t) => (
          <TitleCard key={t.id} title={t} onOpen={onOpen} inWatchlist={watchlist.includes(t.id)} />
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [genres, setGenres] = useStored('genres', null)
  const [watchlist, setWatchlist] = useStored('watchlist', [])
  const [feedback, setFeedback] = useStored('feedback', {})
  const [kidsMode, setKidsMode] = useStored('kidsMode', false)
  const [tab, setTab] = useState('home')
  const [detail, setDetail] = useState(null)
  const [editingGenres, setEditingGenres] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [platFilter, setPlatFilter] = useState('')

  const toggleWatchlist = (id) =>
    setWatchlist((wl) => (wl.includes(id) ? wl.filter((x) => x !== id) : [...wl, id]))

  const picks = useMemo(
    () => (genres ? recommend({ selectedGenres: genres, feedback, watchlist, kidsMode }) : []),
    [genres, feedback, watchlist, kidsMode]
  )

  const discoverResults = useMemo(() => {
    if (!genres) return []
    const q = query.trim().toLowerCase()
    return recommend({ selectedGenres: genres, feedback, watchlist, kidsMode, typeFilter: typeFilter || null, limit: 999 })
      .filter((t) => !genreFilter || t.genres.includes(genreFilter))
      .filter((t) => !platFilter || t.platforms.includes(platFilter))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.lang.toLowerCase().includes(q))
  }, [genres, feedback, watchlist, kidsMode, typeFilter, genreFilter, platFilter, query])

  if (!genres || editingGenres) {
    return (
      <Onboarding
        initial={genres || []}
        onDone={(g) => {
          setGenres(g)
          setEditingGenres(false)
          setTab('home')
        }}
      />
    )
  }

  const forYou = picks.slice(0, 14)
  const topMovies = picks.filter((t) => t.type === 'movie').slice(0, 12)
  const topSeries = picks.filter((t) => t.type === 'series').slice(0, 12)
  const comingSoon = TITLES.filter((t) => t.comingSoon && (!kidsMode || t.kidsSafe))
  const leavingSoon = TITLES.filter((t) => t.leavingSoon && (!kidsMode || t.kidsSafe))
  const hiddenGems = picks.filter((t) => t.rating >= 8.2 && !watchlist.includes(t.id) && !feedback[t.id]).slice(6, 18)

  const wlTitles = watchlist.map((id) => TITLES.find((t) => t.id === id)).filter(Boolean)
  const likedCount = Object.values(feedback).filter((v) => v === 'like').length

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🍿 What to Watch</span>
        <div className="topbar-actions">
          <button className={`kids-toggle ${kidsMode ? 'on' : ''}`} onClick={() => setKidsMode(!kidsMode)}
                  title="Show only child-safe titles">
            👶 Kids {kidsMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'home' && (
          <>
            <div className="hero-strip">
              <p>
                Picked for your taste: {genres.map((g) => GENRES.find((x) => x.id === g)?.label).filter(Boolean).join(', ')}
                {likedCount > 0 && ` · tuned by ${likedCount} like${likedCount > 1 ? 's' : ''}`}
                <button className="link-btn" onClick={() => setEditingGenres(true)}>Edit genres</button>
              </p>
              {kidsMode && <p className="kids-note">👶 Kids mode — only child-safe titles are shown.</p>}
            </div>
            <Row heading="🔥 Top picks for you" items={forYou} onOpen={setDetail} watchlist={watchlist} />
            <Row heading="⏳ Leaving soon" sub="Watch before they're gone" items={leavingSoon} onOpen={setDetail} watchlist={watchlist} />
            <Row heading="🔜 Coming soon" sub="Add to watchlist now" items={comingSoon} onOpen={setDetail} watchlist={watchlist} />
            <Row heading="🎬 Best movies for you" items={topMovies} onOpen={setDetail} watchlist={watchlist} />
            <Row heading="📺 Best series for you" items={topSeries} onOpen={setDetail} watchlist={watchlist} />
            <Row heading="💎 Hidden gems" sub="Highly rated, easy to miss" items={hiddenGems} onOpen={setDetail} watchlist={watchlist} />
            <p className="disclaimer">Platform availability is indicative and may change. Tap a platform on any title to open the service.</p>
          </>
        )}

        {tab === 'discover' && (
          <div className="discover">
            <input className="search" type="search" placeholder="Search titles, plots, languages…"
                   value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="chip-row">
              <button className={`chip ${typeFilter === '' ? 'active' : ''}`} onClick={() => setTypeFilter('')}>All</button>
              <button className={`chip ${typeFilter === 'movie' ? 'active' : ''}`} onClick={() => setTypeFilter('movie')}>Movies</button>
              <button className={`chip ${typeFilter === 'series' ? 'active' : ''}`} onClick={() => setTypeFilter('series')}>Series</button>
            </div>
            <div className="chip-row scroll">
              <button className={`chip ${genreFilter === '' ? 'active' : ''}`} onClick={() => setGenreFilter('')}>All genres</button>
              {GENRES.map((g) => (
                <button key={g.id} className={`chip ${genreFilter === g.id ? 'active' : ''}`}
                        onClick={() => setGenreFilter(genreFilter === g.id ? '' : g.id)}>
                  {g.emoji} {g.label}
                </button>
              ))}
            </div>
            <div className="chip-row scroll">
              <button className={`chip ${platFilter === '' ? 'active' : ''}`} onClick={() => setPlatFilter('')}>All platforms</button>
              {Object.entries(PLATFORMS).map(([id, p]) => (
                <button key={id} className={`chip ${platFilter === id ? 'active' : ''}`}
                        onClick={() => setPlatFilter(platFilter === id ? '' : id)}>
                  {p.name}
                </button>
              ))}
            </div>
            <p className="result-count">{discoverResults.length} title{discoverResults.length !== 1 ? 's' : ''}</p>
            <div className="grid">
              {discoverResults.map((t) => (
                <TitleCard key={t.id} title={t} onOpen={setDetail} inWatchlist={watchlist.includes(t.id)} />
              ))}
            </div>
            {discoverResults.length === 0 && <p className="empty">No matches. Try clearing a filter.</p>}
          </div>
        )}

        {tab === 'watchlist' && (
          <div className="discover">
            <h2 className="page-title">🔖 My Watchlist</h2>
            {wlTitles.length === 0 ? (
              <div className="empty">
                <p>Nothing saved yet.</p>
                <p>Open any title and tap <b>➕ Watchlist</b> to keep it here.</p>
                <button className="cta small" onClick={() => setTab('home')}>Browse picks</button>
              </div>
            ) : (
              <div className="grid">
                {wlTitles.map((t) => (
                  <TitleCard key={t.id} title={t} onOpen={setDetail} inWatchlist />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          <span>🏠</span>For You
        </button>
        <button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}>
          <span>🔍</span>Discover
        </button>
        <button className={tab === 'watchlist' ? 'active' : ''} onClick={() => setTab('watchlist')}>
          <span>🔖</span>Watchlist{watchlist.length > 0 && <em className="nav-badge">{watchlist.length}</em>}
        </button>
      </nav>

      {detail && (
        <DetailSheet
          title={detail}
          onClose={() => setDetail(null)}
          onOpen={setDetail}
          watchlist={watchlist}
          toggleWatchlist={toggleWatchlist}
          feedback={feedback}
          setFeedback={setFeedback}
          kidsMode={kidsMode}
        />
      )}
    </div>
  )
}
