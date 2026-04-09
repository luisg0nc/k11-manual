"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FigureInline } from "./figure-inline";
import type {
  ProcedureBlock as ProcedureBlockType,
  ProcedureStep,
  FigureDetected,
} from "@/lib/data/types";

/** Extract text from a note/warning that may be a string or an object */
function toText(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.label === "string" && typeof obj.detail === "string")
      return `${obj.label}: ${obj.detail}`;
    return JSON.stringify(item);
  }
  return String(item);
}

function StepItem({
  step,
  index,
  figures,
  pageId,
}: {
  step: string | ProcedureStep;
  index: number;
  figures?: FigureDetected[];
  pageId?: string;
}) {
  // Plain string step (legacy format)
  if (typeof step === "string") {
    return (
      <li className="flex gap-4 py-3 text-sm leading-relaxed border-b border-border/40 last:border-0">
        <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold tabular-nums">
          {index + 1}
        </span>
        <span className="pt-1 whitespace-pre-line">{step}</span>
      </li>
    );
  }

  // Object step
  const figure =
    step.figure_ref && figures
      ? figures.find((f) => f.fig_id === step.figure_ref)
      : undefined;

  return (
    <li className="py-3 border-b border-border/40 last:border-0">
      <div className="flex gap-4">
        <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold tabular-nums">
          {step.step}
        </span>
        <div className="flex-1 min-w-0 pt-1">
          <span className="text-sm leading-relaxed whitespace-pre-line">{step.text}</span>

          {step.warnings && step.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {step.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2.5 py-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{toText(w)}</span>
                </div>
              ))}
            </div>
          )}

          {step.notes && step.notes.length > 0 && (
            <div className="mt-2 space-y-1">
              {step.notes.map((n, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-md px-2.5 py-1.5"
                >
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{toText(n)}</span>
                </div>
              ))}
            </div>
          )}

          {step.substeps && step.substeps.length > 0 && (
            <ol className="mt-2 ml-2 space-y-0 list-none border-l-2 border-border/40 pl-3">
              {step.substeps.map((sub, si) => (
                <StepItem
                  key={si}
                  step={sub}
                  index={si}
                  figures={figures}
                  pageId={pageId}
                />
              ))}
            </ol>
          )}

          {figure && pageId && (
            <div className="mt-2 max-w-xs">
              <FigureInline figure={figure} pageId={pageId} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function StepList({
  steps,
  figures,
  pageId,
}: {
  steps: (string | ProcedureStep)[];
  figures?: FigureDetected[];
  pageId?: string;
}) {
  return (
    <ol className="space-y-0 list-none">
      {steps.map((step, i) => (
        <StepItem key={i} step={step} index={i} figures={figures} pageId={pageId} />
      ))}
    </ol>
  );
}

interface ProcedureBlockProps {
  block: ProcedureBlockType;
  figures?: FigureDetected[];
  pageId?: string;
}

export function ProcedureBlock({ block, figures, pageId }: ProcedureBlockProps) {
  // Flat steps
  if (block.steps && block.steps.length > 0) {
    return (
      <div className="my-4 rounded-xl border border-border bg-card overflow-hidden">
        {block.title && (
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 dark:bg-muted/20">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {block.title}
            </h4>
          </div>
        )}
        <div className="px-4">
          <StepList steps={block.steps} figures={figures} pageId={pageId} />
        </div>
      </div>
    );
  }

  // Multiple methods (tabbed)
  if (block.methods && block.methods.length > 0) {
    return (
      <div className="my-4 rounded-xl border border-border bg-card overflow-hidden">
        {block.title && (
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 dark:bg-muted/20">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {block.title}
            </h4>
          </div>
        )}
        <div className="px-4 py-3">
          <Tabs defaultValue={block.methods[0].id} className="w-full">
            <TabsList>
              {block.methods.map((method) => (
                <TabsTrigger key={method.id} value={method.id} className="text-sm">
                  {method.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {block.methods.map((method) => (
              <TabsContent key={method.id} value={method.id}>
                <StepList steps={method.steps} figures={figures} pageId={pageId} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    );
  }

  return null;
}
