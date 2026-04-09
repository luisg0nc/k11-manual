"use client";

import type { FlowchartBlock } from "@/lib/data/types";

/**
 * Renders Type-A flowcharts (diagnostic cause → fix tables) as a clean
 * two-column layout instead of a React Flow canvas.
 *
 * Detection: no `decision` nodes AND all edge labels are null/undefined.
 *
 * The graph is decomposed into groups: each "fix" node that is an edge target
 * collects all "cause" nodes pointing to it. The result is a table of
 * "Probable Cause → Corrective Action" rows, with a visual bracket when
 * multiple causes share one fix.
 */

interface CauseFixGroup {
  causes: string[];
  fix: string;
}

function extractCauseFixGroups(block: FlowchartBlock): CauseFixGroup[] {
  const nodeMap = new Map(block.nodes.map((n) => [n.id, n]));

  // Group edges by target (fix node)
  const targetToCauses = new Map<string, string[]>();
  for (const edge of block.edges) {
    const existing = targetToCauses.get(edge.to) ?? [];
    existing.push(edge.from);
    targetToCauses.set(edge.to, existing);
  }

  // Build cause→fix groups in order of first appearance
  const groups: CauseFixGroup[] = [];
  const seen = new Set<string>();

  for (const edge of block.edges) {
    if (seen.has(edge.to)) continue;
    seen.add(edge.to);

    const causeIds = targetToCauses.get(edge.to) ?? [];
    const fixNode = nodeMap.get(edge.to);
    if (!fixNode) continue;

    groups.push({
      causes: causeIds.map((id) => nodeMap.get(id)?.text ?? id),
      fix: fixNode.text,
    });
  }

  return groups;
}

export function DiagnosticTable({ block }: { block: FlowchartBlock }) {
  const groups = extractCauseFixGroups(block);

  // If we couldn't extract any groups, show a simple fallback list
  if (groups.length === 0) {
    return (
      <div className="my-4">
        {block.title && (
          <h4 className="text-base font-semibold mb-2">{block.title}</h4>
        )}
        <div className="space-y-2">
          {block.nodes
            .filter((n) => n.type !== "terminal")
            .map((n) => (
              <div key={n.id} className="rounded-md border border-border px-4 py-2 text-sm">
                {n.text}
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {block.title && (
        <h4 className="text-base font-semibold mb-3">{block.title}</h4>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        {/* ── Desktop: two-column grid ── */}
        <div className="hidden sm:block">
          {/* Header row */}
          <div className="grid grid-cols-2 bg-muted/50 dark:bg-muted/20 border-b border-border">
            <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Probable Cause
            </div>
            <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-l border-border">
              Corrective Action
            </div>
          </div>

          {/* Groups */}
          {groups.map((group, gi) => (
            <div
              key={gi}
              className={`grid grid-cols-2 ${gi < groups.length - 1 ? "border-b border-border" : ""}`}
            >
              {/* Causes column */}
              <div className="flex flex-col">
                {group.causes.map((cause, ci) => (
                  <div
                    key={ci}
                    className={`px-4 py-3 text-sm leading-relaxed ${
                      ci < group.causes.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    {cause}
                  </div>
                ))}
              </div>

              {/* Fix column — vertically centered, spans all cause rows */}
              <div className="flex items-center border-l border-border relative">
                {/* Bracket indicator for many-to-one */}
                {group.causes.length > 1 && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-blue-500/40 dark:bg-blue-400/30 rounded-full" />
                )}
                <div className={`px-4 py-3 text-sm leading-relaxed ${group.causes.length > 1 ? "pl-5" : ""}`}>
                  {group.fix}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile: stacked cards ── */}
        <div className="sm:hidden divide-y divide-border">
          {groups.map((group, gi) => (
            <div key={gi} className="p-3 space-y-2">
              {group.causes.map((cause, ci) => (
                <div key={ci} className="text-sm leading-relaxed">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cause</span>
                  <p className="mt-0.5">{cause}</p>
                </div>
              ))}
              <div className="rounded-md bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/20 dark:border-blue-400/15 px-3 py-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Fix</span>
                <p className="mt-0.5">{group.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {block.legend && (
        <div className="mt-2 text-xs text-muted-foreground">
          {Array.isArray(block.legend)
            ? block.legend.map((item, i) => (
                <div key={i}>
                  <span className="font-semibold">{item.symbol}:</span> {item.meaning}
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
    </div>
  );
}
