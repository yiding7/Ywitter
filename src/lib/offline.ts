import { capsFor, samplesFor } from "./corpus";
import { scrub } from "./moderation";

// Offline fallback generator: an order-2 word Markov chain built from the chosen
// era's real tweets, lightly steered toward the user's theme. No API key needed.
// Output is intentionally a bit chaotic — that's part of the charm.

type Chain = Map<string, string[]>;
const START = "";
const END = "";

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function buildChain(texts: string[]): { chain: Chain; starts: string[][] } {
  const chain: Chain = new Map();
  const starts: string[][] = [];
  const add = (k: string, w: string) => {
    const arr = chain.get(k);
    if (arr) arr.push(w);
    else chain.set(k, [w]);
  };
  for (const text of texts) {
    const words = tokenize(text);
    if (words.length < 2) continue;
    starts.push([words[0], words[1] ?? END]);
    add(START, words[0]);
    add(`${START} ${words[0]}`, words[1] ?? END);
    for (let i = 0; i < words.length - 2; i++) {
      add(`${words[i]} ${words[i + 1]}`, words[i + 2]);
    }
    add(`${words[words.length - 2]} ${words[words.length - 1]}`, END);
  }
  return { chain, starts };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Connectors/function words that read as unfinished when a post ends on them,
// so we trim any trailing run of these ("...and", "...to my") before rendering.
const CONNECTORS = new Set([
  "and", "or", "but", "so", "the", "a", "an", "to", "of", "for", "with", "my",
  "your", "our", "their", "his", "her", "its", "i", "we", "you", "they", "he",
  "she", "it", "is", "are", "was", "were", "be", "been", "at", "on", "in",
  "into", "than", "then", "that", "this", "as", "if", "when", "while",
  "because", "about", "from", "by", "just", "like", "im", "gonna", "cause",
]);

function bareWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

export function generateOffline(
  year: string,
  month: number | null,
  theme: string,
): string {
  const texts = samplesFor(year, month)
    .map((s) => s.t)
    .filter((t) => t.length >= 6);
  if (texts.length === 0) return theme ? theme.toUpperCase() : "YO";

  const { chain, starts } = buildChain(texts);
  const themeWords = theme
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const hasTheme = (s: string) =>
    themeWords.some((tw) => s.toLowerCase().includes(tw));

  // Prefer starting from a tweet that mentions the theme.
  const themed = starts.filter((s) => hasTheme(s.join(" ")));
  let [w1, w2] = (themed.length ? pick(themed) : pick(starts)) as string[];

  const out = [w1];
  if (w2 && w2 !== END) out.push(w2);
  const target = 8 + Math.floor(Math.random() * 18); // 8..25 words
  // Remember transitions we've already walked so the chain can't fall into an
  // A-B-A-B loop, the most common way Markov output turns to mush.
  const usedTransitions = new Set<string>();

  for (let i = 0; i < 60 && out.length < target; i++) {
    const key = `${out[out.length - 2] ?? START} ${out[out.length - 1]}`;
    const candidates = chain.get(key);
    if (!candidates || candidates.length === 0) break;

    // Steer toward the theme most of the time when a themed continuation
    // exists. These are still real corpus bigrams, so grammar survives.
    let choices = candidates;
    if (themeWords.length && Math.random() < 0.6) {
      const steered = candidates.filter((c) => hasTheme(c));
      if (steered.length) choices = steered;
    }

    // Avoid repeating a transition or the previous word when we can.
    const last = out[out.length - 1];
    let pool = choices.filter(
      (c) => c !== last && !usedTransitions.has(`${key}>${c}`),
    );
    if (!pool.length) pool = choices.filter((c) => c !== last);
    if (!pool.length) pool = choices;

    const next = pick(pool);
    if (next === END) {
      if (out.length >= 6) break;
      continue;
    }
    usedTransitions.add(`${key}>${next}`);
    out.push(next);
  }

  // Drop a trailing run of connector words so the post doesn't end mid-thought.
  while (out.length > 6 && CONNECTORS.has(bareWord(out[out.length - 1]))) out.pop();

  let text = out
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+[@#&]+$/g, "") // drop dangling mention/symbol tokens
    .trim();

  // If the theme never showed up, open with it (Ye loved a hard declarative).
  if (themeWords.length && !hasTheme(text)) {
    text = `${theme.trim()} ${text}`;
  }

  // Pick ONE coherent case class per post at the era's real all-caps rate,
  // instead of letting mixed-case Markov tokens shout at random.
  text =
    Math.random() < capsFor(year) ? text.toUpperCase() : toSentenceCase(text);

  return scrub(text);
}

// Normalizes shouty/mixed Markov output into a calmer, readable case.
function toSentenceCase(s: string): string {
  const upper = s.replace(/[^A-Z]/g, "").length;
  const letters = s.replace(/[^A-Za-z]/g, "").length || 1;
  if (upper / letters < 0.5) return s; // already normal-ish; leave it
  const lower = s.toLowerCase();
  return lower
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .replace(/\bi\b/g, "I")
    .replace(/\bi'/g, "I'");
}
