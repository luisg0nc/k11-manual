import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageCodeToSlug, sectionCodeToSlug } from "@/lib/data/sections";
import type { ManualPage, Continuation } from "@/lib/data/types";

function pageHref(page: ManualPage) {
  return `/${sectionCodeToSlug(page.section)}/${pageCodeToSlug(page.page_code)}`;
}

interface PageFooterNavProps {
  prev: ManualPage | null;
  next: ManualPage | null;
}

export function PageFooterNav({ prev, next }: PageFooterNavProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page navigation"
      className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6"
    >
      {prev ? (
        <Link
          href={pageHref(prev)}
          className="group flex items-start gap-2 rounded-lg p-3 transition-colors hover:bg-accent/60"
        >
          <ChevronLeft className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div className="min-w-0">
            <div className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {prev.page_code}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={pageHref(next)}
          className="group flex items-start justify-end gap-2 rounded-lg p-3 text-right transition-colors hover:bg-accent/60"
        >
          <div className="min-w-0">
            <div className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {next.page_code}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {next.title}
            </div>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
