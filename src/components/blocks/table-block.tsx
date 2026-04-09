import Link from "next/link";
import { Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveReference } from "@/lib/data/loader";
import type { TableBlock } from "@/lib/data/types";

/** Matches page codes like "EM-2", "GI-5", "EF & EC-27" */
const PAGE_CODE_RE = /^([A-Z](?:[A-Z ]|& )*)-(\d+)$/i;

function CellValue({ val }: { val: unknown }) {
  if (typeof val === "boolean") {
    return val ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  }
  const str = (val as string) ?? "—";
  if (typeof val === "string" && PAGE_CODE_RE.test(val.trim())) {
    const resolved = resolveReference(val.trim());
    if (resolved && resolved.href !== "#") {
      return (
        <Link href={resolved.href} className="text-primary hover:underline font-mono">
          {resolved.label}
        </Link>
      );
    }
  }
  return <span className="whitespace-pre-line">{str}</span>;
}

export function TableBlockComponent({ block }: { block: TableBlock }) {
  const hasGroup = block.rows.some((r) => r.group);

  return (
    <div className="my-4">
      {block.title && (
        <h4 className="text-base font-semibold mb-2">{block.title}</h4>
      )}

      {/* ── Desktop: standard table ── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 dark:bg-muted/20 hover:bg-muted/40">
              {block.columns.map((col) => (
                <TableHead key={col.key} className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.rows.map((row, ri) => (
              <TableRow key={ri}>
                {block.columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <TableCell key={col.key} className="text-sm">
                      <CellValue val={val} />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile: stacked cards ── */}
      <div className="sm:hidden space-y-2">
        {block.rows.map((row, ri) => {
          const firstCol = block.columns[0];
          const restCols = block.columns.slice(1);
          const firstVal = row[firstCol.key];

          return (
            <div key={ri} className="rounded-lg border border-border bg-card p-3">
              {/* Group label */}
              {hasGroup && row.group && (
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  {row.group as string}
                </div>
              )}
              {/* Primary column as card title */}
              <div className="text-sm font-medium mb-2">
                <CellValue val={firstVal} />
              </div>
              {/* Remaining columns as label: value rows */}
              {restCols.length > 0 && (
                <div className="space-y-1.5 border-t border-border/50 pt-2">
                  {restCols.map((col) => {
                    const val = row[col.key];
                    return (
                      <div key={col.key} className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-xs text-muted-foreground shrink-0">{col.label}</span>
                        <span className="text-right">
                          <CellValue val={val} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {block.legend && (
        <div className="mt-2 text-xs text-muted-foreground">
          {typeof block.legend === "string"
            ? block.legend
            : Array.isArray(block.legend)
              ? block.legend.map((item, i) => (
                  <div key={i}>
                    <span className="font-semibold">{item.symbol}:</span> {item.meaning}
                  </div>
                ))
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
