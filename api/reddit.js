// Serverless proxy for Reddit's public RSS feed (runs on Vercel).
//
// Why this exists:
//   1. In November 2025 Reddit closed self-service API access. New OAuth apps
//      now need manual approval, so the official API is not an option here.
//   2. The .json endpoints refuse anonymous requests outright - they answer 403
//      with an HTML block page, from a browser and from a server alike.
//   3. The RSS feed is still served anonymously, and it carries the titles the
//      sentiment analysis needs.
//   4. Browsers cannot call it directly anyway: Reddit sends no CORS headers,
//      and it wants a descriptive User-Agent, a header browsers refuse to set.
//
// Contract: GET /api/reddit?subreddit=<name> -> { posts: [...] }

const POST_LIMIT = 50;
const USER_AGENT = 'web:subreddit-vibe-check:1.0 (by /u/No-Reading2857)';

// Reddit names are letters, digits and underscores, up to 21 characters.
// Checking this keeps anything odd from being pasted into the URL below.
const VALID_SUBREDDIT = /^[A-Za-z0-9_]{1,21}$/;

// Reddit throttles anonymous readers tightly, so each subreddit's posts are
// kept for a few minutes. A warm serverless instance reuses this between
// requests, which keeps most look-ups from reaching Reddit at all.
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

// Atom escapes the title text, and "&amp;" or "&#39;" in the middle of a word
// would throw off the word-by-word sentiment scoring.
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (match, name) => ENTITIES[name] ?? match);
}

function firstTag(entry, name) {
  const match = entry.match(new RegExp('<' + name + '[^>]*>(.*?)</' + name + '>', 's'));
  return match ? decodeEntities(match[1]).trim() : '';
}

// The feed is a predictable Atom document from a single source, so it is read
// with a few expressions rather than by pulling in an XML parser.
function parseFeed(xml) {
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => {
      const link = entry.match(/<link[^>]*href="([^"]+)"/);
      return {
        // Reddit ids look like "t3_1vrvh7h" - the part after the underscore is
        // the post id used everywhere else.
        id: firstTag(entry, 'id').replace(/^t3_/, ''),
        title: firstTag(entry, 'title'),
        // Authors arrive as "/u/name"; the dashboard adds its own "u/" prefix.
        author: firstTag(entry, 'name').replace(/^\/u\//, ''),
        permalink: link ? link[1] : '',
      };
    })
    .filter((post) => post.title);
}

export default async function handler(request, response) {
  const { subreddit } = request.query;

  if (!subreddit || !VALID_SUBREDDIT.test(subreddit)) {
    return response.status(400).json({ error: 'Please provide a valid subreddit name.' });
  }

  const key = subreddit.toLowerCase();
  const cached = cache.get(key);

  if (cached && Date.now() - cached.storedAt < CACHE_MS) {
    return response.status(200).json({ posts: cached.posts });
  }

  try {
    const feedResponse = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.rss?limit=${POST_LIMIT}`,
      { headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml' } }
    );

    if (feedResponse.status === 404) {
      return response.status(404).json({ error: `r/${subreddit} does not exist.` });
    }

    if (feedResponse.status === 403) {
      return response.status(403).json({ error: `r/${subreddit} is private or quarantined.` });
    }

    // Being throttled is the common failure here, so it is worth explaining
    // rather than reporting as a generic error. A stale copy, if we have one,
    // beats showing the reader nothing at all.
    if (feedResponse.status === 429) {
      if (cached) {
        return response.status(200).json({ posts: cached.posts });
      }
      return response
        .status(429)
        .json({ error: 'Reddit is rate limiting us right now. Please try again in a minute.' });
    }

    if (!feedResponse.ok) {
      return response
        .status(feedResponse.status)
        .json({ error: `Reddit returned ${feedResponse.status}. Please try again.` });
    }

    const posts = parseFeed(await feedResponse.text()).slice(0, POST_LIMIT);
    cache.set(key, { posts, storedAt: Date.now() });

    // Vercel's edge caches this too, so repeated look-ups of the same subreddit
    // do not even reach the function. Hot posts do not move faster than this.
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({ posts });
  } catch (error) {
    if (cached) {
      return response.status(200).json({ posts: cached.posts });
    }
    return response.status(502).json({ error: 'Could not reach Reddit. Please try again.' });
  }
}
