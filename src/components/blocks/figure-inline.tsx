"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { FigureDetected } from "@/lib/data/types";

interface FigureInlineProps {
  figure: FigureDetected;
  pageId: string;
}

export function FigureInline({ figure, pageId }: FigureInlineProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const src = `/images/${pageId}_${figure.fig_id}.png`;

  return (
    <>
      <div className="group my-2 cursor-pointer rounded-lg border border-border bg-white dark:bg-muted/20 overflow-hidden transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/20"
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        aria-label={`View ${figure.description || "figure"} fullscreen`}
      >
        <div className="relative">
          <img
            src={src}
            alt={figure.description}
            className="w-full h-auto"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5 dark:group-hover:bg-black/10">
            <div className="rounded-full bg-background/90 p-2 opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100">
              <Expand className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        {figure.ref_code && (
          <div className="px-2 py-1 text-[10px] text-muted-foreground border-t border-border/40">
            {figure.ref_code}
          </div>
        )}
      </div>

      <ImageLightbox
        src={src}
        alt={figure.description}
        caption={figure.ref_code}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
