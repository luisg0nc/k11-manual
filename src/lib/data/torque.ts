import { getAllPages } from "./loader";
import { pageCodeToSlug, sectionCodeToSlug, getSectionByCode } from "./sections";
import type {
  ManualPage,
  ContentBlock,
  SpecsBlock,
  TableBlock,
  PartsDiagramBlock,
} from "./types";

// ── Types ──────────────────────────────────────────────────────────

export interface TorqueSpec {
  /** Human-readable name of the component / fastener */
  name: string;
  /** Section code, e.g. "MT" */
  section: string;
  /** Section display name, e.g. "Manual Transmission" */
  sectionName: string;
  /** Section URL slug */
  sectionSlug: string;
  /** Page code, e.g. "MT-6" */
  pageCode: string;
  /** Page URL slug */
  pageSlug: string;
  /** Torque value in N·m (factory string, e.g. "16 - 20") */
  nm: string;
  /** Torque value in kg-m */
  kgm: string;
  /** Torque value in ft-lb */
  ftlb: string;
  /** Optional condition / note */
  condition?: string;
}

export interface StandardBoltSpec {
  grade: string;
  boltSize: string;
  hexHeadNm: string;
  hexHeadKgm: string;
  hexHeadFtlb: string;
  hexFlangeNm: string;
  hexFlangeKgm: string;
  hexFlangeFtlb: string;
}

export interface TorqueData {
  componentTorques: TorqueSpec[];
  standardBolts: StandardBoltSpec[];
  /** Grouped by section code */
  bySection: { code: string; name: string; slug: string; items: TorqueSpec[] }[];
}

// ── Cache ──────────────────────────────────────────────────────────

let _torqueData: TorqueData | null = null;

// ── Regex helpers ──────────────────────────────────────────────────

/** Match compound value: "4 - 5 (0.4 - 0.5, 2.9 - 3.6)" */
const COMPOUND_RE =
  /^([\d.]+\s*[-–]\s*[\d.]+)\s*\(\s*([\d.]+\s*[-–]\s*[\d.]+)\s*,\s*([\d.]+\s*[-–]\s*[\d.]+)\s*\)$/;

/** Match parts_diagram note: "Torque: 6 - 10 N·m (0.6 - 1.0 kg-m, 4.3 - 7.2 ft-lb)" */
const PARTS_TORQUE_RE =
  /[Tt]orque:\s*([\d.]+\s*[-–]\s*[\d.]+)\s*N[·.]m\s*\(\s*([\d.]+\s*[-–]\s*[\d.]+)\s*kg[-·]m\s*,\s*([\d.]+\s*[-–]\s*[\d.]+)\s*ft[-·]lb\s*\)/;

/** Match inline compound in value field: "29 - 39 N·m (3.0 - 4.0 kg-m, 22 - 29 ft-lb)" */
const INLINE_COMPOUND_RE =
  /^([\d.]+\s*[-–]\s*[\d.]+)\s*N[·.]m\s*\(\s*([\d.]+\s*[-–]\s*[\d.]+)\s*kg[-·]m\s*,\s*([\d.]+\s*[-–]\s*[\d.]+)\s*ft[-·]lb\s*\)/;

// ── Helpers ────────────────────────────────────────────────────────

function isTorqueLabel(label: string): boolean {
  return /torque|tightening/i.test(label);
}

function cleanName(label: string): string {
  // Remove trailing " torque" or "tightening torque" from the label
  return label
    .replace(/\s*(?:tightening\s+)?torque$/i, "")
    .replace(/\s*(?:thread of bolts)$/i, "")
    .trim();
}

function normalize(s: string): string {
  return s.replace(/–/g, "-").trim();
}

function pageUrl(page: ManualPage) {
  return {
    sectionSlug: sectionCodeToSlug(page.section),
    pageSlug: pageCodeToSlug(page.page_code),
  };
}

// ── Extraction from specs blocks ───────────────────────────────────

function extractFromSpecs(
  block: SpecsBlock,
  page: ManualPage,
  sectionName: string,
): TorqueSpec[] {
  const results: TorqueSpec[] = [];
  const { sectionSlug, pageSlug } = pageUrl(page);

  // Group items by label to merge triple-row format (N·m, kg-m, ft-lb)
  const grouped = new Map<string, { nm: string; kgm: string; ftlb: string; condition?: string }>();

  for (const item of block.items) {
    if (!isTorqueLabel(item.label)) continue;

    const name = cleanName(item.label);
    const key = name.toLowerCase();
    const unit = (item.unit ?? "").toLowerCase();

    // Format B: compound unit "N·m (kg·m, ft·lb)" with compound value
    if (unit.includes("kg") && unit.includes("ft")) {
      const m = COMPOUND_RE.exec(item.value);
      if (m) {
        grouped.set(key, {
          nm: normalize(m[1]),
          kgm: normalize(m[2]),
          ftlb: normalize(m[3]),
          condition: item.condition ?? undefined,
        });
        continue;
      }
    }

    // Format C: inline compound in value field
    const im = INLINE_COMPOUND_RE.exec(item.value);
    if (im) {
      grouped.set(key, {
        nm: normalize(im[1]),
        kgm: normalize(im[2]),
        ftlb: normalize(im[3]),
        condition: item.condition ?? undefined,
      });
      continue;
    }

    // Format A: triple-row (one item per unit)
    const existing = grouped.get(key) ?? { nm: "—", kgm: "—", ftlb: "—" };
    if (unit.includes("n") && unit.includes("m") && !unit.includes("kg")) {
      existing.nm = normalize(item.value);
    } else if (unit.includes("kg")) {
      existing.kgm = normalize(item.value);
    } else if (unit.includes("ft")) {
      existing.ftlb = normalize(item.value);
    } else {
      // Unknown unit — put it in N·m as fallback
      existing.nm = normalize(item.value);
    }
    if (item.condition) existing.condition = item.condition;
    grouped.set(key, existing);
  }

  for (const [, vals] of grouped) {
    // Reconstruct the proper-case name from the first matching item
    const origItem = block.items.find(
      (i) => isTorqueLabel(i.label) && cleanName(i.label).toLowerCase() === Array.from(grouped.keys()).find((k) => grouped.get(k) === vals),
    );
    const displayName = origItem ? cleanName(origItem.label) : "";

    results.push({
      name: displayName,
      section: page.section,
      sectionName,
      sectionSlug,
      pageCode: page.page_code,
      pageSlug,
      ...vals,
    });
  }

  return results;
}

// ── Extraction from table blocks ───────────────────────────────────

function extractFromTable(
  block: TableBlock,
  page: ManualPage,
  sectionName: string,
): TorqueSpec[] {
  const results: TorqueSpec[] = [];
  const { sectionSlug, pageSlug } = pageUrl(page);
  const cols = block.columns;

  // Format D: separate nm/kgm/ftlb columns (like MA-29, MA-31)
  const nmCol = cols.find((c) => c.key === "nm" || c.label === "N·m");
  const kgmCol = cols.find((c) => c.key === "kgm" || c.label === "kg-m");
  const ftlbCol = cols.find((c) => c.key === "ftlb" || c.label === "ft-lb");
  const nameCol = cols.find(
    (c) => c.key === "unit" || c.key === "item" || c.key === "component",
  );

  if (nmCol && nameCol) {
    // Skip if this is the GI-20 standard bolts table (handled separately)
    if (page.page_code === "GI-20") return results;

    for (const row of block.rows) {
      const name = String(row[nameCol.key] ?? "").trim();
      if (!name) continue;

      results.push({
        name,
        section: page.section,
        sectionName,
        sectionSlug,
        pageCode: page.page_code,
        pageSlug,
        nm: normalize(String(row[nmCol.key] ?? "—")),
        kgm: kgmCol ? normalize(String(row[kgmCol.key] ?? "—")) : "—",
        ftlb: ftlbCol ? normalize(String(row[ftlbCol.key] ?? "—")) : "—",
      });
    }
    return results;
  }

  // Format E: compound torque column (like AT-75)
  const torqueCol = cols.find(
    (c) =>
      /torque/i.test(c.label) &&
      (/n[·.]m/i.test(c.label) || /kg/i.test(c.label)),
  );
  if (torqueCol) {
    // Find a "name" column — first column that isn't the torque column
    const firstCol = cols.find((c) => c.key !== torqueCol.key);
    if (!firstCol) return results;

    for (const row of block.rows) {
      const rawName = String(row[firstCol.key] ?? "").trim();
      const rawVal = String(row[torqueCol.key] ?? "").trim();
      if (!rawVal) continue;

      const m = COMPOUND_RE.exec(rawVal);
      if (m) {
        // Construct a meaningful name: table title + first-col value
        const prefix = block.title
          ? block.title.replace(/tighten(?:ing)?\s+(?:bolts?\s+)?(?:securing\s+)?/i, "").trim()
          : "";
        const name = prefix && rawName ? `${prefix} — ${rawName}` : rawName || prefix || "—";

        results.push({
          name,
          section: page.section,
          sectionName,
          sectionSlug,
          pageCode: page.page_code,
          pageSlug,
          nm: normalize(m[1]),
          kgm: normalize(m[2]),
          ftlb: normalize(m[3]),
        });
      }
    }
    return results;
  }

  // Also catch tables whose title contains "torque" but columns don't match above patterns
  if (block.title && /torque|tightening/i.test(block.title)) {
    // Try to extract from first numeric-looking column pair
    for (const row of block.rows) {
      const entries = Object.entries(row);
      if (entries.length >= 2) {
        const name = String(entries[0][1] ?? "").trim();
        const val = String(entries[1][1] ?? "").trim();
        if (name && val) {
          results.push({
            name,
            section: page.section,
            sectionName,
            sectionSlug,
            pageCode: page.page_code,
            pageSlug,
            nm: normalize(val),
            kgm: "—",
            ftlb: "—",
          });
        }
      }
    }
  }

  return results;
}

// ── Extraction from parts_diagram blocks ───────────────────────────

function extractFromPartsDiagram(
  block: PartsDiagramBlock,
  page: ManualPage,
  sectionName: string,
): TorqueSpec[] {
  const results: TorqueSpec[] = [];
  const { sectionSlug, pageSlug } = pageUrl(page);

  for (const part of block.parts) {
    if (!part.note) continue;
    const m = PARTS_TORQUE_RE.exec(part.note);
    if (m) {
      results.push({
        name: part.name,
        section: page.section,
        sectionName,
        sectionSlug,
        pageCode: page.page_code,
        pageSlug,
        nm: normalize(m[1]),
        kgm: normalize(m[2]),
        ftlb: normalize(m[3]),
      });
    }
  }

  return results;
}

// ── GI-20 standard bolts extraction ────────────────────────────────

function extractStandardBolts(page: ManualPage): StandardBoltSpec[] {
  const results: StandardBoltSpec[] = [];

  for (const block of page.content_blocks) {
    if (block.block_type !== "table") continue;
    const tb = block as TableBlock;
    // The standard bolts table has hex_head_nm and hex_flange_nm columns
    if (!tb.columns.some((c) => c.key === "hex_head_nm")) continue;

    for (const row of tb.rows) {
      results.push({
        grade: String(row.grade ?? ""),
        boltSize: String(row.bolt_size ?? ""),
        hexHeadNm: normalize(String(row.hex_head_nm ?? "—")),
        hexHeadKgm: normalize(String(row.hex_head_kgm ?? "—")),
        hexHeadFtlb: normalize(String(row.hex_head_ftlb ?? "—")),
        hexFlangeNm: normalize(String(row.hex_flange_nm ?? "—")),
        hexFlangeKgm: normalize(String(row.hex_flange_kgm ?? "—")),
        hexFlangeFtlb: normalize(String(row.hex_flange_ftlb ?? "—")),
      });
    }
  }

  return results;
}

// ── Main extraction ────────────────────────────────────────────────

export function getTorqueSpecs(): TorqueData {
  if (_torqueData) return _torqueData;

  const pages = getAllPages();
  const allSpecs: TorqueSpec[] = [];
  let standardBolts: StandardBoltSpec[] = [];

  for (const page of pages) {
    const sectionDef = getSectionByCode(page.section);
    const sectionName = sectionDef?.name ?? page.section;

    // Extract GI-20 standard bolts separately
    if (page.page_code === "GI-20") {
      standardBolts = extractStandardBolts(page);
      continue;
    }

    for (const block of page.content_blocks) {
      let specs: TorqueSpec[] = [];

      switch (block.block_type) {
        case "specs":
          specs = extractFromSpecs(block as SpecsBlock, page, sectionName);
          break;
        case "table":
          specs = extractFromTable(block as TableBlock, page, sectionName);
          break;
        case "parts_diagram":
          specs = extractFromPartsDiagram(
            block as PartsDiagramBlock,
            page,
            sectionName,
          );
          break;
      }

      allSpecs.push(...specs);
    }
  }

  // Deduplicate: same name + same pageCode → keep first
  const seen = new Set<string>();
  const deduped = allSpecs.filter((s) => {
    const key = `${s.pageCode}::${s.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by section
  const sectionMap = new Map<
    string,
    { code: string; name: string; slug: string; items: TorqueSpec[] }
  >();
  for (const spec of deduped) {
    let group = sectionMap.get(spec.section);
    if (!group) {
      group = {
        code: spec.section,
        name: spec.sectionName,
        slug: spec.sectionSlug,
        items: [],
      };
      sectionMap.set(spec.section, group);
    }
    group.items.push(spec);
  }

  _torqueData = {
    componentTorques: deduped,
    standardBolts,
    bySection: Array.from(sectionMap.values()),
  };

  return _torqueData;
}
