import type { Metadata } from "next";
import { getPartsDiagrams } from "@/lib/data/parts";
import { PartsGallery } from "@/components/parts/parts-gallery";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Cog } from "lucide-react";

export const metadata: Metadata = {
  title: "Parts Diagrams — K11 Service Manual",
  description:
    "Exploded views and parts lists for the Nissan Micra (K11) — browse all component diagrams grouped by section.",
};

export default function PartsPage() {
  const { entries, bySection, totalParts } = getPartsDiagrams();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Parts Diagrams" }]} />

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <Cog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Parts Diagrams
            </h1>
            <p className="mt-0.5 text-muted-foreground">
              Exploded views and component parts lists from the service manual
              — {entries.length} diagrams across {bySection.length} sections
              {totalParts > 0 && `, ${totalParts} individual parts`}
            </p>
          </div>
        </div>
      </div>

      <PartsGallery
        bySection={bySection}
        totalCount={entries.length}
      />
    </div>
  );
}
