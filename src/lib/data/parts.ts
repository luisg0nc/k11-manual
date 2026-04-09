import { getAllPages } from "./loader";
import {
  pageCodeToSlug,
  sectionCodeToSlug,
  getSectionByCode,
} from "./sections";
import type { ManualPage, PartsDiagramBlock, FigureDetected } from "./types";

// ── Types ──────────────────────────────────────────────────────────

export interface PartsDiagramEntry {
  /** Page title, e.g. "OUTER COMPONENT PARTS" */
  title: string;
  /** Section code, e.g. "EM" */
  section: string;
  /** Section display name */
  sectionName: string;
  /** Section URL slug */
  sectionSlug: string;
  /** Page code, e.g. "EM-5" */
  pageCode: string;
  /** Page URL slug */
  pageSlug: string;
  /** Description from the parts_diagram block or figure */
  description: string | null;
  /** Number of parts in this diagram */
  partCount: number;
  /** Named parts list (first 8 for preview) */
  partsPreview: string[];
  /** All part names (for search) */
  allPartNames: string[];
  /** Image path for thumbnail, if available */
  imagePath: string | null;
  /** Figure reference code */
  refFigure: string | null;
}

export interface PartsDiagramSection {
  code: string;
  name: string;
  slug: string;
  items: PartsDiagramEntry[];
}

export interface PartsDiagramData {
  entries: PartsDiagramEntry[];
  bySection: PartsDiagramSection[];
  totalParts: number;
}

// ── Cache ──────────────────────────────────────────────────────────

let _partsData: PartsDiagramData | null = null;

// ── Helpers ────────────────────────────────────────────────────────

function resolveImagePath(
  block: PartsDiagramBlock,
  page: ManualPage,
  figures: FigureDetected[],
): string | null {
  if (block.diagram_image) return block.diagram_image;

  // Try to match ref_figure to a figure entry
  const fileId = (page as unknown as { _fileId?: string })._fileId;
  if (block.ref_figure && fileId) {
    return `/images/${fileId}_${block.ref_figure}.png`;
  }

  // Fall back to first figure detected on the page
  if (figures.length > 0 && fileId) {
    return `/images/${fileId}_${figures[0].fig_id}.png`;
  }

  return null;
}

function getFigureDescription(
  block: PartsDiagramBlock,
  figures: FigureDetected[],
): string | null {
  if (block.description) return block.description;

  // Try to find a matching figure description
  if (block.ref_figure) {
    const fig = figures.find(
      (f) => f.fig_id === block.ref_figure || f.ref_code === block.ref_figure,
    );
    if (fig?.description) return fig.description;
  }

  // Fall back to first parts_diagram figure
  const diagFig = figures.find((f) => f.type === "parts_diagram");
  if (diagFig?.description) return diagFig.description;

  return null;
}

// ── Main extractor ─────────────────────────────────────────────────

export function getPartsDiagrams(): PartsDiagramData {
  if (_partsData) return _partsData;

  const pages = getAllPages();
  const entries: PartsDiagramEntry[] = [];

  for (const page of pages) {
    const figures = page.figures_detected ?? [];
    const sectionDef = getSectionByCode(page.section);
    const sectionSlug = sectionCodeToSlug(page.section);
    const pageSlug = pageCodeToSlug(page.page_code);

    for (const block of page.content_blocks) {
      if (block.block_type !== "parts_diagram") continue;

      const pdBlock = block as PartsDiagramBlock;
      if (!pdBlock.parts || pdBlock.parts.length === 0) continue;

      const allPartNames = pdBlock.parts.map((p) => p.name);

      entries.push({
        title: page.title,
        section: page.section,
        sectionName: sectionDef.name,
        sectionSlug,
        pageCode: page.page_code,
        pageSlug,
        description: getFigureDescription(pdBlock, figures),
        partCount: pdBlock.parts.length,
        partsPreview: allPartNames.slice(0, 8),
        allPartNames,
        imagePath: resolveImagePath(pdBlock, page, figures),
        refFigure: pdBlock.ref_figure ?? null,
      });
    }
  }

  // Group by section
  const sectionMap = new Map<string, PartsDiagramSection>();

  for (const entry of entries) {
    let section = sectionMap.get(entry.section);
    if (!section) {
      section = {
        code: entry.section,
        name: entry.sectionName,
        slug: entry.sectionSlug,
        items: [],
      };
      sectionMap.set(entry.section, section);
    }
    section.items.push(entry);
  }

  const bySection = Array.from(sectionMap.values());
  const totalParts = entries.reduce((sum, e) => sum + e.partCount, 0);

  _partsData = { entries, bySection, totalParts };
  return _partsData;
}
