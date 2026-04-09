"use client";

import { Search } from "lucide-react";
import { useSearchDialog } from "./search-dialog";

/**
 * A large, prominent search trigger for the homepage hero.
 * Clicking it opens the global Cmd+K search dialog.
 */
export function HeroSearch() {
  const { setOpen } = useSearchDialog();

  return (
    <button
      onClick={() => setOpen(true)}
      className="group mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-border bg-card/80 px-5 py-3.5 text-left shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="flex-1 text-sm text-muted-foreground sm:text-base">
        Search pages, specs, procedures…
      </span>
      <kbd className="hidden items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}
