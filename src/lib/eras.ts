// Maps a year to a "Ywitter" visual era. Purely cosmetic UI styling for the mockup.
// No real Twitter/X branding or names are used anywhere.

export type EraId = "early" | "classic" | "modern" | "dark";

export type Era = {
  id: EraId;
  label: string;
  yearsLabel: string;
  brand: string; // wordmark shown in the card
  // theme tokens consumed by the mockup card
  bg: string;
  cardBg: string;
  text: string;
  subtle: string;
  border: string;
  accent: string; // links / active actions
  likeColor: string;
  likeIcon: "star" | "heart";
  rounded: string; // avatar + card rounding
  verified: boolean;
};

export const ERAS: Record<EraId, Era> = {
  early: {
    id: "early",
    label: "Early era",
    yearsLabel: "2007–2011",
    brand: "Ywitter",
    bg: "#ffffff",
    cardBg: "#ffffff",
    text: "#333333",
    subtle: "#999999",
    border: "#e6ecf0",
    accent: "#2fa5c8",
    likeColor: "#f5a623",
    likeIcon: "star",
    rounded: "0.25rem",
    verified: false,
  },
  classic: {
    id: "classic",
    label: "Classic era",
    yearsLabel: "2012–2016",
    brand: "Ywitter",
    bg: "#ffffff",
    cardBg: "#ffffff",
    text: "#14171a",
    subtle: "#657786",
    border: "#e1e8ed",
    accent: "#1da1f2",
    likeColor: "#f5a623",
    likeIcon: "star",
    rounded: "9999px",
    verified: true,
  },
  modern: {
    id: "modern",
    label: "Modern era",
    yearsLabel: "2017–2021",
    brand: "Ywitter",
    bg: "#ffffff",
    cardBg: "#ffffff",
    text: "#0f1419",
    subtle: "#536471",
    border: "#eff3f4",
    accent: "#1d9bf0",
    likeColor: "#f91880",
    likeIcon: "heart",
    rounded: "9999px",
    verified: true,
  },
  dark: {
    id: "dark",
    label: "Dark era",
    yearsLabel: "2022–2026",
    brand: "Y",
    bg: "#000000",
    cardBg: "#000000",
    text: "#e7e9ea",
    subtle: "#71767b",
    border: "#2f3336",
    accent: "#1d9bf0",
    likeColor: "#f91880",
    likeIcon: "heart",
    rounded: "9999px",
    verified: true,
  },
};

export function eraForYear(year: string): EraId {
  const y = Number(year);
  if (y <= 2011) return "early";
  if (y <= 2016) return "classic";
  if (y <= 2021) return "modern";
  return "dark";
}
