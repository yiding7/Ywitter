// Scrapes the public yzy-twts.com archive (Kanye West tweet archive) year by year.
// Respectful: one request per year, small delay between requests. For personal / parody use.
// Attribution: data © the respective author; archive courtesy of https://yzy-twts.com
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "data", "raw");
const BASE = "https://yzy-twts.com";
const YEARS = [
  2007, 2008, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2022, 2023, 2024, 2025, 2026,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Decode a JS string literal (the argument passed to self.__next_f.push).
function decodeJsString(literal) {
  return JSON.parse(literal);
}

// From a full HTML page, concatenate all streamed RSC push payloads.
function collectRscPayload(html) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let out = "";
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      out += decodeJsString(m[1]);
    } catch {
      /* skip malformed chunk */
    }
  }
  return out;
}

// Extract the JSON array that follows the first `"tweets":` key by balancing brackets.
function extractTweetsArray(payload) {
  const key = '"tweets":';
  const at = payload.indexOf(key);
  if (at === -1) return null;
  let i = payload.indexOf("[", at);
  if (i === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  const start = i;
  for (; i < payload.length; i++) {
    const c = payload[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        const slice = payload.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }
  return null;
}

async function scrapeYear(year) {
  const url = `${BASE}/${year}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`${year}: HTTP ${res.status}`);
  const html = await res.text();
  const payload = collectRscPayload(html);
  const tweets = extractTweetsArray(payload);
  if (!tweets) throw new Error(`${year}: no tweets array found`);
  return tweets;
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  let total = 0;
  for (const year of YEARS) {
    try {
      const tweets = await scrapeYear(year);
      await writeFile(
        join(RAW_DIR, `${year}.json`),
        JSON.stringify(tweets, null, 2),
      );
      total += tweets.length;
      console.log(`${year}: ${tweets.length} tweets`);
    } catch (err) {
      console.error(`${year}: FAILED - ${err.message}`);
    }
    await sleep(1500);
  }
  console.log(`\nDone. ${total} tweets across ${YEARS.length} year pages.`);
}

main();
