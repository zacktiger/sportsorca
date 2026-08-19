// Sentiment analysis, done in the browser with the AFINN word list.
//
// The library scores a piece of text by adding up the values of the words it
// recognises: "great" is +3, "terrible" is -3, unknown words count as 0.
// A positive total means a positive title, a negative total a negative one.

import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export function labelFor(score) {
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Adds a sentiment score and label to every post.
export function analysePosts(posts) {
  return posts.map((post) => {
    const { score } = sentiment.analyze(post.title);
    return { ...post, sentimentScore: score, sentiment: labelFor(score) };
  });
}

// Rolls the analysed posts up into the numbers shown at the top of the dashboard.
export function summarise(analysedPosts) {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  let totalScore = 0;

  for (const post of analysedPosts) {
    counts[post.sentiment] += 1;
    totalScore += post.sentimentScore;
  }

  const total = analysedPosts.length;

  return {
    total,
    counts,
    averageScore: total === 0 ? 0 : totalScore / total,
    // The overall "vibe" is just the label of the average score.
    overall: labelFor(totalScore),
  };
}
