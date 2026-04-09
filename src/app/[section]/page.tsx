import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSections,
  getAllSections,
  getSectionTOC,
  groupPagesByTOC,
} from "@/lib/data/loader";
import { getSectionBySlug } from "@/lib/data/sections";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";
import {
  GitBranch,
  Table2,
  FileText,
  Cog,
  Cable,
  ListOrdered,
  File,
} from "lucide-react";
import type { PageSummary } from "@/lib/data/types";

const PAGE_TYPE_ICON: Record<string, React.ReactNode> = {
  flowchart: <GitBranch className="h-4 w-4 text-yellow-500" />,
  spec_table: <Table2 className="h-4 w-4 text-blue-500" />,
  prose_procedure: <FileText className="h-4 w-4 text-green-500" />,
  parts_diagram: <Cog className="h-4 w-4 text-purple-500" />,
  wiring_diagram: <Cable className="h-4 w-4 text-orange-500" />,
  index_toc: <ListOrdered className="h-4 w-4 text-gray-500" />,
  component_photo: <File className="h-4 w-4 text-teal-500" />,
  cover: <File className="h-4 w-4 text-gray-500" />,
  section_divider: <File className="h-4 w-4 text-gray-500" />,
};

export const dynamicParams = false;

export function generateStaticParams() {
  const sections = getAllSections();
  return sections.map((s) => ({ section: s.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  return params.then((p) => {
    const section = getSectionBySlug(p.section);
    return {
      title: section
        ? `${section.name} — K11 Service Manual`
        : "Section Not Found",
    };
  });
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: sectionSlug } = await params;
  const sectionDef = getSectionBySlug(sectionSlug);
  if (!sectionDef) notFound();

  // Check if this section has pages
  const populatedSections = getSections();
  const section = populatedSections.find((s) => s.slug === sectionSlug);

  // WIP page for empty sections
  if (!section || section.pageCount === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Breadcrumbs items={[{ label: sectionDef.name }]} />
        <div className="mt-16 mb-8 text-center">
          <Construction className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <h1 className="text-3xl font-bold tracking-tight">{sectionDef.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Section {sectionDef.code}
          </p>
          <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 p-8 max-w-lg mx-auto">
            <p className="text-lg font-medium text-muted-foreground">
              Work in Progress
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              This section hasn&apos;t been extracted yet. Content is being actively processed and will be available soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tocEntries = getSectionTOC(section.code);
  const { groups, ungrouped } = groupPagesByTOC(section.pages, tocEntries);
  const hasGroups = groups.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: section.name }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{section.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Section {section.code} — {section.pageCount} pages
        </p>
      </div>

      {hasGroups ? (
        <div className="space-y-6">
          {/* Ungrouped pages (e.g. the TOC page itself) */}
          {ungrouped.length > 0 && (
            <div className="space-y-1">
              {ungrouped.map((page, i) => (
                <PageLink
                  key={`ungrouped-${page.slug}-${i}`}
                  page={page}
                  sectionSlug={sectionSlug}
                />
              ))}
            </div>
          )}

          {/* Grouped pages */}
          {groups.map((group) => (
            <div key={group.topic}>
              <h3 className="flex items-baseline gap-2 px-4 mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {group.topic}
                <span className="text-xs font-normal font-mono">
                  {group.startPageCode}
                </span>
              </h3>
              <div className="space-y-1">
                {group.pages.map((page, i) => (
                  <PageLink
                    key={`${group.topic}-${page.slug}-${i}`}
                    page={page}
                    sectionSlug={sectionSlug}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {section.pages.map((page, i) => (
            <PageLink
              key={`${page.slug}-${i}`}
              page={page}
              sectionSlug={sectionSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  sectionSlug,
}: {
  page: PageSummary;
  sectionSlug: string;
}) {
  return (
    <Link
      href={`/${sectionSlug}/${page.slug}`}
      className="flex items-center gap-3 rounded-lg border border-transparent px-4 py-3 transition-colors hover:bg-accent hover:border-border"
    >
      <div className="flex-shrink-0">
        {PAGE_TYPE_ICON[page.page_type] ?? <File className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{page.title}</div>
        <div className="text-xs text-muted-foreground">{page.page_code}</div>
      </div>
      <Badge variant="outline" className="text-[10px] flex-shrink-0">
        {page.page_type.replace(/_/g, " ")}
      </Badge>
    </Link>
  );
}
