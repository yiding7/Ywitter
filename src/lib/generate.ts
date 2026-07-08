import { capsFor, fewShot, MONTH_NAMES } from "./corpus";
import { generateOffline } from "./offline";
import { scrub } from "./moderation";
import { getProvider, type Provider } from "./providers";

export type GenSettings = {
  providerId: string;
  model: string;
  apiKey: string;
  baseUrl?: string; // for custom provider
};

export type GenRequest = {
  year: string;
  month: number | null;
  theme: string;
  settings: GenSettings | null; // null => offline
};

export type GenResult = {
  text: string;
  engine: "offline" | string; // provider label when online
};

function buildPrompt(year: string, month: number | null, theme: string) {
  const examples = fewShot(year, month, 14);
  const period =
    year === "overall"
      ? "across the whole archive"
      : month != null
        ? `${MONTH_NAMES[month - 1]} ${year}`
        : year;
  const capsPct = Math.round(capsFor(year) * 100);
  const sampleBlock = examples.map((e) => `- ${e.t}`).join("\n");

  const system = [
    "You are a parody style-mimic. You imitate the TWEETING STYLE of a specific person during a specific period, based on real example posts.",
    "Study the examples for: capitalization habits, punctuation, line breaks, slang, emoji use, sentence length, tone, and recurring themes.",
    "Write ONE single post (no thread) on the user's requested theme, in that exact style and era.",
    "Rules: max ~280 characters. No hashtags unless the examples use them. No @mentions of real handles. Output ONLY the post text — no quotes, no preamble, no explanation.",
    "This is clearly labeled parody; keep it playful, not defamatory, and NEVER use slurs or targeted harassment even if the examples contain them.",
  ].join(" ");

  const user = [
    `Period to imitate: ${period}.`,
    `In this period, roughly ${capsPct}% of posts were written in ALL CAPS — match that tendency (only go all-caps about ${capsPct}% of the time).`,
    `Theme to post about: "${theme || "anything on your mind"}".`,
    "",
    "Real example posts from this period (style reference only, do not copy):",
    sampleBlock,
    "",
    "Now write one new post about the theme, in this era's style:",
  ].join("\n");

  return { system, user };
}

async function callOpenAICompatible(
  provider: Provider,
  s: GenSettings,
  system: string,
  user: string,
): Promise<string> {
  const url = s.baseUrl || provider.baseUrl;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    body: JSON.stringify({
      model: s.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
      max_tokens: 300,
    }),
  });
  if (!res.ok) {
    throw new Error(`${provider.label} error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("Unexpected response shape");
  return text;
}

async function callAnthropic(
  provider: Provider,
  s: GenSettings,
  system: string,
  user: string,
): Promise<string> {
  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": s.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: s.model,
      max_tokens: 300,
      temperature: 0.9,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`${provider.label} error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string") throw new Error("Unexpected response shape");
  return text;
}

function tidy(text: string): string {
  let t = text.trim();
  // strip wrapping quotes the model sometimes adds
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("“") && t.endsWith("”"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

// Minimal validation call so the user can confirm their provider + key + model
// actually work from the browser (also surfaces CORS problems immediately).
export async function testKey(s: GenSettings): Promise<{ ok: boolean; message: string }> {
  const provider = getProvider(s.providerId);
  if (!s.apiKey) return { ok: false, message: "No API key entered." };
  if (provider.id === "custom" && !s.baseUrl)
    return { ok: false, message: "Custom provider needs a base URL." };
  try {
    if (provider.kind === "anthropic")
      await callAnthropic(provider, s, "Reply with the single word: ok", "ping");
    else
      await callOpenAICompatible(provider, s, "Reply with the single word: ok", "ping");
    return { ok: true, message: `Works — ${provider.label} replied.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function generate(req: GenRequest): Promise<GenResult> {
  const { year, month, theme, settings } = req;

  if (!settings || !settings.apiKey) {
    return { text: generateOffline(year, month, theme), engine: "offline" };
  }

  const provider = getProvider(settings.providerId);
  const { system, user } = buildPrompt(year, month, theme);
  const text =
    provider.kind === "anthropic"
      ? await callAnthropic(provider, settings, system, user)
      : await callOpenAICompatible(provider, settings, system, user);
  return { text: scrub(tidy(text)), engine: provider.label };
}
