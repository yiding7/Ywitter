// Compacts data/raw/*.json into a small, text-focused corpus bundled with the app.
// - strips URLs / pic links, collapses whitespace, drops empty & duplicate tweets
// - groups by year -> month, caps per month to keep the shipped bundle small
// - keeps full data untouched in data/raw (that stays on your machine)
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "data", "raw");
const OUT = join(__dirname, "..", "src", "data", "corpus.json");
const CAP_PER_MONTH = 120;

function clean(text) {
  return text
    .replace(/https?:\/\/\S+/g, " ") // urls, t.co, pic.twitter.com
    .replace(/\s+/g, " ")
    .trim();
}

// Fraction of a tweet's letters that are uppercase (null if too few letters).
function capsRatio(text) {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return null;
  const upper = text.replace(/[^A-Z]/g, "").length;
  return upper / letters.length;
}

async function main() {
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const years = {};
  let kept = 0;
  let dropped = 0;

  for (const file of files.sort()) {
    const year = file.replace(".json", "");
    const tweets = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
    const byMonth = {};
    let capsHits = 0;
    let capsDenom = 0;
    for (const tw of tweets) {
      const text = clean(tw.text || "");
      if (text.length < 3) {
        dropped++;
        continue;
      }
      const cr = capsRatio(text);
      if (cr != null) {
        capsDenom++;
        if (cr > 0.7) capsHits++;
      }
      const month = new Date(tw.created_at).getUTCMonth() + 1; // 1-12
      (byMonth[month] ||= []).push({
        t: text,
        l: tw.likes || 0,
        rt: tw.retweets || 0,
        rp: tw.replies || 0,
        d: new Date(tw.created_at).getUTCDate(),
      });
    }
    // dedupe + cap per month (keep the most-liked for punchier few-shot samples)
    const months = {};
    let yearCount = 0;
    for (const [m, arr] of Object.entries(byMonth)) {
      const seen = new Set();
      const uniq = arr.filter((x) => {
        const k = x.t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      uniq.sort((a, b) => b.l - a.l);
      const capped = uniq.slice(0, CAP_PER_MONTH);
      months[m] = capped;
      yearCount += capped.length;
      kept += capped.length;
    }
    const caps = capsDenom ? +(capsHits / capsDenom).toFixed(2) : 0;
    years[year] = { count: yearCount, caps, months };
  }

  // Overall all-caps tendency, weighted by kept tweet counts.
  const totalKept = Object.values(years).reduce((a, y) => a + y.count, 0);
  const overallCaps = totalKept
    ? +(
        Object.values(years).reduce((a, y) => a + y.caps * y.count, 0) /
        totalKept
      ).toFixed(2)
    : 0;

  const corpus = {
    source: "https://yzy-twts.com",
    note: "Public archive of Kanye West tweets. Compact sample for parody/style use.",
    capPerMonth: CAP_PER_MONTH,
    overallCaps,
    years,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(corpus));
  const bytes = (await readFile(OUT)).length;
  console.log(
    `Corpus: ${kept} tweets kept, ${dropped} dropped. ${(bytes / 1024).toFixed(0)} KB -> ${OUT}`,
  );
}

main();
