"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { Cable } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  WiringSchematicBlock as WiringSchematicBlockType,
  Wire,
} from "@/lib/data/types";

// ── Wire color map (Nissan standard abbreviations) ─────────────────
const WIRE_COLORS: Record<string, string> = {
  R: "#ef4444",
  B: "#1e1e1e",
  W: "#e5e5e5",
  G: "#22c55e",
  L: "#3b82f6",
  Y: "#eab308",
  BR: "#92400e",
  LG: "#86efac",
  P: "#ec4899",
  O: "#f97316",
  V: "#8b5cf6",
  GR: "#6b7280",
  SB: "#60a5fa",
};

function getWireColor(colorCode?: string): string {
  if (!colorCode) return "#6b7280";
  const upper = colorCode.toUpperCase();
  // Handle compound codes like "R/W" (Red with White stripe)
  const base = upper.split("/")[0];
  return WIRE_COLORS[base] ?? "#6b7280";
}

// ── Custom node: Component box with pin ports ──────────────────────
function ComponentNodeRenderer({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const type = data.componentType as string;
  const pins = (data.pins as string[]) ?? [];

  const typeColor =
    type === "switch"
      ? "border-yellow-500 bg-yellow-500/5"
      : type === "sensor"
        ? "border-cyan-500 bg-cyan-500/5"
        : type === "actuator"
          ? "border-orange-500 bg-orange-500/5"
          : "border-blue-500 bg-blue-500/5";

  return (
    <div
      className={`rounded-lg border-2 ${typeColor} min-w-[180px] max-w-[280px] shadow-sm`}
    >
      {/* Top handles for incoming wires */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555", width: 8, height: 8 }}
      />

      {/* Component header */}
      <div className="px-3 py-2 border-b border-border/40">
        <div className="text-[11px] font-semibold text-foreground leading-tight">
          {name}
        </div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
          {type}
        </div>
      </div>

      {/* Pins */}
      {pins.length > 0 && (
        <div className="px-3 py-1.5 flex flex-wrap gap-1">
          {pins.map((pin) => (
            <span
              key={pin}
              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
            >
              {pin}
            </span>
          ))}
        </div>
      )}

      {/* Bottom handles for outgoing wires */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555", width: 8, height: 8 }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  component: ComponentNodeRenderer,
};

function endpointStr(ep: Wire["from"]): string {
  if (typeof ep === "string") return ep;
  return `${ep.component}${ep.pin ? `:${ep.pin}` : ""}`;
}

function endpointComponent(ep: Wire["from"]): string {
  if (typeof ep === "string") return ep;
  return ep.component;
}

const elk = new ELK();

export function WiringSchematicBlock({
  block,
}: {
  block: WiringSchematicBlockType;
}) {
  const [layoutReady, setLayoutReady] = useState(false);

  const { rawNodes, rawEdges } = useMemo(() => {
    if (!block.components?.length && !block.wires?.length) {
      return { rawNodes: [] as Node[], rawEdges: [] as Edge[] };
    }

    // Build component nodes — collect pins per component from wires
    const pinMap = new Map<string, Set<string>>();

    for (const wire of block.wires ?? []) {
      if (!wire.from || !wire.to) continue;
      for (const ep of [wire.from, wire.to]) {
        const comp = endpointComponent(ep);
        if (!pinMap.has(comp)) pinMap.set(comp, new Set());
        if (typeof ep !== "string" && ep.pin) {
          pinMap.get(comp)!.add(ep.pin);
        }
      }
    }

    // Use declared components, plus implicit ones from wires
    const compIds = new Set<string>();
    const rfNodes: Node[] = [];

    for (const comp of block.components ?? []) {
      compIds.add(comp.id);
      rfNodes.push({
        id: comp.id,
        type: "component",
        data: {
          label: comp.name,
          componentType: comp.type,
          pins: Array.from(pinMap.get(comp.id) ?? []),
        },
        position: { x: 0, y: 0 },
      });
    }

    // Add implied components from wires that aren't in the components list
    for (const [compId, pins] of pinMap) {
      if (!compIds.has(compId)) {
        compIds.add(compId);
        rfNodes.push({
          id: compId,
          type: "component",
          data: {
            label: compId.replace(/_/g, " "),
            componentType: "generic",
            pins: Array.from(pins),
          },
          position: { x: 0, y: 0 },
        });
      }
    }

    // Build edges from wires (skip malformed entries)
    const validWires = (block.wires ?? []).filter((w) => w.from && w.to);
    const rfEdges: Edge[] = validWires.map((wire, i) => {
      const fromComp = endpointComponent(wire.from);
      const toComp = endpointComponent(wire.to);
      const wireColor = getWireColor(wire.color);

      // Build label with pin info and wire color
      const parts: string[] = [];
      if (typeof wire.from !== "string" && wire.from.pin)
        parts.push(`${wire.from.pin}`);
      if (wire.color) parts.push(`[${wire.color}]`);
      if (typeof wire.to !== "string" && wire.to.pin)
        parts.push(`→ ${wire.to.pin}`);
      if (wire.signal) parts.push(`(${wire.signal})`);

      return {
        id: wire.id ?? `w-${i}`,
        source: fromComp,
        target: toComp,
        label: parts.join(" ") || undefined,
        type: "smoothstep",
        style: { stroke: wireColor, strokeWidth: 2.5 },
        labelStyle: {
          fill: wireColor,
          fontWeight: 600,
          fontSize: 10,
        },
        labelBgStyle: {
          fill: "var(--background, #1a1a1a)",
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: wireColor,
        },
      } satisfies Edge;
    });

    return { rawNodes: rfNodes, rawEdges: rfEdges };
  }, [block]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rawNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  // Run ELK layout
  useEffect(() => {
    if (rawNodes.length === 0) {
      setLayoutReady(true);
      return;
    }

    let cancelled = false;
    setLayoutReady(false);

    const elkGraph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.layered.spacing.nodeNodeBetweenLayers": "100",
        "elk.spacing.nodeNode": "60",
        "elk.edgeRouting": "ORTHOGONAL",
      },
      children: rawNodes.map((n) => ({
        id: n.id,
        width: 220,
        height: 80 + ((n.data.pins as string[])?.length > 0 ? 28 : 0),
      })),
      edges: rawEdges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    elk.layout(elkGraph).then((layout) => {
      if (cancelled) return;

      const positioned = rawNodes.map((node) => {
        const elkNode = layout.children?.find((n) => n.id === node.id);
        return {
          ...node,
          position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        } satisfies Node;
      });

      setNodes(positioned as typeof rawNodes);
      setEdges(rawEdges as typeof rawEdges);
      setLayoutReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 80);
  }, []);

  const hasGraph = rawNodes.length > 0;
  const containerHeight = hasGraph
    ? Math.min(250 + rawNodes.length * 50, 500)
    : 0;

  return (
    <div className="my-4 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Cable className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {block.title ?? "Wiring Schematic"}
        </span>
        {block.ref_figure && (
          <Badge variant="outline" className="text-xs">
            Fig. {block.ref_figure}
          </Badge>
        )}
      </div>

      {block.description && (
        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
          {block.description}
        </p>
      )}

      {/* Graphical wiring diagram */}
      {hasGraph && (
        <div
          className="rounded-lg border border-border bg-background overflow-hidden mb-3"
          style={{ height: `${containerHeight}px` }}
        >
          {!layoutReady ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Computing layout…
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              className="[&_.react-flow__node]:!bg-transparent"
            >
              <Background gap={16} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
      )}

      {/* Wire legend table */}
      {block.wires && block.wires.length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Wire Details
          </h5>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1 pr-3 text-muted-foreground font-medium">From</th>
                  <th className="py-1 pr-3 text-muted-foreground font-medium">To</th>
                  <th className="py-1 pr-3 text-muted-foreground font-medium">Color</th>
                  {block.wires.some((w) => w.signal) && (
                    <th className="py-1 text-muted-foreground font-medium">Signal</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {block.wires.filter((w) => w.from && w.to).map((wire, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 pr-3 font-mono">{endpointStr(wire.from)}</td>
                    <td className="py-1 pr-3 font-mono">{endpointStr(wire.to)}</td>
                    <td className="py-1 pr-3">
                      {wire.color && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-border"
                            style={{ backgroundColor: getWireColor(wire.color) }}
                          />
                          {wire.color_full ?? wire.color}
                        </span>
                      )}
                    </td>
                    {block.wires!.some((w) => w.signal) && (
                      <td className="py-1 text-muted-foreground">
                        {wire.signal ?? "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {block.notes && (
        <div className="text-xs text-muted-foreground whitespace-pre-line">
          {typeof block.notes === "string"
            ? block.notes
            : Array.isArray(block.notes)
              ? (block.notes as unknown[]).map((n, i) => (
                  <p key={i}>
                    {typeof n === "string"
                      ? n
                      : typeof n === "object" && n !== null
                        ? (n as { label?: string; detail?: string; text?: string }).text ??
                          `${(n as { label?: string }).label ?? ""}: ${(n as { detail?: string }).detail ?? ""}`
                        : String(n)}
                  </p>
                ))
              : String(block.notes)}
        </div>
      )}
    </div>
  );
}
