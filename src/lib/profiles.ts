// Authentic per-year profile presentation (display name, avatar, follower count),
// mirroring how the archive at yzy-twts.com renders each era. Avatars are stored
// locally in src/assets/pfps. Handle stayed "kanyewest" throughout.
import p808s from "../assets/pfps/808s.jpg";
import mbdtf from "../assets/pfps/mbdtf.jpg";
import globe from "../assets/pfps/globe.jpg";
import jik2 from "../assets/pfps/jik2.jpg";
import blank from "../assets/pfps/blank.jpg";
import type { EraId } from "./eras";

export type Profile = {
  name: string;
  handle: string;
  avatar: string;
  followers: number;
};

const HANDLE = "kanyewest";

// name + avatar + followers per year, extracted from the public archive.
const BY_YEAR: Record<string, Profile> = {
  "2007": { name: "KanYe West", handle: HANDLE, avatar: p808s, followers: 50 },
  "2008": { name: "KanYe West", handle: HANDLE, avatar: p808s, followers: 5_000 },
  "2010": { name: "Kanye West", handle: HANDLE, avatar: mbdtf, followers: 1_900_000 },
  "2011": { name: "Kanye West", handle: HANDLE, avatar: mbdtf, followers: 5_700_000 },
  "2012": { name: "Kanye West", handle: HANDLE, avatar: mbdtf, followers: 9_000_000 },
  "2013": { name: "KANYE WEST", handle: HANDLE, avatar: mbdtf, followers: 10_000_000 },
  "2014": { name: "KANYE WEST", handle: HANDLE, avatar: mbdtf, followers: 11_000_000 },
  "2015": { name: "KANYE WEST", handle: HANDLE, avatar: mbdtf, followers: 16_600_000 },
  "2016": { name: "KANYE WEST", handle: HANDLE, avatar: mbdtf, followers: 28_000_000 },
  "2017": { name: "KANYE WEST", handle: HANDLE, avatar: mbdtf, followers: 28_000_000 },
  "2018": { name: "ye", handle: HANDLE, avatar: globe, followers: 29_000_000 },
  "2019": { name: "ye", handle: HANDLE, avatar: globe, followers: 30_000_000 },
  "2020": { name: "ye", handle: HANDLE, avatar: jik2, followers: 31_000_000 },
  "2022": { name: "ye", handle: HANDLE, avatar: jik2, followers: 32_000_000 },
  "2023": { name: "ye", handle: HANDLE, avatar: jik2, followers: 32_000_000 },
  "2024": { name: "ye", handle: HANDLE, avatar: jik2, followers: 32_000_000 },
  "2025": { name: "ye", handle: HANDLE, avatar: blank, followers: 32_000_000 },
  "2026": { name: "ye", handle: HANDLE, avatar: blank, followers: 31_000_000 },
};

// Representative year per UI era, used when "Overall" (all years) is selected.
const ERA_REPRESENTATIVE: Record<EraId, string> = {
  early: "2008",
  classic: "2015",
  modern: "2018",
  dark: "2025",
};

export function profileFor(year: string, eraId: EraId): Profile {
  if (year === "overall") return BY_YEAR[ERA_REPRESENTATIVE[eraId]];
  return BY_YEAR[year] ?? BY_YEAR[ERA_REPRESENTATIVE[eraId]];
}
