"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { PartsDiagramEntry, PartsDiagramSection } from "@/lib/data/parts";

// ── Section group ──────────────────────────────────────────────────

function SectionGroup({
  sectionName,
  sectionCode,
  items,
}: {
  sectionName: string;
  sectionCode: string;
  items: PartsDiagramEntry[];
}) {
  return (
    <div>
      <div className="sticky top-14 z-10 flex items-center gap-2 min-w-0 overflow-hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-1 py-2">
        <h2 className="text-sm font-semibold truncate">{sectionName}</h2>
        <Badge variant="secondary" className="text-[10px]">
          {sectionCode}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "diagram" : "diagrams"}
        </span>
      </div>

      <div className="grid gap-3 mt-3 sm:grid-cols-2">
        {items.map((entry, i) => (
          <DiagramCard key={`${entry.pageCode}-${entry.refFigure}-${i}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// ── Diagram card ───────────────────────────────────────────────────

function DiagramCard({ entry }: { entry: PartsDiagramEntry }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/${entry.sectionSlug}/${entry.pageSlug}`}
      className="group rounded-xl border border-border bg-card p-3 sm:p-4 overflow-hidden transition-colors hover:bg-accent hover:border-accent-foreground/20"
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Thumbnail */}
        {entry.imagePath && !imgError ? (
          <div className="relative flex-shrink-0 w-full h-28 sm:w-20 sm:h-20 rounded-lg border border-border bg-white overflow-hidden">
            <Image
              src={entry.imagePath}
              alt={entry.title}
              fill
              className="object-contain p-1"
              sizes="(max-width: 640px) 100vw, 80px"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-full h-28 sm:w-20 sm:h-20 rounded-lg border border-dashed border-border/60 bg-muted/30 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/50">No image</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
              {entry.title}
            </h3>
            <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono whitespace-nowrap flex-shrink-0">
              {entry.pageCode}
            </span>
          </div>

          {entry.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {entry.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {entry.partCount} {entry.partCount === 1 ? "part" : "parts"}
            </Badge>
            {entry.refFigure && (
              <Badge variant="outline" className="text-[10px]">
                Fig. {entry.refFigure}
              </Badge>
            )}
          </div>

          {/* Parts preview */}
          <div className="mt-1.5 text-[11px] text-muted-foreground truncate">
            {entry.partsPreview.join(" · ")}
            {entry.partCount > entry.partsPreview.length && " …"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function PartsGallery({
  bySection,
  totalCount,
}: {
  bySection: PartsDiagramSection[];
  totalCount: number;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return bySection;
    const q = search.toLowerCase();
    return bySection
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.pageCode.toLowerCase().includes(q) ||
            e.allPartNames.some((n) => n.toLowerCase().includes(q)) ||
            (e.description?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [bySection, search]);

  const filteredCount = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Filter diagrams or parts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filteredCount === totalCount
            ? `${totalCount} diagrams`
            : `${filteredCount} of ${totalCount}`}
        </span>
      </div>

      {/* Section groups */}
      <div className="space-y-8">
        {filtered.map((group) => (
          <SectionGroup
            key={group.code}
            sectionName={group.name}
            sectionCode={group.code}
            items={group.items}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">No matching parts diagrams</p>
          <p className="mt-1 text-sm">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
