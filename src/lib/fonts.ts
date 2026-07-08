// Typefaces from Ye's design world, applied to the post body. All are common
// system fonts so the exported PNG renders the same everywhere (no web-font
// loading race with html-to-image).

export type FontId = "helvetica" | "times" | "impact" | "mono";

export type Font = { id: FontId; label: string; stack: string };

export const FONTS: Font[] = [
  {
    id: "helvetica",
    label: "Helvetica (Yeezy)",
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  {
    id: "times",
    label: "Times (Yeezus / TLOP)",
    stack: '"Times New Roman", Times, Georgia, serif',
  },
  {
    id: "impact",
    label: "Impact (tour merch)",
    stack: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  },
  {
    id: "mono",
    label: "Mono (DONDA)",
    stack: '"Courier New", ui-monospace, monospace',
  },
];

export function fontStack(id: FontId): string {
  return (FONTS.find((f) => f.id === id) ?? FONTS[0]).stack;
}
