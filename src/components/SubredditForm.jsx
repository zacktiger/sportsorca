import { useState } from 'react';

const SUGGESTIONS = ['wholesomememes', 'news', 'AskReddit', 'science', 'gaming'];

export default function SubredditForm({ onSearch, isLoading }) {
  const [value, setValue] = useState('wholesomememes');

  function handleSubmit(event) {
    event.preventDefault();
    const subreddit = value.trim();
    if (subreddit) onSearch(subreddit);
  }

  function handleSuggestion(subreddit) {
    setValue(subreddit);
    onSearch(subreddit);
  }

  return (
    <div className="search">
      <form className="search-row" onSubmit={handleSubmit}>
        <span className="search-prefix">r/</span>
        <input
          className="search-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="subreddit name"
          aria-label="Subreddit name"
        />
        <button className="search-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Checking…' : 'Check the vibe'}
        </button>
      </form>

      <div className="suggestions">
        <span className="suggestions-label">Try:</span>
        {SUGGESTIONS.map((subreddit) => (
          <button
            key={subreddit}
            type="button"
            className="suggestion"
            onClick={() => handleSuggestion(subreddit)}
            disabled={isLoading}
          >
            r/{subreddit}
          </button>
        ))}
      </div>
    </div>
  );
}
