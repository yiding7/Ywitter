import corpusJson from "../data/corpus.json";

export type TweetSample = {
  t: string; // cleaned text
  l: number; // likes
  rt: number; // retweets
  rp: number; // replies
  d: number; // day of month
};

type YearData = {
  count: number;
  months: Record<string, TweetSample[]>;
};

type YearDataWithCaps = YearData & { caps: number };

type Corpus = {
  source: string;
  note: string;
  capPerMonth: number;
  overallCaps: number;
  years: Record<string, YearDataWithCaps>;
};

export const corpus = corpusJson as Corpus;

export const OVERALL = "overall";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function availableYears(): string[] {
  return Object.keys(corpus.years).sort();
}

export function availableMonths(year: string): number[] {
  if (year === OVERALL) {
    const set = new Set<number>();
    for (const y of Object.values(corpus.years))
      Object.keys(y.months).forEach((m) => set.add(Number(m)));
    return [...set].sort((a, b) => a - b);
  }
  const y = corpus.years[year];
  if (!y) return [];
  return Object.keys(y.months)
    .map(Number)
    .sort((a, b) => a - b);
}

export function yearCount(year: string): number {
  if (year === OVERALL)
    return Object.values(corpus.years).reduce((a, y) => a + y.count, 0);
  return corpus.years[year]?.count ?? 0;
}

// Real all-caps tendency (0..1) for a year, or the whole archive for "overall".
export function capsFor(year: string): number {
  if (year === OVERALL) return corpus.overallCaps;
  return corpus.years[year]?.caps ?? 0;
}

// All samples for a year (or the whole archive), or a specific month within it.
export function samplesFor(year: string, month: number | null): TweetSample[] {
  if (year === OVERALL) {
    const all: TweetSample[] = [];
    for (const y of Object.values(corpus.years)) {
      if (month != null) all.push(...(y.months[String(month)] ?? []));
      else for (const arr of Object.values(y.months)) all.push(...arr);
    }
    return all;
  }
  const y = corpus.years[year];
  if (!y) return [];
  if (month != null) return y.months[String(month)] ?? [];
  return Object.values(y.months).flat();
}

// Pick a spread of few-shot examples: some top-liked, some random, deduped.
export function fewShot(
  year: string,
  month: number | null,
  n: number,
): TweetSample[] {
  const pool = samplesFor(year, month).filter((s) => s.t.length >= 6);
  if (pool.length <= n) return pool;
  const byLikes = [...pool].sort((a, b) => b.l - a.l);
  const topN = Math.ceil(n / 2);
  const picked = byLikes.slice(0, topN);
  const rest = byLikes.slice(topN);
  // deterministic-ish spread across the remaining pool
  const step = Math.max(1, Math.floor(rest.length / (n - topN)));
  for (let i = 0; picked.length < n && i < rest.length; i += step) {
    picked.push(rest[i]);
  }
  return picked;
}
