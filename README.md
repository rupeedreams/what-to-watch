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

## Data — real and refreshed daily

The catalog is **live data from JustWatch's public API** (`apis.justwatch.com`) for India:

- ~380 currently-popular movies & series with real posters, synopses, IMDb scores and Indian age certifications.
- **Real streaming availability** — per-title deep links straight into Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5, Apple TV+, MX Player and Crunchyroll.
- **Leaving Soon** and **Coming Soon** straight from JustWatch's new/upcoming feeds.
- `scripts/fetch-catalog.mjs` fetches and normalizes everything into `src/data/catalog.json` (run `npm run fetch-data`). The deploy workflow re-fetches on every push **and on a daily schedule**, so the live site refreshes automatically; the committed snapshot is the fallback if the API is down.
- Kids flag is conservative: certified U / U-A 7+ **and** not crime/horror.

## Tech

- React 19 + Vite 5, static frontend — user state (genres, watchlist, feedback) lives in `localStorage`.
- Recommendation engine in `src/lib/recommend.js`: genre affinity seeded by onboarding, boosted by likes/watchlist, penalised by dislikes, with rating and popularity nudges.
- Deployed to GitHub Pages via GitHub Actions on every push to `main` + daily data-refresh cron.

## Run locally

```bash
npm install
npm run dev
```

## Roadmap

- Accounts with synced watchlists across devices.
- Native Android/iOS wrappers (Capacitor) once the web experience is validated.
- Larger catalog with language filters (Tamil/Telugu/Malayalam/Bengali cuts).
