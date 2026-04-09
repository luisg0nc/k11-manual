"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { TorqueSpec, StandardBoltSpec } from "@/lib/data/torque";

type Unit = "nm" | "kgm" | "ftlb";

const UNIT_LABELS: Record<Unit, string> = {
  nm: "N·m",
  kgm: "kg-m",
  ftlb: "ft-lb",
};

const STORAGE_KEY = "torque-unit";

function usePersistedUnit(): [Unit, (u: Unit) => void] {
  const [unit, setUnit] = useState<Unit>("nm");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Unit | null;
    if (stored && stored in UNIT_LABELS) setUnit(stored);
  }, []);

  function set(u: Unit) {
    setUnit(u);
    localStorage.setItem(STORAGE_KEY, u);
  }

  return [unit, set];
}

// ── Unit toggle ────────────────────────────────────────────────────

function UnitToggle({
  unit,
  onChange,
}: {
  unit: Unit;
  onChange: (u: Unit) => void;
}) {
  return (
    <Tabs
      value={unit}
      onValueChange={(v) => onChange(v as Unit)}
    >
      <TabsList variant="line" className="gap-0">
        {(Object.entries(UNIT_LABELS) as [Unit, string][]).map(([key, label]) => (
          <TabsTrigger key={key} value={key} className="px-3 py-1.5 text-xs font-mono">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// ── Component torques section ──────────────────────────────────────

function SectionGroup({
  sectionName,
  sectionCode,
  items,
  unit,
}: {
  sectionName: string;
  sectionCode: string;
  items: TorqueSpec[];
  unit: Unit;
}) {
  return (
    <div>
      <div className="sticky top-14 z-10 flex items-center gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-1 py-2">
        <h2 className="text-sm font-semibold">{sectionName}</h2>
        <Badge variant="secondary" className="text-[10px]">
          {sectionCode}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "spec" : "specs"}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[55%]">Component</TableHead>
              <TableHead className="w-[20%] text-right font-mono">
                {UNIT_LABELS[unit]}
              </TableHead>
              <TableHead className="w-[25%]">Condition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((spec, i) => (
              <TableRow key={`${spec.pageCode}-${i}`}>
                <TableCell>
                  <Link
                    href={`/${spec.sectionSlug}/${spec.pageSlug}`}
                    className="text-sm hover:text-primary hover:underline underline-offset-2 transition-colors"
                  >
                    {spec.name || "—"}
                  </Link>
                  <span className="ml-2 text-[10px] text-muted-foreground font-mono">
                    {spec.pageCode}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {spec[unit]}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {spec.condition ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2 mt-2">
        {items.map((spec, i) => (
          <div
            key={`${spec.pageCode}-${i}`}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/${spec.sectionSlug}/${spec.pageSlug}`}
                className="text-sm font-medium hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                {spec.name || "—"}
              </Link>
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {spec.pageCode}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-sm tabular-nums font-semibold">
                {spec[unit]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {UNIT_LABELS[unit]}
              </span>
            </div>
            {spec.condition && (
              <p className="mt-1 text-xs text-muted-foreground">{spec.condition}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Standard bolts section ─────────────────────────────────────────

function StandardBoltsTable({
  bolts,
  unit,
}: {
  bolts: StandardBoltSpec[];
  unit: Unit;
}) {
  if (bolts.length === 0) return null;

  // Map unit key to the correct bolt spec fields
  const headKey = unit === "nm" ? "hexHeadNm" : unit === "kgm" ? "hexHeadKgm" : "hexHeadFtlb";
  const flangeKey =
    unit === "nm" ? "hexFlangeNm" : unit === "kgm" ? "hexFlangeKgm" : "hexFlangeFtlb";

  return (
    <div>
      <div className="border-b border-border px-1 py-3 mb-2">
        <h2 className="text-lg font-semibold">Standard Bolts Reference</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          From GI-20 — Tightening torque for standard bolts without lubricant
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Bolt Size</TableHead>
              <TableHead className="text-right font-mono">
                Hex Head ({UNIT_LABELS[unit]})
              </TableHead>
              <TableHead className="text-right font-mono">
                Hex Flange ({UNIT_LABELS[unit]})
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bolts.map((bolt, i) => {
              const isFirstOfGrade = i === 0 || bolts[i - 1].grade !== bolt.grade;
              const gradeSpan = isFirstOfGrade
                ? bolts.filter((b) => b.grade === bolt.grade).length
                : 0;
              return (
                <TableRow key={`${bolt.grade}-${bolt.boltSize}-${i}`}>
                  {isFirstOfGrade ? (
                    <TableCell
                      rowSpan={gradeSpan}
                      className="align-top font-semibold text-sm"
                    >
                      {bolt.grade}
                    </TableCell>
                  ) : null}
                  <TableCell className="font-mono text-sm">{bolt.boltSize}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {bolt[headKey]}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {bolt[flangeKey]}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2 mt-2">
        {bolts.map((bolt, i) => (
          <div
            key={`${bolt.grade}-${bolt.boltSize}-${i}`}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{bolt.grade}</span>
              <span className="font-mono text-sm">{bolt.boltSize}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Hex Head</span>
                <span className="ml-1 font-mono font-semibold tabular-nums">
                  {bolt[headKey]} {UNIT_LABELS[unit]}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Hex Flange</span>
                <span className="ml-1 font-mono font-semibold tabular-nums">
                  {bolt[flangeKey]} {UNIT_LABELS[unit]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function TorqueTable({
  bySection,
  standardBolts,
  totalCount,
}: {
  bySection: {
    code: string;
    name: string;
    slug: string;
    items: TorqueSpec[];
  }[];
  standardBolts: StandardBoltSpec[];
  totalCount: number;
}) {
  const [unit, setUnit] = usePersistedUnit();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return bySection;
    const q = search.toLowerCase();
    return bySection
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.pageCode.toLowerCase().includes(q) ||
            (s.condition?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [bySection, search]);

  const filteredCount = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Filter torque specs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <UnitToggle unit={unit} onChange={setUnit} />
          <span className="text-xs text-muted-foreground tabular-nums">
            {filteredCount === totalCount
              ? `${totalCount} specs`
              : `${filteredCount} of ${totalCount}`}
          </span>
        </div>
      </div>

      {/* Section groups */}
      <div className="space-y-8">
        {filtered.map((group) => (
          <SectionGroup
            key={group.code}
            sectionName={group.name}
            sectionCode={group.code}
            items={group.items}
            unit={unit}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">No matching torque specs</p>
          <p className="mt-1 text-sm">Try a different search term</p>
        </div>
      )}

      {/* Standard bolts */}
      {standardBolts.length > 0 && !search && (
        <div className="mt-12 pt-8 border-t border-border">
          <StandardBoltsTable bolts={standardBolts} unit={unit} />
        </div>
      )}
    </div>
  );
}
