"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  XIcon,
} from "lucide-react";
import type { FlowchartBlock as FlowchartBlockType } from "@/lib/data/types";
import { DiagnosticTable } from "./diagnostic-table";
import { useTheme } from "@/components/layout/theme-provider";
import {
  sectionCodeToSlug,
  pageCodeToSlug,
} from "@/lib/data/sections";

/* ─── Theme palettes ──────────────────────────────────────────────── */

interface NodePalette {
  fill: string;
  stroke: string;
  color: string;
  extra?: string;
}

type PaletteMap = Record<
  "start" | "decision" | "terminal" | "reference" | "action",
  NodePalette
>;

const LIGHT_PALETTE: PaletteMap = {
  start: { fill: "#d1fae5", stroke: "#059669", color: "#065f46", extra: "font-weight:700" },
  decision: { fill: "#fef3c7", stroke: "#d97706", color: "#78350f", extra: "font-weight:600" },
  terminal: { fill: "#dcfce7", stroke: "#16a34a", color: "#14532d", extra: "font-weight:600" },
  reference: { fill: "#ede9fe", stroke: "#7c3aed", color: "#4c1d95", extra: "stroke-dasharray:5 5" },
  action: { fill: "#dbeafe", stroke: "#2563eb", color: "#1e3a5f" },
};

const DARK_PALETTE: PaletteMap = {
  start: { fill: "#064e3b", stroke: "#34d399", color: "#d1fae5", extra: "font-weight:700" },
  decision: { fill: "#78350f", stroke: "#fbbf24", color: "#fef3c7", extra: "font-weight:600" },
  terminal: { fill: "#14532d", stroke: "#4ade80", color: "#dcfce7", extra: "font-weight:600" },
  reference: { fill: "#3b0764", stroke: "#a78bfa", color: "#ede9fe", extra: "stroke-dasharray:5 5" },
  action: { fill: "#1e3a5f", stroke: "#60a5fa", color: "#dbeafe" },
};

/** Mermaid themeVariables for light & dark */
function getThemeVars(isDark: boolean) {
  return isDark
    ? {
        darkMode: true,
        background: "#171717",
        fontFamily: "'Barlow', system-ui, sans-serif",
        fontSize: "14px",
        primaryColor: "#1e3a5f",
        primaryTextColor: "#dbeafe",
        primaryBorderColor: "#60a5fa",
        secondaryColor: "#1c1917",
        secondaryTextColor: "#a8a29e",
        secondaryBorderColor: "#44403c",
        tertiaryColor: "#292524",
        lineColor: "#64748b",
        textColor: "#e2e8f0",
        mainBkg: "#1e3a5f",
        nodeBorder: "#60a5fa",
        nodeTextColor: "#dbeafe",
        edgeLabelBackground: "#1c1917",
      }
    : {
        darkMode: false,
        background: "#ffffff",
        fontFamily: "'Barlow', system-ui, sans-serif",
        fontSize: "14px",
        primaryColor: "#dbeafe",
        primaryTextColor: "#1e3a5f",
        primaryBorderColor: "#2563eb",
        secondaryColor: "#f5f5f4",
        secondaryTextColor: "#57534e",
        secondaryBorderColor: "#d6d3d1",
        tertiaryColor: "#fafaf9",
        lineColor: "#94a3b8",
        textColor: "#334155",
        mainBkg: "#dbeafe",
        nodeBorder: "#2563eb",
        nodeTextColor: "#1e3a5f",
        edgeLabelBackground: "#f8fafc",
      };
}

/** Custom CSS injected into every Mermaid SVG */
function getThemeCSS(isDark: boolean) {
  const edgeLabelBg = isDark ? "#27272a" : "#f1f5f9";
  const edgeLabelBorder = isDark ? "#3f3f46" : "#cbd5e1";
  const edgeLabelColor = isDark ? "#d4d4d8" : "#475569";
  const linkStroke = isDark ? "#64748b" : "#94a3b8";
  const markerFill = isDark ? "#64748b" : "#94a3b8";
  return `
    /* Node shapes */
    .node rect, .node polygon, .node circle, .node ellipse, .node .label-container {
      rx: 8; ry: 8;
    }
    .node .label {
      font-family: 'Barlow', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }
    /* Edge labels as pills */
    .edgeLabel {
      font-family: 'Barlow', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
    }
    .edgeLabel .label {
      font-size: 12px;
    }
    .edgeLabel rect {
      fill: ${edgeLabelBg} !important;
      stroke: ${edgeLabelBorder} !important;
      stroke-width: 1px;
      rx: 10; ry: 10;
      opacity: 0.95;
    }
    .edgeLabel span {
      color: ${edgeLabelColor} !important;
      padding: 2px 8px;
    }
    /* Edge lines */
    .flowchart-link {
      stroke: ${linkStroke} !important;
      stroke-width: 1.5px;
    }
    marker#flowchart-pointEnd path {
      fill: ${markerFill} !important;
      stroke: ${markerFill} !important;
    }
    /* Reference nodes – clickable styling */
    .node.refNode rect {
      cursor: pointer;
    }
    .node.refNode:hover rect {
      filter: brightness(1.15);
    }
  `;
}

/* ─── Detection helpers ───────────────────────────────────────────── */

/**
 * Detect Type-A flowcharts: diagnostic cause→fix tables.
 * Criteria: no decision nodes AND all edge labels are null/undefined.
 */
function isDiagnosticTable(block: FlowchartBlockType): boolean {
  const hasDecision = block.nodes.some((n) => n.type === "decision");
  if (hasDecision) return false;
  const hasLabels = block.edges.some((e) => e.label != null && e.label !== "");
  return !hasLabels;
}

/**
 * Choose flowchart direction based on graph topology.
 * If reference nodes make up >40% of total, use LR (left-right)
 * to give side-references room. Otherwise default TD (top-down).
 */
function pickDirection(block: FlowchartBlockType): "TD" | "LR" {
  const refCount = block.nodes.filter((n) => n.type === "reference").length;
  return refCount / block.nodes.length > 0.4 ? "LR" : "TD";
}

/* ─── Mermaid definition builder ──────────────────────────────────── */

/** Escape text for safe inclusion in mermaid definitions */
function esc(text: string): string {
  return text
    .replace(/"/g, "#quot;")
    .replace(/</g, "#lt;")
    .replace(/>/g, "#gt;")
    .replace(/&/g, "#amp;");
}

/** Map node type + text to mermaid node syntax */
function mermaidNode(id: string, type: string, text: string): string {
  const t = esc(text);
  switch (type) {
    case "start":
      return `${id}(["${t}"])`;
    case "decision":
      return `${id}{"${t}"}`;
    case "terminal":
      return `${id}(["${t}"])`;
    case "reference":
      return `${id}[["${t}"]]`;
    case "action":
    default:
      return `${id}["${t}"]`;
  }
}

/** Convert block data into a mermaid flowchart definition string */
function buildMermaidDef(
  block: FlowchartBlockType,
  palette: PaletteMap,
): string {
  const dir = pickDirection(block);
  const lines: string[] = [`flowchart ${dir}`];

  // Define nodes
  for (const node of block.nodes) {
    lines.push(`    ${mermaidNode(node.id, node.type, node.text)}`);
  }

  // Define edges
  for (const edge of block.edges) {
    const label = edge.label?.trim();
    if (label) {
      lines.push(`    ${edge.from} -->|"${esc(label)}"| ${edge.to}`);
    } else {
      lines.push(`    ${edge.from} --> ${edge.to}`);
    }
  }

  // Style classes by node type
  const groups: Record<string, string[]> = {
    start: [],
    decision: [],
    terminal: [],
    reference: [],
    action: [],
  };
  for (const node of block.nodes) {
    const key = node.type in groups ? node.type : "action";
    groups[key].push(node.id);
  }

  for (const [type, ids] of Object.entries(groups)) {
    if (!ids.length) continue;
    const p = palette[type as keyof PaletteMap];
    const extra = p.extra ? `,${p.extra}` : "";
    const className = `${type}Node`;
    lines.push(
      `    classDef ${className} fill:${p.fill},stroke:${p.stroke},color:${p.color},stroke-width:1.5px${extra}`
    );
    lines.push(`    class ${ids.join(",")} ${className}`);
  }

  return lines.join("\n");
}

/* ─── SVG post-processing ─────────────────────────────────────────── */

/**
 * Parse reference-node text for page codes (e.g. "AT-14", "EF & EC-82")
 * and wrap those SVG groups with <a> links to the correct route.
 */
function linkifyReferenceNodes(svgHtml: string): string {
  // Match page code patterns like "AT-14", "EF &amp; EC-82", "GI-9"
  const pageCodeRe =
    /([A-Z]{1,2}(?:\s*(?:&amp;|&)\s*[A-Z]{1,2})?)-(\d{1,4})/g;

  // We'll process the SVG and add click handlers via wrapping <a> tags
  // around reference node groups
  return svgHtml.replace(
    /(<g[^>]*class="[^"]*refNode[^"]*"[^>]*>)([\s\S]*?)(<\/g>)/g,
    (_match, openTag: string, innerContent: string, closeTag: string) => {
      // Extract the text content to find page codes
      const textContent = innerContent.replace(/<[^>]+>/g, "");
      const codes: { full: string; section: string; num: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = pageCodeRe.exec(textContent)) !== null) {
        codes.push({
          full: m[0],
          section: m[1].replace(/&amp;/g, "&"),
          num: m[2],
        });
      }
      pageCodeRe.lastIndex = 0;

      if (codes.length === 0) return _match;

      // Use the first found page code for the link
      const code = codes[0];
      const sectionSlug = sectionCodeToSlug(code.section);
      const pageCode = `${code.section}-${code.num}`;
      const pageSlug = pageCodeToSlug(pageCode);
      const href = `/${sectionSlug}/${pageSlug}`;

      return `<a href="${href}" class="flowchart-ref-link" data-page="${pageSlug}">${openTag}${innerContent}${closeTag}</a>`;
    }
  );
}

/* ─── Zoom controls ───────────────────────────────────────────────── */

function ChartZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-background/80 px-1.5 py-1 shadow-sm backdrop-blur-sm">
      <button
        onClick={() => zoomOut(0.5)}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <div className="mx-0.5 h-3.5 w-px bg-border" />
      <button
        onClick={() => resetTransform()}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Reset zoom"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
      <div className="mx-0.5 h-3.5 w-px bg-border" />
      <button
        onClick={() => zoomIn(0.5)}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Node-type legend ────────────────────────────────────────────── */

const NODE_TYPE_LABELS: Record<string, { label: string; shape: string }> = {
  start: { label: "Start / End", shape: "rounded" },
  decision: { label: "Decision", shape: "diamond" },
  terminal: { label: "Terminal", shape: "rounded" },
  reference: { label: "Reference", shape: "dashed" },
  action: { label: "Action", shape: "rect" },
};

function NodeLegend({ types, palette }: { types: string[]; palette: PaletteMap }) {
  if (types.length < 3) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/70">Legend:</span>
      {types.map((type) => {
        const p = palette[type as keyof PaletteMap];
        const meta = NODE_TYPE_LABELS[type];
        if (!p || !meta) return null;
        return (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-5 rounded-sm border"
              style={{
                backgroundColor: p.fill,
                borderColor: p.stroke,
                borderStyle: type === "reference" ? "dashed" : "solid",
              }}
            />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Fullscreen dialog ───────────────────────────────────────────── */

function FullscreenZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1.5 backdrop-blur-sm">
      <button
        onClick={() => zoomOut(0.5)}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" />
      <button
        onClick={() => resetTransform()}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Reset zoom"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" />
      <button
        onClick={() => zoomIn(0.5)}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
}

function FlowchartFullscreen({
  svg,
  title,
  open,
  onOpenChange,
}: {
  svg: string;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === wrapperRef.current) onOpenChange(false);
    },
    [onOpenChange],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/90 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <DialogPrimitive.Title className="sr-only">
            {title || "Flowchart"}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close className="absolute top-3 right-3 z-20 rounded-full border border-white/10 bg-black/60 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <TransformWrapper
              initialScale={1}
              minScale={0.3}
              maxScale={6}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 1.5 }}
              wheel={{ step: 0.08 }}
              panning={{ velocityDisabled: false }}
              limitToBounds={false}
            >
              <FullscreenZoomControls />
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                wrapperClass="!w-full !h-full"
              >
                <div
                  ref={wrapperRef}
                  onClick={handleBackdropClick}
                  className="flowchart-svg-container flex h-full w-full items-center justify-center p-4 sm:p-8 [&_svg]:max-h-[calc(100dvh-6rem)] [&_svg]:max-w-full [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          {title && (
            <div className="shrink-0 border-t border-white/10 bg-black/60 px-4 py-2.5 text-center text-sm text-white/70 backdrop-blur-sm">
              {title}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ─── Main exports ────────────────────────────────────────────────── */

export function FlowchartBlock({
  block,
  blockIndex = 0,
}: {
  block: FlowchartBlockType;
  blockIndex?: number;
}) {
  if (isDiagnosticTable(block)) {
    return <DiagnosticTable block={block} />;
  }

  return <MermaidFlowchart block={block} blockIndex={blockIndex} />;
}

function MermaidFlowchart({
  block,
  blockIndex = 0,
}: {
  block: FlowchartBlockType;
  blockIndex?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const uniqueId = useId().replace(/:/g, "_");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: getThemeVars(isDark),
          themeCSS: getThemeCSS(isDark),
          flowchart: {
            htmlLabels: true,
            curve: "linear",
            padding: 16,
            nodeSpacing: 50,
            rankSpacing: 70,
            diagramPadding: 16,
            wrappingWidth: 280,
            useMaxWidth: true,
          },
          securityLevel: "loose",
        });

        const def = buildMermaidDef(block, palette);
        const chartId = `fc_${blockIndex}_${uniqueId}`;
        const { svg: rendered } = await mermaid.render(chartId, def);
        if (!cancelled) {
          // Post-process: linkify reference nodes
          const processed = linkifyReferenceNodes(rendered);
          setSvg(processed);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to render diagram",
          );
          console.error("[MermaidFlowchart]", e);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [block, blockIndex, uniqueId, isDark, palette]);

  // Determine which node types are present for the legend
  const nodeTypes = [
    ...new Set(block.nodes.map((n) => n.type)),
  ].filter((t) => t in NODE_TYPE_LABELS);

  return (
    <div className="my-6">
      {block.title && (
        <h4 className="text-base font-semibold mb-3">{block.title}</h4>
      )}

      {/* Chart container */}
      <div className="group relative rounded-xl border border-border bg-muted/20 dark:bg-muted/5 overflow-hidden">
        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-2.5 right-2.5 z-10 rounded-lg border border-border bg-background/80 p-1.5 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {/* Chart body with zoom/pan */}
        <div className="relative min-h-[12rem] p-4 sm:p-6">
          {error ? (
            <div className="text-sm text-destructive p-4">
              Diagram render error: {error}
            </div>
          ) : svg ? (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 1.3 }}
              wheel={{ step: 0.06 }}
              panning={{ velocityDisabled: true }}
              limitToBounds={false}
            >
              <ChartZoomControls />
              <TransformComponent
                wrapperStyle={{ width: "100%" }}
                contentStyle={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  ref={containerRef}
                  className="flowchart-svg-container flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </TransformWrapper>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Rendering diagram…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node-type legend */}
      <NodeLegend types={nodeTypes} palette={palette} />

      {/* Data-driven legend from block */}
      {block.legend && (
        <div className="mt-2 text-xs text-muted-foreground">
          {Array.isArray(block.legend)
            ? block.legend.map((item, i) => (
                <div key={i}>
                  <span className="font-semibold">{item.symbol}:</span>{" "}
                  {item.meaning}
                </div>
              ))
            : typeof block.legend === "string"
              ? <div>{block.legend}</div>
              : Object.entries(block.legend).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold">{k}:</span> {v}
                  </div>
                ))}
        </div>
      )}

      {/* Fullscreen dialog */}
      {svg && (
        <FlowchartFullscreen
          svg={svg}
          title={block.title}
          open={fullscreen}
          onOpenChange={setFullscreen}
        />
      )}
    </div>
  );
}
