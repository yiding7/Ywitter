// Lightweight client-side content safety. Two jobs:
//  1) checkTheme(): block a visitor's THEME input that pushes hate / slurs /
//     targeted abuse, so the toy can't be steered into generating that.
//  2) scrub(): mask slurs that may surface from the raw archive in OUTPUT.
// This is a curated, easily-extended list — not a full moderation service.

// Hard-blocked: slurs and hate markers. Kept lowercase; matched case-insensitively.
// Extend this list to taste.
const HATE = [
  "nigger",
  "nigga", // present in the archive; masked in output, blocked in input
  "faggot",
  "fag",
  "kike",
  "spic",
  "chink",
  "gook",
  "wetback",
  "tranny",
  "retard",
  "coon",
  "heil hitler",
  "gas the",
  "kill all",
  "white power",
  "gas chamber",
];

// Softer profanity blocked only from the visitor's INPUT (per request to keep
// abusive language out), but allowed to remain in stylistic output.
const INPUT_ONLY_PROFANITY = ["fuck", "shit", "bitch", "cunt", "asshole"];

function wordRegex(terms: string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

const HATE_RE = wordRegex(HATE);
const INPUT_RE = wordRegex([...HATE, ...INPUT_ONLY_PROFANITY]);

export type ThemeCheck = { ok: boolean; reason?: string };

export function checkTheme(theme: string): ThemeCheck {
  const hits = theme.match(INPUT_RE);
  if (hits && hits.length) {
    return {
      ok: false,
      reason:
        "Your theme contains language this toy won't generate around (slurs / abusive terms). Try rephrasing.",
    };
  }
  return { ok: true };
}

// Mask slurs in generated/offline output with asterisks (keeps first letter).
export function scrub(text: string): string {
  return text.replace(HATE_RE, (m) => m[0] + "*".repeat(Math.max(1, m.length - 1)));
}
