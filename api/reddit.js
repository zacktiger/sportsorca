// Serverless proxy for the Reddit API (runs on Vercel).
//
// Why this exists:
//   1. Reddit's public .json endpoints now refuse requests that do not come
//      from a logged-in browser, so the app has to use the official OAuth API.
//   2. OAuth needs a client secret, which must never be shipped to the browser.
//   3. Reddit also requires a descriptive User-Agent, a header browsers do not
//      let JavaScript set.
// All three are solved by making the request from the server instead.
//
// Contract: GET /api/reddit?subreddit=<name> -> Reddit's "hot" listing JSON.

const POST_LIMIT = 50;
const USER_AGENT = 'web:subreddit-vibe-check:1.0 (by /u/vibe_check_app)';

// Reddit names are letters, digits and underscores, up to 21 characters.
// Checking this keeps anything odd from being pasted into the URL below.
const VALID_SUBREDDIT = /^[A-Za-z0-9_]{1,21}$/;

// Tokens last an hour, so the one we get is reused until it is nearly expired.
let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Reddit credentials are missing. See the setup steps in README.md.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Reddit rejected the app credentials.');
  }

  const token = await response.json();

  cachedToken = {
    value: token.access_token,
    // Refresh a minute early so a token never expires mid-request.
    expiresAt: Date.now() + (token.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export default async function handler(request, response) {
  const { subreddit } = request.query;

  if (!subreddit || !VALID_SUBREDDIT.test(subreddit)) {
    return response.status(400).json({ error: 'Please provide a valid subreddit name.' });
  }

  try {
    const accessToken = await getAccessToken();

    // raw_json=1 stops Reddit HTML-escaping titles (&amp; instead of &), which
    // would otherwise confuse the sentiment scoring.
    const redditResponse = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/hot?limit=${POST_LIMIT}&raw_json=1`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': USER_AGENT } }
    );

    if (redditResponse.status === 404) {
      return response.status(404).json({ error: `r/${subreddit} does not exist.` });
    }

    if (redditResponse.status === 403) {
      return response.status(403).json({ error: `r/${subreddit} is private or quarantined.` });
    }

    if (!redditResponse.ok) {
      return response
        .status(redditResponse.status)
        .json({ error: `Reddit returned ${redditResponse.status}. Please try again.` });
    }

    const data = await redditResponse.json();

    // Cache briefly so repeated look-ups of the same subreddit do not hit Reddit again.
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json(data);
  } catch (error) {
    return response.status(502).json({ error: error.message });
  }
}
