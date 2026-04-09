"use client";

import { useState } from "react";
import { Cog, Expand, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PartsDiagramBlock as PartsDiagramBlockType,
  FigureDetected,
} from "@/lib/data/types";

interface PartsDiagramBlockProps {
  block: PartsDiagramBlockType;
  figures?: FigureDetected[];
  pageId?: string;
}

export function PartsDiagramBlock({ block, figures, pageId }: PartsDiagramBlockProps) {
  const hasNumbers = block.parts.some((p) => p.number != null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imgSrc =
    block.diagram_image ||
    (block.ref_figure && pageId
      ? `/images/${pageId}_${block.ref_figure}.png`
      : null);

  return (
    <div className="my-4">
      <div className="flex items-center gap-2 mb-2">
        <Cog className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Parts Diagram</span>
        {block.ref_figure && (
          <Badge variant="outline" className="text-xs">
            Fig. {block.ref_figure}
          </Badge>
        )}
      </div>

      {block.description && (
        <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
      )}

      {imgSrc ? (
        <div className="mb-4">
          <div
            className="group relative cursor-pointer rounded-lg border border-border bg-white overflow-hidden transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/20"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
            aria-label={`View ${block.description ?? "parts diagram"} fullscreen`}
          >
            <img
              src={imgSrc}
              alt={block.description ?? "Parts diagram"}
              className="w-full h-auto"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
              <div className="rounded-full bg-background/90 p-2 opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100">
                <Expand className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <ImageLightbox
            src={imgSrc}
            alt={block.description ?? "Parts diagram"}
            caption={block.ref_figure ? `Fig. ${block.ref_figure}` : null}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        </div>
      ) : (
        <div className="mt-3 mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ImageOff className="h-3.5 w-3.5" />
          <span>Exploded view diagram will be available in a future update</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {hasNumbers && <TableHead className="w-12">#</TableHead>}
              <TableHead>Part Name</TableHead>
              <TableHead>Notes / Torque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.parts.map((part, i) => (
              <TableRow key={i}>
                {hasNumbers && (
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {part.number ?? "—"}
                  </TableCell>
                )}
                <TableCell className="font-medium text-sm">{part.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {part.note ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
