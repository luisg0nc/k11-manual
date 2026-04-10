import Link from "next/link";
import Image from "next/image";
import { getSections, getAllSections } from "@/lib/data/loader";
import { getTorqueSpecs } from "@/lib/data/torque";
import { getPartsDiagrams } from "@/lib/data/parts";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";
import { HeroSearch } from "@/components/search/hero-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  BookOpen,
  Wrench,
  Cog,
  Droplets,
  Fuel,
  Disc,
  ArrowRightLeft,
  CircleDot,
  Truck,
  Gauge,
  Car,
  Thermometer,
  Zap,
  Settings,
  CircleOff,
  ShieldCheck,
} from "lucide-react";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  gi: <BookOpen className="h-5 w-5" />,
  ma: <Wrench className="h-5 w-5" />,
  em: <Cog className="h-5 w-5" />,
  lc: <Droplets className="h-5 w-5" />,
  "ef-ec": <Fuel className="h-5 w-5" />,
  fe: <Fuel className="h-5 w-5" />,
  cl: <Disc className="h-5 w-5" />,
  mt: <ArrowRightLeft className="h-5 w-5" />,
  at: <Settings className="h-5 w-5" />,
  pd: <CircleDot className="h-5 w-5" />,
  fa: <Truck className="h-5 w-5" />,
  ra: <Truck className="h-5 w-5" />,
  br: <CircleOff className="h-5 w-5" />,
  st: <Gauge className="h-5 w-5" />,
  bf: <Car className="h-5 w-5" />,
  ha: <Thermometer className="h-5 w-5" />,
  el: <Zap className="h-5 w-5" />,
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  flowchart: "bg-yellow-500/20 text-yellow-400",
  spec_table: "bg-blue-500/20 text-blue-400",
  prose_procedure: "bg-green-500/20 text-green-400",
  parts_diagram: "bg-purple-500/20 text-purple-400",
  wiring_diagram: "bg-orange-500/20 text-orange-400",
  index_toc: "bg-gray-500/20 text-gray-400",
};

export default function HomePage() {
  const populatedSections = getSections();
  const allSections = getAllSections();

  const totalPages = populatedSections.reduce((sum, s) => sum + s.pageCount, 0);
  const flowchartCount = populatedSections.reduce(
    (sum, s) => sum + s.pages.filter((p) => p.page_type === "flowchart").length,
    0,
  );
  const torqueData = getTorqueSpecs();
  const partsData = getPartsDiagrams();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top bar — Sucatisse home + theme toggle */}
      <div className="flex items-center justify-between mb-2">
        <a
          href="https://sucatisse.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
        >
          <Image
            src="/sucatisse-logo.png"
            alt="Sucatisse"
            width={100}
            height={24}
            className="h-5 sm:h-6 w-auto dark:invert"
          />
        </a>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="mb-12 text-center">
        {/* Micra K11 Silhouette */}
        <div className="mx-auto mb-4 w-72 sm:w-96 md:w-[28rem] lg:w-[32rem]">
          <Image
            src="/k11-sil-removebg-preview.png"
            alt="Nissan Micra K11 silhouette"
            width={543}
            height={165}
            className="w-full h-auto invert dark:invert-0 opacity-85 dark:opacity-90"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          NISSAN MICRA{" "}
          <span className="text-primary">K11</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Service Manual — Interactive Reference
        </p>


        {/* Prominent Search */}
        <div className="mt-4 px-4">
          <HeroSearch />
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            {totalPages} pages extracted
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {flowchartCount} diagnostic flowcharts
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {allSections.length} sections
          </Badge>
        </div>

        <p className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-600 dark:text-yellow-400">
          <Construction className="h-5.5 w-5.5" />
          Work in progress — some information may be inaccurate or incomplete.
        </p>
      </div>


      {/* Section heading */}
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Quick Links
      </h2>

      {/* Quick links */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/torque"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent hover:border-accent-foreground/20"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold group-hover:text-primary transition-colors">Torque Specifications</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">All fastener torque values in one place</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[11px]">
              {torqueData.componentTorques.length} specs
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {torqueData.bySection.length} sections
            </Badge>
            {torqueData.standardBolts.length > 0 && (
              <Badge variant="secondary" className="text-[11px]">
                {torqueData.standardBolts.length} standard bolts
              </Badge>
            )}
          </div>
        </Link>
        <Link
          href="/parts"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent hover:border-accent-foreground/20"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <Cog className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold group-hover:text-primary transition-colors">Parts Diagrams</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Exploded views and component parts lists</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[11px]">
              {partsData.entries.length} diagrams
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {partsData.bySection.length} sections
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {partsData.totalParts} parts
            </Badge>
          </div>
        </Link>
      </div>

      {/* Section heading */}
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Browse by Section
      </h2>

      {/* Section Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allSections.map((section) => {
          const icon = SECTION_ICONS[section.slug] ?? <ShieldCheck className="h-5 w-5" />;
          const isEmpty = section.pageCount === 0;
          const typeBreakdown = section.pages.reduce(
            (acc, p) => {
              acc[p.page_type] = (acc[p.page_type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          return (
            <Link
              key={section.slug}
              href={`/${section.slug}`}
              className={`group rounded-xl border p-5 transition-colors ${
                isEmpty
                  ? "border-dashed border-border/60 bg-card/50 opacity-60 hover:opacity-80 hover:bg-accent/50"
                  : "border-border bg-card hover:bg-accent hover:border-accent-foreground/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex-shrink-0 transition-colors ${
                  isEmpty
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground group-hover:text-primary"
                }`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm">{section.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {section.code} — {isEmpty ? "coming soon" : `${section.pageCount} pages`}
                  </p>
                </div>
                {isEmpty && (
                  <Construction className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
              {isEmpty ? (
                <span className="text-[11px] text-muted-foreground/60 italic">
                  Work in progress
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(typeBreakdown).map(([type, count]) => (
                    <span
                      key={type}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        PAGE_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {type.replace(/_/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Based on the Nissan Micra (K11) Factory Service Manual.
          <br />
          Content is being actively extracted — more sections coming soon.
        </p>
      </div>
    </div>
  );
}