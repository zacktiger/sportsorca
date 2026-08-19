// One stacked bar showing how the 50 titles split across the three sentiments.
// Every segment is also named and counted in the legend below, so the split can
// be read without relying on colour alone.

const SEGMENTS = [
  { key: 'positive', name: 'Positive' },
  { key: 'neutral', name: 'Neutral' },
  { key: 'negative', name: 'Negative' },
];

export default function SentimentBar({ summary }) {
  return (
    <section className="panel">
      <h2 className="panel-title">Sentiment of the 50 hot titles</h2>

      <div className="bar" role="img" aria-label={
        SEGMENTS.map((s) => `${s.name}: ${summary.counts[s.key]}`).join(', ')
      }>
        {SEGMENTS.map((segment) => {
          const count = summary.counts[segment.key];
          if (count === 0) return null;
          return (
            <div
              key={segment.key}
              className={`bar-segment segment-${segment.key}`}
              style={{ width: `${(count / summary.total) * 100}%` }}
              title={`${segment.name}: ${count} posts`}
            />
          );
        })}
      </div>

      <ul className="legend">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="legend-item">
            <span className={`swatch segment-${segment.key}`} />
            <span className="legend-name">{segment.name}</span>
            <span className="legend-value">
              {summary.counts[segment.key]}
              <span className="legend-percent">
                {' '}({Math.round((summary.counts[segment.key] / summary.total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
