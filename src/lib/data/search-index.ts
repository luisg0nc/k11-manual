import { getAllPages, extractSearchFields } from "./loader";
import { pageCodeToSlug, sectionCodeToSlug } from "./sections";
import type { SearchDocument } from "./types";

/** Build search documents from all pages (used at build time) */
export function buildSearchDocuments(): SearchDocument[] {
  const pages = getAllPages();
  return pages.map((page) => {
    const fields = extractSearchFields(page);
    return {
      id: `${sectionCodeToSlug(page.section)}/${pageCodeToSlug(page.page_code)}`,
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
  });
}
