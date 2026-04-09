import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FigureInline } from "./figure-inline";
import type {
  ComponentLocationBlock as ComponentLocationBlockType,
  FigureDetected,
} from "@/lib/data/types";

interface ComponentLocationBlockProps {
  block: ComponentLocationBlockType;
  figures?: FigureDetected[];
  pageId?: string;
}

export function ComponentLocationBlock({ block, figures, pageId }: ComponentLocationBlockProps) {
  const figure =
    block.ref_figure && figures
      ? figures.find((f) => f.fig_id === block.ref_figure)
      : undefined;

  return (
    <div className="my-4 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Component Location</span>
        {block.ref_figure && (
          <Badge variant="outline" className="text-xs">
            Fig. {block.ref_figure}
          </Badge>
        )}
      </div>

      {block.description && (
        <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
      )}

      {figure && pageId && (
        <div className="mb-3 max-w-md">
          <FigureInline figure={figure} pageId={pageId} />
        </div>
      )}

      {block.callouts && block.callouts.length > 0 && (
        <div className="grid gap-1.5">
          {block.callouts.map((callout, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span>{callout.label}</span>
              <span className="text-xs text-muted-foreground">({callout.position})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
