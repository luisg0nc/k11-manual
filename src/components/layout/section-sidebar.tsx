import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PageGroup, TocEntry } from "@/lib/data/loader";
import type { PageSummary } from "@/lib/data/types";

interface SectionSidebarProps {
  sectionSlug: string;
  sectionName: string;
  groups: PageGroup[];
  ungrouped: PageSummary[];
  currentPageCode: string;
}

export function SectionSidebar({
  sectionSlug,
  sectionName,
  groups,
  ungrouped,
  currentPageCode,
}: SectionSidebarProps) {
  const hasGroups = groups.length > 0;

  // Flat list fallback when no TOC grouping exists
  if (!hasGroups) {
    const allPages = [...ungrouped];
    return (
      <nav aria-label="Section pages">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
          {sectionName}
        </h4>
        <div className="space-y-0.5">
          {allPages.map((page, i) => (
            <SidebarPageLink
              key={`${page.slug}-${i}`}
              page={page}
              sectionSlug={sectionSlug}
              isCurrent={page.page_code === currentPageCode}
            />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Section pages">
      <Link
        href={`/${sectionSlug}`}
        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-3 px-2 transition-colors"
      >
        {sectionName}
      </Link>

      {/* Ungrouped pages (TOC page etc.) */}
      {ungrouped.length > 0 && (
        <div className="mb-3 space-y-0.5">
          {ungrouped.map((page, i) => (
            <SidebarPageLink
              key={`${page.slug}-${i}`}
              page={page}
              sectionSlug={sectionSlug}
              isCurrent={page.page_code === currentPageCode}
            />
          ))}
        </div>
      )}

      {/* Grouped pages */}
      {groups.map((group) => {
        const containsCurrent = group.pages.some(
          (p) => p.page_code === currentPageCode,
        );
        return (
          <details
            key={group.topic}
            open={containsCurrent}
            className="mb-1 group"
          >
            <summary className="cursor-pointer select-none rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors list-none flex items-center gap-1.5">
              <svg
                className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M4.5 2l4 4-4 4" />
              </svg>
              <span className="truncate">{group.topic}</span>
            </summary>
            <div className="ml-2 border-l border-border/50 space-y-0.5 pl-1 mt-0.5 mb-2">
              {group.pages.map((page, i) => (
                <SidebarPageLink
                  key={`${page.slug}-${i}`}
                  page={page}
                  sectionSlug={sectionSlug}
                  isCurrent={page.page_code === currentPageCode}
                />
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
}

function SidebarPageLink({
  page,
  sectionSlug,
  isCurrent,
}: {
  page: PageSummary;
  sectionSlug: string;
  isCurrent: boolean;
}) {
  return (
    <Link
      href={`/${sectionSlug}/${page.slug}`}
      className={cn(
        "block py-1 px-2 rounded-md transition-colors",
        isCurrent
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
      )}
      aria-current={isCurrent ? "page" : undefined}
      title={`${page.page_code}: ${page.title}`}
    >
      <span className="font-mono text-[11px]">{page.page_code}</span>
      <span className="block text-[10px] leading-tight line-clamp-2 opacity-80">
        {page.title}
      </span>
    </Link>
  );
}
