// Fetches the 50 hottest posts of a subreddit from our own endpoint, which
// reads Reddit's public RSS feed and hands back a small, tidy list.

export async function fetchHotPosts(subreddit) {
  const response = await fetch(`/api/reddit?subreddit=${encodeURIComponent(subreddit)}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Could not load r/${subreddit}.`);
  }

  const { posts } = await response.json();

  if (!posts || posts.length === 0) {
    throw new Error(`r/${subreddit} has no posts, or it does not exist.`);
  }

  return posts;
}
