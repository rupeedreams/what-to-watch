# 🍿 What to Watch

**Live app:** https://rupeedreams.github.io/what-to-watch/

India has too many OTT subscriptions and no easy answer to "what should I watch tonight, and where?" This mobile-first web app solves that:

- **Genre onboarding** — pick 3+ genres you love; recommendations are built from them.
- **For You feed** — top picks, best movies, best series, and hidden gems ranked by a scoring engine that learns from your behaviour.
- **Where to watch** — every title clearly shows which OTT platform streams it (Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5, Apple TV+), with a tap-through link.
- **Summaries** — every movie/series has a crisp plot summary, rating, year and language.
- **Watchlist** — save anything for later (persisted locally).
- **Like / Dislike feedback** — votes retune your recommendations automatically.
- **More like this** — open any title to get similar picks based on genre overlap, language and format.
- **Coming Soon & Leaving Soon** — catch titles before they leave, watchlist ones that haven't dropped.
- **Kids mode** — one toggle filters everything down to child-safe titles (Indian CBFC-style maturity ratings: U / U-A / A shown per title).

## Tech

- React 19 + Vite 5, no backend — the catalog is a curated dataset in `src/data/titles.js`; user state lives in `localStorage`.
- Recommendation engine in `src/lib/recommend.js`: genre affinity seeded by onboarding, boosted by likes/watchlist, penalised by dislikes, with a rating-quality nudge.
- Deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Run locally

```bash
npm install
npm run dev
```

## Roadmap

- Live catalog + availability via a metadata API (e.g. TMDB + JustWatch) instead of the static dataset.
- Accounts with synced watchlists across devices.
- Native Android/iOS wrappers (Capacitor) once the web experience is validated.

> Platform availability is indicative and may change; verify on the platform.
