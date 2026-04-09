import type { ContentBlock, FigureDetected } from "@/lib/data/types";
import { HeadingBlock } from "./heading-block";
import { ProseBlock } from "./prose-block";
import { SpecsBlock } from "./specs-block";
import { ProcedureBlock } from "./procedure-block";
import { FlowchartBlock } from "./flowchart-block";
import { TableBlockComponent } from "./table-block";
import { ComponentLocationBlock } from "./component-location-block";
import { PartsDiagramBlock } from "./parts-diagram-block";
import { WiringSchematicBlock } from "./wiring-schematic-block";
import { DiagnosticCodeBlock } from "./diagnostic-code-block";

interface BlockRendererProps {
  block: ContentBlock;
  index: number;
  figures?: FigureDetected[];
  pageId?: string;
}

export function BlockRenderer({ block, index, figures, pageId }: BlockRendererProps) {
  switch (block.block_type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "prose":
      return <ProseBlock block={block} />;
    case "specs":
      return <SpecsBlock block={block} />;
    case "procedure":
      return <ProcedureBlock block={block} figures={figures} pageId={pageId} />;
    case "flowchart":
      return <FlowchartBlock block={block} blockIndex={index} />;
    case "table":
      return <TableBlockComponent block={block} />;
    case "component_location":
      return <ComponentLocationBlock block={block} figures={figures} pageId={pageId} />;
    case "parts_diagram":
      return <PartsDiagramBlock block={block} figures={figures} pageId={pageId} />;
    case "wiring_schematic":
      return <WiringSchematicBlock block={block} />;
    case "diagnostic_code":
      return <DiagnosticCodeBlock block={block} />;
    default:
      return (
        <div className="my-4 rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
          Unknown block type: {(block as { block_type: string }).block_type}
        </div>
      );
  }
}
