import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  availableMonths,
  availableYears,
  MONTH_NAMES,
  OVERALL,
  yearCount,
} from "./lib/corpus";
import { ERAS, eraForYear, type EraId } from "./lib/eras";
import { FONTS, fontStack, type FontId } from "./lib/fonts";
import { generate, testKey, type GenSettings } from "./lib/generate";
import { checkTheme } from "./lib/moderation";
import { profileFor } from "./lib/profiles";
import { getProvider, PROVIDERS } from "./lib/providers";
import { YwitterCard, type CardData } from "./components/YwitterCard";

const YEARS = [OVERALL, ...availableYears()];
const THEME_MAX = 280;
const KEYS_LS = "ywitter.keys.v1";
const CFG_LS = "ywitter.cfg.v1";

// representative year (for the mockup date) when "Overall" is selected
const ERA_YEAR: Record<EraId, string> = {
  early: "2008",
  classic: "2015",
  modern: "2018",
  dark: "2025",
};

type StoredKeys = Record<string, string>;

function loadKeys(): StoredKeys {
  try {
    return JSON.parse(localStorage.getItem(KEYS_LS) || "{}");
  } catch {
    return {};
  }
}
function loadCfg(): { providerId: string; model: string; baseUrl: string } {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_LS) || "{}");
    const id = c.providerId || "anthropic";
    return { providerId: id, model: c.model || getProvider(id).defaultModel, baseUrl: c.baseUrl || "" };
  } catch {
    return { providerId: "anthropic", model: "claude-sonnet-5", baseUrl: "" };
  }
}

function pseudoStats(era: EraId) {
  const scale = era === "early" ? 4_000 : era === "classic" ? 40_000 : 180_000;
  const likes = Math.floor(scale * (0.3 + Math.random() * 1.7));
  return {
    likes,
    retweets: Math.floor(likes * (0.15 + Math.random() * 0.25)),
    replies: Math.floor(likes * (0.08 + Math.random() * 0.2)),
  };
}

function dateLabel(year: string, month: number | null, eraId: EraId): string {
  const y = year === OVERALL ? ERA_YEAR[eraId] : year;
  const m = month ?? 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hour = 1 + Math.floor(Math.random() * 12);
  const min = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  const ap = Math.random() < 0.5 ? "AM" : "PM";
  return `${hour}:${min} ${ap} · ${MONTH_NAMES[m - 1].slice(0, 3)} ${day}, ${y}`;
}

// Scales the fixed-width mockup down to fit narrow screens, while the inner node
// keeps its natural size so PNG export stays full resolution.
function ScaledCard({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current) return;
      const s = Math.min(1, outer.current.clientWidth / 520);
      setScale(s);
      if (inner.current) setH(inner.current.offsetHeight * s);
    };
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    measure();
    return () => ro.disconnect();
  });

  return (
    <div ref={outer} style={{ width: "100%" }}>
      <div style={{ height: h }}>
        <div
          ref={inner}
          style={{ width: 520, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [year, setYear] = useState<string>(OVERALL);
  const [month, setMonth] = useState<number | null>(null);
  const [theme, setTheme] = useState("");
  const [eraOverride, setEraOverride] = useState<EraId | "auto">("auto");
  const [fontId, setFontId] = useState<FontId>("helvetica");

  const [keys, setKeys] = useState<StoredKeys>(loadKeys);
  const [cfg, setCfg] = useState(loadCfg);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<{ status: "idle" | "testing" | "ok" | "err"; msg: string }>({
    status: "idle",
    msg: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<string>("");
  const [card, setCard] = useState<CardData | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const eraId: EraId =
    eraOverride === "auto"
      ? eraForYear(year === OVERALL ? ERA_YEAR.modern : year)
      : eraOverride;
  const era = ERAS[eraId];
  const months = useMemo(() => availableMonths(year), [year]);
  const provider = getProvider(cfg.providerId);
  const apiKey = keys[cfg.providerId] || "";

  function persistKeys(next: StoredKeys) {
    setKeys(next);
    localStorage.setItem(KEYS_LS, JSON.stringify(next));
    setTest({ status: "idle", msg: "" });
  }
  function persistCfg(next: typeof cfg) {
    setCfg(next);
    localStorage.setItem(CFG_LS, JSON.stringify(next));
    setTest({ status: "idle", msg: "" });
  }

  async function onTest() {
    setTest({ status: "testing", msg: "Testing…" });
    const res = await testKey({
      providerId: cfg.providerId,
      model: cfg.model || provider.defaultModel,
      apiKey,
      baseUrl: cfg.baseUrl,
    });
    setTest({ status: res.ok ? "ok" : "err", msg: res.message });
  }

  async function onGenerate() {
    const check = checkTheme(theme);
    if (!check.ok) {
      setError(check.reason || "Blocked.");
      return;
    }
    setLoading(true);
    setError(null);
    const settings: GenSettings | null = apiKey
      ? { providerId: cfg.providerId, model: cfg.model || provider.defaultModel, apiKey, baseUrl: cfg.baseUrl }
      : null;
    try {
      const res = await generate({ year, month, theme, settings });
      const prof = profileFor(year, eraId);
      setCard({
        name: prof.name,
        handle: "@" + prof.handle,
        avatar: prof.avatar,
        text: res.text,
        dateLabel: dateLabel(year, month, eraId),
        ...pseudoStats(eraId),
      });
      setEngine(res.engine);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onExport() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: era.bg });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ywitter-${year}${month ? "-" + month : ""}.png`;
    a.click();
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#0b0b0c", color: "#e7e9ea" }}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Ywitter <span className="text-zinc-500">- speak like Ye</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Pick a year, throw it a topic, and it types back like Ye did that year —
            the caps, the run-ons, the whole thing. Drop in your own API key if you
            want it sharp, or run it free and let it get weird. Screenshot and post
            responsibly (it's not really him).
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Controls */}
          <section className="rounded-2xl bg-zinc-900/70 p-4 ring-1 ring-white/10 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-400">Year</span>
                <select
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setMonth(null);
                  }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y === OVERALL ? `Overall — all years (${yearCount(OVERALL)})` : `${y} (${yearCount(y)})`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-zinc-400">Month</span>
                <select
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                  value={month ?? ""}
                  onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{year === OVERALL ? "Any month" : "Whole year"}</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {MONTH_NAMES[m - 1]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1 flex items-center justify-between text-zinc-400">
                <span>Theme</span>
                <span className={theme.length >= THEME_MAX ? "text-red-400" : "text-zinc-500"}>
                  {theme.length}/{THEME_MAX}
                </span>
              </span>
              <input
                className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                placeholder="e.g. Monday mornings, sushi, being misunderstood"
                value={theme}
                maxLength={THEME_MAX}
                onChange={(e) => setTheme(e.target.value.slice(0, THEME_MAX))}
                onKeyDown={(e) => e.key === "Enter" && onGenerate()}
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-400">UI era</span>
                <select
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                  value={eraOverride}
                  onChange={(e) => setEraOverride(e.target.value as EraId | "auto")}
                >
                  <option value="auto">
                    {year === OVERALL ? "Auto (Modern)" : `Auto (${ERAS[eraForYear(year)].label})`}
                  </option>
                  {Object.values(ERAS).map((er) => (
                    <option key={er.id} value={er.id}>
                      {er.label} · {er.yearsLabel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-zinc-400">Font</span>
                <select
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                  value={fontId}
                  onChange={(e) => setFontId(e.target.value as FontId)}
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onGenerate}
                disabled={loading}
                className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {loading ? "Cooking…" : "Generate"}
              </button>
              <button
                onClick={() => setShowKey((s) => !s)}
                className="text-sm text-zinc-400 underline underline-offset-2"
              >
                {apiKey ? `Using ${provider.label} — edit key` : "Offline mode — add API key"}
              </button>
            </div>

            {showKey && (
              <div className="mt-4 rounded-xl bg-zinc-950/60 p-4 ring-1 ring-white/10">
                <p className="mb-2 text-xs text-zinc-500">
                  Keys stay in your browser (localStorage) and are sent only to the
                  provider you pick. Leave blank to use the free offline generator.
                </p>
                <label className="block text-sm">
                  <span className="mb-1 block text-zinc-400">Provider</span>
                  <select
                    className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                    value={cfg.providerId}
                    onChange={(e) => {
                      const p = getProvider(e.target.value);
                      persistCfg({ providerId: p.id, model: p.defaultModel, baseUrl: "" });
                    }}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                {provider.id === "custom" ? (
                  <>
                    <label className="mt-2 block text-sm">
                      <span className="mb-1 block text-zinc-400">Base URL (chat/completions)</span>
                      <input
                        className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                        placeholder="https://.../v1/chat/completions"
                        value={cfg.baseUrl}
                        onChange={(e) => persistCfg({ ...cfg, baseUrl: e.target.value })}
                      />
                    </label>
                    <label className="mt-2 block text-sm">
                      <span className="mb-1 block text-zinc-400">Model</span>
                      <input
                        className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                        value={cfg.model}
                        onChange={(e) => persistCfg({ ...cfg, model: e.target.value })}
                      />
                    </label>
                  </>
                ) : (
                  <label className="mt-2 block text-sm">
                    <span className="mb-1 block text-zinc-400">Model</span>
                    <select
                      className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                      value={cfg.model}
                      onChange={(e) => persistCfg({ ...cfg, model: e.target.value })}
                    >
                      {provider.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="mt-2 block text-sm">
                  <span className="mb-1 block text-zinc-400">API key ({provider.keyHint})</span>
                  <input
                    type="password"
                    className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="paste key…"
                    value={keys[cfg.providerId] || ""}
                    onChange={(e) => persistKeys({ ...keys, [cfg.providerId]: e.target.value })}
                  />
                </label>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={onTest}
                    disabled={test.status === "testing" || !apiKey}
                    className="rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {test.status === "testing" ? "Testing…" : "Save & Test"}
                  </button>
                  {test.status !== "idle" && test.status !== "testing" && (
                    <span
                      className={`text-xs ${test.status === "ok" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {test.status === "ok" ? "✓ " : "✗ "}
                      {test.msg}
                    </span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-xs text-red-300">{error}</p>
            )}
          </section>

          {/* Preview */}
          <section className="flex flex-col items-center gap-4">
            <div
              style={{ background: era.bg }}
              className="w-full max-w-[552px] rounded-2xl p-4"
            >
              {card ? (
                <ScaledCard>
                  <YwitterCard ref={cardRef} era={era} data={card} bodyFont={fontStack(fontId)} />
                </ScaledCard>
              ) : (
                <div className="p-10 text-center text-sm text-zinc-500">
                  Nothing here yet. Hit Generate and let him cook.
                </div>
              )}
            </div>
            {card && (
              <div className="flex items-center gap-3">
                <button
                  onClick={onExport}
                  className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold ring-1 ring-white/10"
                >
                  Export PNG
                </button>
                <span className="text-xs text-zinc-500">engine: {engine}</span>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-zinc-600">
          A parody toy. Every post is machine-made and fake — not written by any real
          person. Style samples come from the public archive at{" "}
          <a className="underline" href="https://yzy-twts.com" target="_blank" rel="noreferrer">
            yzy-twts.com
          </a>
          . Not affiliated with anyone or any platform.
        </footer>
      </div>
    </div>
  );
}
