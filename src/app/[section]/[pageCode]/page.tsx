import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  getAllPages,
  getPage,
  getPageNavigation,
  getSectionTOC,
  groupPagesByTOC,
  getSections,
} from "@/lib/data/loader";
import { pageCodeToSlug, sectionCodeToSlug, getSectionByCode } from "@/lib/data/sections";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageNavSetter } from "@/components/layout/page-nav-context";
import { CrossReferences } from "@/components/layout/cross-references";
import { ContinuationNav } from "@/components/layout/continuation-nav";
import { PageFooterNav } from "@/components/layout/page-footer-nav";
import { SectionSidebar } from "@/components/layout/section-sidebar";
import { SectionSidebarMobile } from "@/components/layout/section-sidebar-mobile";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { Badge } from "@/components/ui/badge";
import type { ContentBlock } from "@/lib/data/types";

/** Strip trailing (Cont'd) / parentheticals and normalize for comparison */
function normalizeTitle(text: string): string {
  return text
    .replace(/\s*\(cont[''\u2019]?d\)/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Filter out duplicate headings:
 *  - First heading if it duplicates the page title.
 *  - Any heading immediately followed by a procedure with the same title.
 */
function deduplicateBlocks(blocks: ContentBlock[], pageTitle: string): ContentBlock[] {
  if (blocks.length === 0) return blocks;

  const result: ContentBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    // Skip first heading if it duplicates the page title
    if (i === 0 && block.block_type === "heading") {
      const level = block.level ?? 1;
      if (level <= 1) {
        const norm1 = normalizeTitle(block.text);
        const norm2 = normalizeTitle(pageTitle);
        if (norm1 === norm2 || norm2.startsWith(norm1) || norm1.startsWith(norm2)) {
          continue;
        }
      }
    }

    // Skip heading when the next block is a procedure with the same title
    if (
      block.block_type === "heading" &&
      next?.block_type === "procedure" &&
      next.title &&
      normalizeTitle(block.text) === normalizeTitle(next.title)
    ) {
      continue;
    }

    result.push(block);
  }

  return result;
}

/** Derive the page stem used for image filenames (e.g. "page-0005-005") */
function getPageId(page: { page_code: string; source_image?: string }): string | undefined {
  // The JSON files are named like page-0005-005.json, and images like page-0005-005_fig1.png
  // We can't reliably derive this from page_code, so we use the loader's file name
  // which is stored as source_image (hallucinated) — instead we rely on the data file naming
  // The getAllPages loader doesn't store the filename, so we need another approach
  return undefined;
}

/** Return 404 for paths not in generateStaticParams (e.g. missing images) */
export const dynamicParams = false;

export function generateStaticParams() {
  const pages = getAllPages();
  return pages.map((p) => ({
    section: sectionCodeToSlug(p.section),
    pageCode: pageCodeToSlug(p.page_code),
  }));
}

export function generateMetadata({ params }: { params: Promise<{ section: string; pageCode: string }> }) {
  return params.then((p) => {
    const page = getPage(p.section, p.pageCode);
    return {
      title: page
        ? `${page.page_code}: ${page.title} — K11 Service Manual`
        : "Page Not Found",
    };
  });
}

export default async function ManualPageView({
  params,
}: {
  params: Promise<{ section: string; pageCode: string }>;
}) {
  const { section: sectionSlug, pageCode: pageSlug } = await params;
  const page = getPage(sectionSlug, pageSlug);
  if (!page) notFound();

  const sectionMeta = getSectionByCode(page.section);
  const { prev, next } = getPageNavigation(page.page_code);

  // Get the pageId for image references (stored by loader)
  const pageId = (page as unknown as { _fileId?: string })._fileId;

  const hasUncertainValues =
    page._extraction_meta?.uncertain_values &&
    page._extraction_meta.uncertain_values.length > 0;

  // Sidebar data
  const tocEntries = getSectionTOC(page.section);
  const sections = getSections();
  const sectionData = sections.find((s) => s.code === page.section);
  const sidebarPages = sectionData?.pages ?? [];
  const { groups, ungrouped } = groupPagesByTOC(sidebarPages, tocEntries);
  const sectionName = sectionMeta?.name ?? page.section;

  const sidebarContent = (
    <SectionSidebar
      sectionSlug={sectionSlug}
      sectionName={sectionName}
      groups={groups}
      ungrouped={ungrouped}
      currentPageCode={page.page_code}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:flex lg:gap-8">
      <PageNavSetter prev={prev} next={next} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-60 shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-2">
          {sidebarContent}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs
          items={[
            { label: sectionName, href: `/${sectionSlug}` },
            { label: page.page_code },
          ]}
        />

        {/* Mobile sidebar trigger */}
        <div className="mt-3 lg:hidden">
          <SectionSidebarMobile sectionName={sectionName}>
            {sidebarContent}
          </SectionSidebarMobile>
        </div>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
              {page.page_code}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {page.page_type.replace(/_/g, " ")}
            </Badge>
            {hasUncertainValues && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                Unverified
              </Badge>
            )}
          </div>
          {page.model_notes && (
            <p className="mt-1 text-sm text-muted-foreground italic">
              {page.model_notes}
            </p>
          )}
        </div>

        {/* Continuation: link to previous page */}
        {page.continuation?.continues_from && (
          <ContinuationNav continuation={{ continues_from: page.continuation.continues_from, continues_to: null }} />
        )}

        <div className="space-y-1">
          {deduplicateBlocks(page.content_blocks, page.title).map((block, i) => (
            <BlockRenderer
              key={i}
              block={block}
              index={i}
              figures={page.figures_detected}
              pageId={pageId}
            />
          ))}
        </div>

        <CrossReferences
          refs={page.cross_references}
          exclude={[
            page.continuation?.continues_from ?? "",
            page.continuation?.continues_to ?? "",
          ]}
          pageType={page.page_type}
        />

        <PageFooterNav prev={prev} next={next} />
      </div>
    </div>
  );
}
