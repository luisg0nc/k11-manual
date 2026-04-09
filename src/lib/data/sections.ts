import type { SectionMeta } from "./types";

/** All 17 sections from the Quick Reference Index (front-002), in manual order */
export const SECTION_DEFINITIONS: Omit<SectionMeta, "pageCount" | "pages">[] = [
  { code: "GI", name: "General Information", slug: "gi" },
  { code: "MA", name: "Maintenance", slug: "ma" },
  { code: "EM", name: "Engine Mechanical", slug: "em" },
  { code: "LC", name: "Engine Lubrication & Cooling Systems", slug: "lc" },
  { code: "EF & EC", name: "Engine Fuel & Emission Control System", slug: "ef-ec" },
  { code: "FE", name: "Engine Control, Fuel & Exhaust System", slug: "fe" },
  { code: "CL", name: "Clutch", slug: "cl" },
  { code: "MT", name: "Manual Transmission", slug: "mt" },
  { code: "AT", name: "Automatic Transmission", slug: "at" },
  { code: "PD", name: "Propeller Shaft & Differential Carrier", slug: "pd" },
  { code: "FA", name: "Front Axle & Front Suspension", slug: "fa" },
  { code: "RA", name: "Rear Axle & Rear Suspension", slug: "ra" },
  { code: "BR", name: "Brake System", slug: "br" },
  { code: "ST", name: "Steering System", slug: "st" },
  { code: "BF", name: "Body", slug: "bf" },
  { code: "HA", name: "Heater & Air Conditioner", slug: "ha" },
  { code: "EL", name: "Electrical System", slug: "el" },
];

/** Special/front-matter section for pages that don't belong to a numbered section */
export const FRONT_SECTION: Omit<SectionMeta, "pageCount" | "pages"> = {
  code: "FRONT",
  name: "Front Matter",
  slug: "front",
};

/** Convert a page_code like "EF & EC-27" to a URL-safe slug like "ef-ec-27" */
export function pageCodeToSlug(pageCode: string): string {
  return pageCode
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

/** Convert a section code like "EF & EC" to a slug like "ef-ec" */
export function sectionCodeToSlug(sectionCode: string): string {
  return sectionCode
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

/** Find section definition by code */
export function getSectionByCode(code: string) {
  return SECTION_DEFINITIONS.find((s) => s.code === code) ?? FRONT_SECTION;
}

/** Find section definition by slug */
export function getSectionBySlug(slug: string) {
  return (
    SECTION_DEFINITIONS.find((s) => s.slug === slug) ??
    (slug === "front" ? FRONT_SECTION : undefined)
  );
}

/** Sort page codes naturally: "EM-2" before "EM-10" */
export function sortPageCodes(a: string, b: string): number {
  const partsA = a.match(/^(.+?)(?:-(\d+))?$/);
  const partsB = b.match(/^(.+?)(?:-(\d+))?$/);
  if (!partsA || !partsB) return a.localeCompare(b);

  const prefixCmp = partsA[1].localeCompare(partsB[1]);
  if (prefixCmp !== 0) return prefixCmp;

  const numA = partsA[2] ? parseInt(partsA[2], 10) : -1;
  const numB = partsB[2] ? parseInt(partsB[2], 10) : -1;
  return numA - numB;
}
