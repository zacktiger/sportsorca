import { useState } from 'react';
import { fetchHotPosts } from './reddit.js';
import { analysePosts, summarise } from './sentiment.js';
import SubredditForm from './components/SubredditForm.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import SentimentBar from './components/SentimentBar.jsx';
import PostList from './components/PostList.jsx';

export default function App() {
  const [subreddit, setSubreddit] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(name) {
    setIsLoading(true);
    setError('');

    try {
      const hotPosts = await fetchHotPosts(name);
      setPosts(analysePosts(hotPosts));
      setSubreddit(name);
    } catch (problem) {
      setError(problem.message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }

  const summary = posts.length > 0 ? summarise(posts) : null;

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">The Subreddit Vibe Check</h1>
        <p className="subtitle">
          Reads the 50 hottest posts of any subreddit and scores how positive or negative
          their titles sound.
        </p>
      </header>

      <SubredditForm onSearch={handleSearch} isLoading={isLoading} />

      {error && <p className="error">{error}</p>}

      {isLoading && <p className="status">Fetching posts and scoring the titles…</p>}

      {!isLoading && summary && (
        <main className="results">
          <p className="results-for">
            Results for <strong>r/{subreddit}</strong>
          </p>
          <SummaryCards summary={summary} />
          <SentimentBar summary={summary} />
          <PostList posts={posts} />
        </main>
      )}

      {!isLoading && !summary && !error && (
        <p className="status">Pick a subreddit above to get started.</p>
      )}
    </div>
  );
}
