import { useState } from 'react';

const FILTERS = [
  { key: 'all', name: 'All' },
  { key: 'positive', name: 'Positive' },
  { key: 'neutral', name: 'Neutral' },
  { key: 'negative', name: 'Negative' },
];

export default function PostList({ posts }) {
  const [filter, setFilter] = useState('all');

  const visiblePosts = filter === 'all' ? posts : posts.filter((post) => post.sentiment === filter);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Every post, scored</h2>
        <div className="filters">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`filter ${filter === option.key ? 'filter-active' : ''}`}
              onClick={() => setFilter(option.key)}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      <ol className="posts">
        {visiblePosts.map((post) => (
          <li key={post.id} className="post">
            <span className={`post-score segment-${post.sentiment}`}>
              {post.sentimentScore > 0 ? `+${post.sentimentScore}` : post.sentimentScore}
            </span>
            <div className="post-body">
              <a className="post-title" href={post.permalink} target="_blank" rel="noreferrer">
                {post.title}
              </a>
              <p className="post-meta">u/{post.author}</p>
            </div>
          </li>
        ))}
      </ol>

      {visiblePosts.length === 0 && <p className="empty">No {filter} titles in this batch.</p>}
    </section>
  );
}
