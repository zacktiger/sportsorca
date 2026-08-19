// Fetches the top 50 "Hot" posts of a subreddit and reduces Reddit's very
// large response down to the handful of fields the dashboard actually uses.

export async function fetchHotPosts(subreddit) {
  const response = await fetch(`/api/reddit?subreddit=${encodeURIComponent(subreddit)}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Could not load r/${subreddit}.`);
  }

  const data = await response.json();
  const children = data?.data?.children ?? [];

  if (children.length === 0) {
    throw new Error(`r/${subreddit} has no posts, or it does not exist.`);
  }

  return children.map((child) => ({
    id: child.data.id,
    title: child.data.title,
    author: child.data.author,
    score: child.data.score,
    numComments: child.data.num_comments,
    permalink: `https://www.reddit.com${child.data.permalink}`,
  }));
}
