"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchDialog } from "./search-dialog";

export function SearchButton() {
  const { setOpen } = useSearchDialog();

  return (
    <Button
      variant="outline"
      className="relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:py-2"
      onClick={() => setOpen(true)}
    >
      <Search className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline-flex text-sm text-muted-foreground">
        Search manual...
      </span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        ⌘K
      </kbd>
    </Button>
  );
}
