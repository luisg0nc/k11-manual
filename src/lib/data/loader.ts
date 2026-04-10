import fs from "fs";
import path from "path";
import type { ManualPage, SectionMeta, PageSummary, ContentBlock, ProcedureStep } from "./types";
import {
  SECTION_DEFINITIONS,
  FRONT_SECTION,
  pageCodeToSlug,
  sectionCodeToSlug,
  sortPageCodes,
} from "./sections";

// ── Path to extracted JSON data ────────────────────────────────────
const DATA_DIR = path.resolve(process.cwd(), "data", "extracted");

// ── Page cache (populated once per build) ──────────────────────────
let _allPages: ManualPage[] | null = null;
let _sectionMap: Map<string, SectionMeta> | null = null;

/** Load all JSON files from the extracted directory */
export function getAllPages(): ManualPage[] {
  if (_allPages) return _allPages;

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const pages: ManualPage[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
      const page: ManualPage = JSON.parse(raw);
      // Store the file stem as _fileId for image path resolution
      // e.g. "page-0005-005.json" → "page-0005-005"
      (page as unknown as { _fileId: string })._fileId = file.replace(/\.json$/, "");
      pages.push(page);
    } catch (e) {
      console.warn(`[loader] Failed to parse ${file}:`, e);
    }
  }

  // Filter out front matter, cover pages, and pages with missing identifiers
  const validPages = pages.filter(
    (p) =>
      p.page_code &&
      p.section &&
      p.section !== "FRONT" &&
      p.section !== "" &&
      p.page_type !== "cover",
  );

  // Sort by section order then page number
  validPages.sort((a, b) => {
    const sectionOrder = (code: string) => {
      const idx = SECTION_DEFINITIONS.findIndex((s) => s.code === code);
      return idx >= 0 ? idx : 999;
    };
    const sa = sectionOrder(a.section);
    const sb = sectionOrder(b.section);
    if (sa !== sb) return sa - sb;
    return sortPageCodes(a.page_code, b.page_code);
  });

  // Deduplicate by section+page_code, keeping the version with the most content_blocks
  const seen = new Map<string, ManualPage>();
  for (const page of validPages) {
    const key = `${page.section}::${page.page_code}`;
    const existing = seen.get(key);
    if (!existing || page.content_blocks.length > existing.content_blocks.length) {
      seen.set(key, page);
    }
  }

  _allPages = Array.from(seen.values());
  return _allPages;
}

/** Build section index with page lists */
export function getSections(): SectionMeta[] {
  if (_sectionMap) return Array.from(_sectionMap.values());

  const pages = getAllPages();
  const map = new Map<string, SectionMeta>();

  // Initialize all known sections (even empty ones), skip FRONT
  for (const def of SECTION_DEFINITIONS) {
    map.set(def.code, {
      ...def,
      pageCount: 0,
      pages: [],
    });
  }

  for (const page of pages) {
    const sectionCode = page.section;
    // Skip front matter and cover pages
    if (sectionCode === "FRONT" || sectionCode === "" || page.page_type === "cover") continue;
    let section = map.get(sectionCode);
    if (!section) {
      // Unknown section — create it
      const slug = sectionCodeToSlug(sectionCode);
      section = {
        code: sectionCode,
        name: sectionCode,
        slug,
        pageCount: 0,
        pages: [],
      };
      map.set(sectionCode, section);
    }

    const summary: PageSummary = {
      page_code: page.page_code,
      title: page.title,
      page_type: page.page_type,
      slug: pageCodeToSlug(page.page_code),
    };

    section.pages.push(summary);
    section.pageCount++;
  }

  _sectionMap = map;
  return Array.from(map.values()).filter((s) => s.pageCount > 0);
}

/** Get ALL sections including empty/WIP ones */
export function getAllSections(): SectionMeta[] {
  // Ensure _sectionMap is populated
  getSections();
  if (!_sectionMap) return [];
  return Array.from(_sectionMap.values());
}

/** Get a single page by section slug and page slug */
export function getPage(sectionSlug: string, pageSlug: string): ManualPage | undefined {
  const pages = getAllPages();
  return pages.find((p) => {
    const pSlug = pageCodeToSlug(p.page_code);
    const sSlug = sectionCodeToSlug(p.section);
    return sSlug === sectionSlug && pSlug === pageSlug;
  });
}

/** Get a page by its page_code */
export function getPageByCode(pageCode: string): ManualPage | undefined {
  return getAllPages().find((p) => p.page_code === pageCode);
}

/** Get section by slug */
export function getSectionBySlug(slug: string): SectionMeta | undefined {
  return getSections().find((s) => s.slug === slug);
}

/** Get prev/next pages for navigation */
export function getPageNavigation(pageCode: string) {
  const pages = getAllPages();
  const idx = pages.findIndex((p) => p.page_code === pageCode);
  return {
    prev: idx > 0 ? pages[idx - 1] : null,
    next: idx < pages.length - 1 ? pages[idx + 1] : null,
  };
}

/** Structured search fields extracted from a page */
export interface ExtractedSearchFields {
  headings: string;
  body: string;
  tools: string;
  crossRefs: string;
  diagnostics: string;
}

/** Extract structured search fields from a page for multi-field indexing */
export function extractSearchFields(page: ManualPage): ExtractedSearchFields {
  const headings: string[] = [];
  const body: string[] = [page.title, page.page_code];
  const diagnostics: string[] = [];

  for (const block of page.content_blocks) {
    extractBlockTextMulti(block, { headings, body, diagnostics });
  }

  if (page.model_notes) body.push(page.model_notes);

  // Tools
  const tools: string[] = [];
  if (page.tools_referenced) {
    for (const t of page.tools_referenced) {
      if (t.name) tools.push(t.name);
      if (t.part_number) tools.push(t.part_number);
      if (t.usage) tools.push(t.usage);
    }
  }

  // Cross-references
  const crossRefs: string[] = page.cross_references ?? [];

  // Figures
  if (page.figures_detected) {
    for (const f of page.figures_detected) {
      if (f.description) body.push(f.description);
    }
  }

  return {
    headings: headings.join(" "),
    body: body.join(" "),
    tools: tools.join(" "),
    crossRefs: crossRefs.join(" "),
    diagnostics: diagnostics.join(" "),
  };
}

/** Legacy single-string extraction (kept for backward compatibility) */
export function extractSearchText(page: ManualPage): string {
  const fields = extractSearchFields(page);
  return [fields.headings, fields.body, fields.tools, fields.crossRefs, fields.diagnostics]
    .filter(Boolean)
    .join(" ");
}

/** Recursively extract text from procedure steps (handles substeps) */
function extractProcedureSteps(steps: (string | ProcedureStep)[], parts: string[]) {
  for (const s of steps) {
    if (typeof s === "string") {
      parts.push(s);
    } else {
      parts.push(s.text);
      if (s.warnings) {
        for (const w of s.warnings) {
          if (typeof w === "string") parts.push(w);
          else if (w && typeof w === "object" && "text" in w) parts.push(String((w as { text: string }).text));
        }
      }
      if (s.notes) {
        for (const n of s.notes) {
          if (typeof n === "string") parts.push(n);
          else if (n && typeof n === "object" && "text" in n) parts.push(String((n as { text: string }).text));
        }
      }
      if (s.substeps) extractProcedureSteps(s.substeps, parts);
      // Some extracted data uses "sub_steps" instead of "substeps"
      const alt = (s as unknown as Record<string, unknown>)["sub_steps"];
      if (Array.isArray(alt)) extractProcedureSteps(alt as (string | ProcedureStep)[], parts);
    }
  }
}

/** Extract text from a legend (handles all known legend formats) */
function extractLegend(legend: unknown, parts: string[]) {
  if (!legend) return;
  if (typeof legend === "string") {
    parts.push(legend);
  } else if (Array.isArray(legend)) {
    for (const item of legend) {
      if (typeof item === "string") {
        parts.push(item);
      } else if (item && typeof item === "object") {
        if ("symbol" in item && "meaning" in item) {
          parts.push(String(item.symbol), String(item.meaning));
        }
      }
    }
  } else if (typeof legend === "object") {
    for (const [k, v] of Object.entries(legend as Record<string, string>)) {
      parts.push(k, v);
    }
  }
}

interface MultiParts {
  headings: string[];
  body: string[];
  diagnostics: string[];
}

function extractBlockTextMulti(block: ContentBlock, parts: MultiParts) {
  switch (block.block_type) {
    case "heading":
      parts.headings.push(block.text);
      break;
    case "prose":
      parts.body.push(block.text);
      break;
    case "specs":
      for (const item of block.items) {
        parts.body.push(item.label, item.value);
        if (item.unit) parts.body.push(item.unit);
        if (item.condition) parts.body.push(item.condition);
      }
      break;
    case "procedure":
      if (block.title) parts.body.push(block.title);
      if (block.steps) extractProcedureSteps(block.steps, parts.body);
      if (block.methods) {
        for (const m of block.methods) {
          parts.body.push(m.label);
          extractProcedureSteps(m.steps, parts.body);
        }
      }
      break;
    case "flowchart":
      if (block.title) parts.body.push(block.title);
      for (const n of block.nodes) parts.body.push(n.text);
      for (const e of block.edges) {
        if (e.label) parts.body.push(e.label);
      }
      extractLegend(block.legend, parts.body);
      break;
    case "table":
      if (block.title) parts.body.push(block.title);
      for (const col of block.columns) {
        if (col.label) parts.body.push(col.label);
      }
      for (const row of block.rows) {
        for (const val of Object.values(row)) {
          if (typeof val === "string") parts.body.push(val);
        }
      }
      extractLegend(block.legend, parts.body);
      break;
    case "component_location":
      if (block.description) parts.body.push(block.description);
      if (block.callouts) {
        for (const c of block.callouts) parts.body.push(c.label);
      }
      break;
    case "parts_diagram":
      if (block.description) parts.body.push(block.description);
      for (const p of block.parts) {
        parts.body.push(p.name);
        if (p.note) parts.body.push(p.note);
      }
      break;
    case "wiring_schematic":
      if (block.title) parts.body.push(block.title);
      if (block.description) parts.body.push(block.description);
      if (block.components) {
        for (const c of block.components) parts.body.push(c.name);
      }
      if (block.wires) {
        for (const w of block.wires) {
          if (w.signal) parts.body.push(w.signal);
          if (w.color) parts.body.push(w.color);
          if (w.color_full) parts.body.push(w.color_full);
        }
      }
      if (block.notes) {
        if (typeof block.notes === "string") parts.body.push(block.notes);
        else if (Array.isArray(block.notes)) {
          for (const n of block.notes) {
            if (typeof n === "string") parts.body.push(n);
          }
        }
      }
      break;
    case "diagnostic_code":
      parts.diagnostics.push(block.code_number, block.code_name);
      if (block.description) parts.diagnostics.push(block.description);
      if (block.possible_causes) parts.diagnostics.push(...block.possible_causes);
      if (block.diagnostic_procedure) parts.diagnostics.push(block.diagnostic_procedure);
      break;
  }
}

// ── TOC Grouping ─────────────────────────────────────────────────

export interface TocEntry {
  topic: string;
  startPageCode: string;
}

export interface PageGroup {
  topic: string;
  startPageCode: string;
  pages: PageSummary[];
}

/** Extract the TOC entries for a section from its index_toc page */
export function getSectionTOC(sectionCode: string): TocEntry[] {
  const pages = getAllPages();
  const tocPage = pages.find(
    (p) => p.section === sectionCode && p.page_type === "index_toc",
  );
  if (!tocPage) return [];

  for (const block of tocPage.content_blocks) {
    if (block.block_type === "table") {
      const hasPage = block.columns.some((c) => c.key === "page");
      // Accept "topic" or "section_name" as the topic column
      const topicKey = block.columns.find(
        (c) => c.key === "topic" || c.key === "section_name",
      )?.key;
      if (hasPage && topicKey) {
        return block.rows
          .filter(
            (r) => typeof r[topicKey] === "string" && typeof r.page === "string",
          )
          .map((r) => ({
            topic: r[topicKey] as string,
            startPageCode: r.page as string,
          }));
      }
    }
  }
  return [];
}

/** Extract page number from a page code (e.g. "EM-16" → 16) */
function pageNumber(pageCode: string): number {
  const m = pageCode.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Group pages by TOC structure. Pages before the first group go into `ungrouped`. */
export function groupPagesByTOC(
  pages: PageSummary[],
  tocEntries: TocEntry[],
): { groups: PageGroup[]; ungrouped: PageSummary[] } {
  if (tocEntries.length === 0) return { groups: [], ungrouped: pages };

  // Build start-page-number boundaries for each group
  const boundaries = tocEntries.map((e) => ({
    ...e,
    startNum: pageNumber(e.startPageCode),
  }));

  const ungrouped: PageSummary[] = [];
  const groups: PageGroup[] = boundaries.map((b) => ({
    topic: b.topic,
    startPageCode: b.startPageCode,
    pages: [],
  }));

  for (const page of pages) {
    const num = pageNumber(page.page_code);

    // Pages before the first group boundary go into ungrouped
    if (num < boundaries[0].startNum) {
      ungrouped.push(page);
      continue;
    }

    // Find the group this page belongs to (last boundary <= num)
    let groupIdx = 0;
    for (let i = boundaries.length - 1; i >= 0; i--) {
      if (num >= boundaries[i].startNum) {
        groupIdx = i;
        break;
      }
    }
    groups[groupIdx].pages.push(page);
  }

  return { groups, ungrouped };
}

/** Resolve a cross-reference string (e.g. "MA-16") to a route */
export function resolveReference(ref: string): { href: string; label: string } | null {
  // Try to match page codes like "MA-16", "EF & EC-22", "GI-2"
  const match = ref.match(/^([A-Z &]+)-?(\d+)?$/i);
  if (!match) return { href: "#", label: ref };

  const sectionCode = match[1].trim().toUpperCase();
  const pageNum = match[2];

  const sectionSlug = sectionCodeToSlug(sectionCode);

  if (pageNum) {
    const pageSlug = `${sectionSlug}-${pageNum}`;
    return { href: `/${sectionSlug}/${pageSlug}`, label: ref };
  }

  return { href: `/${sectionSlug}`, label: ref };
}
