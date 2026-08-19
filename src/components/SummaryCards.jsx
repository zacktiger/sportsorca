// The four headline numbers. These are stat tiles rather than a chart: each one
// is a single value, and a single value reads faster as a number than as a mark.

const VIBE_TEXT = {
  positive: 'Mostly positive',
  neutral: 'Balanced',
  negative: 'Mostly negative',
};

export default function SummaryCards({ summary }) {
  const percent = (count) => Math.round((count / summary.total) * 100);

  return (
    <div className="cards">
      <div className="card">
        <p className="card-label">Overall vibe</p>
        <p className={`card-value vibe-${summary.overall}`}>{VIBE_TEXT[summary.overall]}</p>
        <p className="card-note">across {summary.total} hot posts</p>
      </div>

      <div className="card">
        <p className="card-label">Positive titles</p>
        <p className="card-value">{percent(summary.counts.positive)}%</p>
        <p className="card-note">{summary.counts.positive} of {summary.total} posts</p>
      </div>

      <div className="card">
        <p className="card-label">Negative titles</p>
        <p className="card-value">{percent(summary.counts.negative)}%</p>
        <p className="card-note">{summary.counts.negative} of {summary.total} posts</p>
      </div>

      <div className="card">
        <p className="card-label">Average score</p>
        <p className="card-value">{summary.averageScore.toFixed(2)}</p>
        <p className="card-note">per title, 0 is neutral</p>
      </div>
    </div>
  );
}
