# The Subreddit Vibe Check

A small dashboard that reads the 50 hottest posts of any subreddit and scores how
positive or negative their titles sound.

## Running it

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173>. There is nothing to configure — no API
keys, no `.env` file.

## How it works

1. You type a subreddit name.
2. The app asks its own `/api/reddit` endpoint for that subreddit's 50 hot posts.
3. The titles are scored **in the browser** with the [`sentiment`](https://www.npmjs.com/package/sentiment)
   library, which adds up the AFINN values of the words it recognises — "great"
   is +3, "terrible" is -3, unknown words count as 0.
4. The dashboard shows the headline numbers, the positive/neutral/negative split,
   and every post with its own score.

## Why the data comes from RSS

The obvious way to build this is Reddit's official API, and that is how it was
built first. It no longer works for a new project:

- **In November 2025 Reddit closed self-service API access.** Under the new
  Responsible Builder Policy, creating an OAuth app now needs manual approval.
  Existing credentials were grandfathered in, but a new app cannot be registered
  on demand — the registration form simply returns a 500.
- **The `.json` endpoints reject anonymous requests.** `/r/{sub}/hot.json`
  answers `403` with an HTML block page, from a browser and from a server alike,
  regardless of `User-Agent`. `old.reddit.com` redirects to a login page.
- **Reddit's RSS feeds are still served anonymously.** `/r/{sub}/hot.rss` returns
  a normal Atom feed, and `?limit=50` is honoured.

So the app reads the RSS feed. The trade-off is that RSS carries the title,
author and permalink but **not** the score or comment count, so the post list
shows the author only. Titles are what the sentiment analysis needs, so the core
of the assignment is unaffected.

### Why there is still a server part

Reddit sends no CORS headers, so the browser cannot read the feed directly, and
Reddit asks for a descriptive `User-Agent`, a header browsers do not let
JavaScript set. `api/reddit.js` makes the request instead, parses the Atom feed,
and returns a small JSON list. The sentiment analysis stays client-side, as the
assignment asks.

### Rate limiting

Anonymous readers are throttled fairly tightly. The endpoint keeps each
subreddit's posts for five minutes, sets `Cache-Control` so Vercel's edge caches
them too, and falls back to the last good copy if Reddit throttles a refresh.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (also serves `/api/reddit`) |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the built files — note that `/api/reddit` is not available here |

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it at <https://vercel.com/new>. The framework preset is detected as Vite.
3. Deploy. `api/reddit.js` is picked up automatically as a serverless function.

No environment variables are needed.

## Layout

```
api/reddit.js            Reads Reddit's RSS feed and returns a tidy JSON list
src/reddit.js            Calls /api/reddit
src/sentiment.js         Scoring and the roll-up shown at the top
src/App.jsx              Holds the state and arranges the pieces
src/components/          Search box, stat tiles, the split bar, the post list
```

## A note on the colours

Positive is blue and negative is red rather than the usual green/red, because
green and red are the pair that colour-blind readers are least able to tell
apart. The three colours were checked against a colour-vision-deficiency
separation test, and every segment is labelled with its name and count as well,
so nothing depends on colour alone.
