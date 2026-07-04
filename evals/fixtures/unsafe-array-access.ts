interface SearchResult {
  id: string;
  score: number;
}

export function summarizeTopResult(results: SearchResult[]): string {
  const [topResult] = results;
  return `${topResult.id}:${topResult.score}`;
}

export function summarizeLatestResult(results: SearchResult[]): string {
  const latest = results[results.length - 1];
  return `${latest.id}:${latest.score}`;
}

export function summarizeFirstResult(results: SearchResult[]): string {
  return `${results[0].id}:${results[0].score}`;
}
