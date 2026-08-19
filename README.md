# The Subreddit Vibe Check

A small dashboard that reads the 50 hottest posts of any subreddit and scores how
positive or negative their titles sound.

## How it works

1. You type a subreddit name.
2. The app asks its own `/api/reddit` endpoint for that subreddit's 50 hot posts.
   That endpoint is a serverless function which talks to Reddit's official API.
3. The titles are scored **in the browser** with the [`sentiment`](https://www.npmjs.com/package/sentiment)
   library, which adds up the AFINN values of the words it recognises — "great"
   is +3, "terrible" is -3, unknown words count as 0.
4. The dashboard shows the headline numbers, the positive/neutral/negative split,
   and every post with its own score.

### Why there is a server part

The assignment can be read as a frontend-only task, but Reddit no longer allows
it. Its public `.json` URLs reject requests that do not come from a logged-in
browser, and its official API needs a client secret plus a custom `User-Agent`
header — a secret must never be shipped to the browser, and browsers do not let
JavaScript set that header. So the Reddit call happens in `api/reddit.js` and
the browser only ever talks to our own endpoint. The sentiment analysis stays
client-side, as the assignment asks.

## Setup

You need Reddit API credentials.

1. Sign in to Reddit and go to <https://www.reddit.com/prefs/apps>.
2. Click **create another app...**, choose type **script**, and give it any name.
   Redirect URI can be `http://localhost:5173`.
3. After creating it you will see two values: the **client ID** (the string just
   under the app name) and the **secret**.
4. Copy `.env.example` to `.env` and paste them in:

   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_secret
   ```

Then:

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173>.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (also serves `/api/reddit`) |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the built files — note that `/api/reddit` is not available here |

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it at <https://vercel.com/new>. The framework preset is detected as Vite.
3. Under **Environment Variables**, add `REDDIT_CLIENT_ID` and
   `REDDIT_CLIENT_SECRET` with the same values as your `.env`.
4. Deploy. `api/reddit.js` is picked up automatically as a serverless function.

## Layout

```
api/reddit.js            Serverless proxy: Reddit OAuth + the hot-posts request
src/reddit.js            Calls /api/reddit and trims the response to what we use
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
