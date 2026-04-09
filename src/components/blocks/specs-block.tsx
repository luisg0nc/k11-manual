import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SpecsBlock as SpecsBlockType } from "@/lib/data/types";

export function SpecsBlock({ block }: { block: SpecsBlockType }) {
  return (
    <div className="my-4">
      {/* ── Desktop: standard table ── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 dark:bg-muted/20 hover:bg-muted/40">
              <TableHead className="min-w-[200px] text-xs font-semibold uppercase tracking-wider">Specification</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.items.map((item, i) => {
              const isLimit = /limit/i.test(item.label);
              return (
                <TableRow key={i} className={isLimit ? "bg-amber-500/5 dark:bg-amber-400/5" : ""}>
                  <TableCell className="text-sm">
                    <span className="font-medium">{item.label}</span>
                    {item.condition && (
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {item.condition}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={`font-mono text-sm tabular-nums ${
                    isLimit ? "text-amber-700 dark:text-amber-400 font-semibold" : ""
                  }`}>
                    {item.value}
                    {item.unit && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-sans">{item.unit}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile: stacked cards ── */}
      <div className="sm:hidden space-y-2">
        {block.items.map((item, i) => {
          const isLimit = /limit/i.test(item.label);
          return (
            <div
              key={i}
              className={`rounded-lg border border-border p-3 ${
                isLimit ? "bg-amber-500/5 dark:bg-amber-400/5 border-amber-500/20" : "bg-card"
              }`}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {item.label}
                {item.condition && (
                  <span className="block normal-case tracking-normal font-normal mt-0.5">
                    {item.condition}
                  </span>
                )}
              </div>
              <div className={`mt-1.5 font-mono text-base tabular-nums ${
                isLimit ? "text-amber-700 dark:text-amber-400 font-semibold" : "text-foreground"
              }`}>
                {item.value}
                {item.unit && (
                  <span className="ml-1.5 text-xs text-muted-foreground font-sans">{item.unit}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
