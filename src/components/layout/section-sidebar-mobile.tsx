"use client";

import { List } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SectionSidebarMobile({
  sectionName,
  children,
}: {
  sectionName: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors lg:hidden">
        <List className="h-3.5 w-3.5" />
        <span>Section</span>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{sectionName}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)] px-2">
          {children}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
