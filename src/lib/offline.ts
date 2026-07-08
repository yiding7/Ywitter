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

  // Prefer starting from a tweet that mentions the theme.
  const themed = starts.filter((s) =>
    themeWords.some((tw) => s.join(" ").toLowerCase().includes(tw)),
  );
  let [w1, w2] = (themed.length ? pick(themed) : pick(starts)) as string[];

  const out = [w1];
  if (w2 && w2 !== END) out.push(w2);
  const target = 6 + Math.floor(Math.random() * 22);

  for (let i = 0; i < 40 && out.length < target; i++) {
    const key = `${out[out.length - 2] ?? START} ${out[out.length - 1]}`;
    let candidates = chain.get(key);
    if (!candidates || candidates.length === 0) break;
    // occasionally steer toward a candidate containing a theme word
    if (themeWords.length && Math.random() < 0.4) {
      const steered = candidates.filter((c) =>
        themeWords.some((tw) => c.toLowerCase().includes(tw)),
      );
      if (steered.length) candidates = steered;
    }
    const next = pick(candidates);
    if (next === END) {
      if (out.length >= 5) break;
      continue;
    }
    out.push(next);
  }

  let text = out
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+[@#&]+$/g, "") // drop dangling mention/symbol tokens
    .trim();

  // If the theme never showed up, open with it (Ye loved a hard declarative).
  if (themeWords.length && !themeWords.some((tw) => text.toLowerCase().includes(tw))) {
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
