import { useState } from 'react'
import { GENRES } from '../data/titles.js'

export default function Onboarding({ initial = [], onDone }) {
  const [picked, setPicked] = useState(new Set(initial))
  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="onboarding">
      <div className="onboarding-head">
        <span className="logo-mark">🍿</span>
        <h1>What to Watch</h1>
        <p>Too many OTT apps, too little time. Pick what you love — we'll tell you what's worth watching and <b>where</b> it's streaming.</p>
      </div>
      <h2>Choose 3 or more genres</h2>
      <div className="genre-grid">
        {GENRES.map((g) => (
          <button key={g.id} className={`genre-tile ${picked.has(g.id) ? 'picked' : ''}`} onClick={() => toggle(g.id)}>
            <span className="genre-emoji">{g.emoji}</span>
            {g.label}
            {picked.has(g.id) && <span className="tick">✓</span>}
          </button>
        ))}
      </div>
      <div className="onboarding-foot">
        <button className="cta" disabled={picked.size < 3} onClick={() => onDone([...picked])}>
          {picked.size < 3 ? `Pick ${3 - picked.size} more` : `Show my picks (${picked.size} genres)`}
        </button>
      </div>
    </div>
  )
}
