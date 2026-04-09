/**
 * Prebuild script — generates static data files for the frontend.
 *
 * Run: npx tsx scripts/prebuild.ts
 * Or automatically via the "prebuild" npm script.
 *
 * Outputs:
 *   public/search-index.json — serialized MiniSearch index for instant client-side search
 *   public/search-docs.json  — raw search documents (for snippet extraction)
 */

import fs from "fs";
import path from "path";
import MiniSearch from "minisearch";

// Import from src — tsx resolves TS path aliases via tsconfig
import { getAllPages, extractSearchFields } from "../src/lib/data/loader";
import { pageCodeToSlug, sectionCodeToSlug } from "../src/lib/data/sections";
import type { SearchDocument } from "../src/lib/data/types";

// ── Paths ──────────────────────────────────────────────────────────
const IMG_SRC = path.resolve(__dirname, "..", "data", "images");
const OUTPUT_DIR = path.resolve(__dirname, "..", "public");
const IMG_DEST = path.resolve(OUTPUT_DIR, "images");

// ── MiniSearch field configuration (must match client-side exactly) ──
const SEARCH_FIELDS = ["pageCode", "title", "headings", "body", "tools", "crossRefs", "diagnostics"] as const;
const STORE_FIELDS = ["pageCode", "section", "title", "pageType", "body"] as const;

function main() {
  console.log("[prebuild] Building search index…");

  const pages = getAllPages();
  console.log(`[prebuild] Loaded ${pages.length} pages`);

  const searchDocs: SearchDocument[] = [];
  const sectionCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const seenIds = new Set<string>();

  for (const page of pages) {
    const sSlug = sectionCodeToSlug(page.section);
    const pSlug = pageCodeToSlug(page.page_code);
    const fields = extractSearchFields(page);

    // Ensure unique IDs (some section dividers share a page_code)
    let id = `${sSlug}/${pSlug}`;
    if (seenIds.has(id)) {
      let counter = 2;
      while (seenIds.has(`${id}-${counter}`)) counter++;
      id = `${id}-${counter}`;
    }
    seenIds.add(id);

    const doc: SearchDocument = {
      id,
      pageCode: page.page_code,
      section: page.section,
      title: page.title,
      pageType: page.page_type,
      headings: fields.headings,
      body: fields.body,
      tools: fields.tools,
      crossRefs: fields.crossRefs,
      diagnostics: fields.diagnostics,
    };

    searchDocs.push(doc);
    sectionCounts[page.section] = (sectionCounts[page.section] || 0) + 1;
    typeCounts[page.page_type] = (typeCounts[page.page_type] || 0) + 1;
  }

  // Build MiniSearch index
  const miniSearch = new MiniSearch({
    fields: [...SEARCH_FIELDS],
    storeFields: [...STORE_FIELDS],
    idField: "id",
  });
  miniSearch.addAll(searchDocs);

  // Write outputs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Serialized MiniSearch index (loaded client-side via MiniSearch.loadJSON)
  const indexPath = path.join(OUTPUT_DIR, "search-index.json");
  fs.writeFileSync(indexPath, JSON.stringify(miniSearch));
  console.log(`[prebuild] Wrote MiniSearch index to ${indexPath}`);

  // Raw search docs (for snippet extraction on client)
  const docsPath = path.join(OUTPUT_DIR, "search-docs.json");
  fs.writeFileSync(docsPath, JSON.stringify(searchDocs));
  console.log(`[prebuild] Wrote ${searchDocs.length} search documents to ${docsPath}`);

  // ── Copy extracted figure images to public/images/ ──
  if (fs.existsSync(IMG_SRC)) {
    fs.mkdirSync(IMG_DEST, { recursive: true });
    const images = fs.readdirSync(IMG_SRC).filter((f) => f.endsWith(".png"));
    let copied = 0;
    for (const img of images) {
      const srcPath = path.join(IMG_SRC, img);
      const destPath = path.join(IMG_DEST, img);
      fs.copyFileSync(srcPath, destPath);
      copied++;
    }
    console.log(`[prebuild] Copied ${copied} images to ${IMG_DEST}`);
  } else {
    console.warn(`[prebuild] Image source dir not found: ${IMG_SRC}`);
  }

  // Print summary
  console.log("\n[prebuild] === Summary ===");
  console.log(`  Total pages: ${searchDocs.length}`);
  console.log("  Sections:");
  for (const [section, count] of Object.entries(sectionCounts).sort()) {
    console.log(`    ${section}: ${count} pages`);
  }
  console.log("  Page types:");
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.log(`    ${type}: ${count}`);
  }
}

main();
