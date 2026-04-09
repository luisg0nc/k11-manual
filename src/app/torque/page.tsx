import type { Metadata } from "next";
import { getTorqueSpecs } from "@/lib/data/torque";
import { TorqueTable } from "@/components/torque/torque-table";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Torque Specifications — K11 Service Manual",
  description:
    "Complete torque specifications reference for the Nissan Micra (K11) — all fastener torque values grouped by section.",
};

export default function TorquePage() {
  const { componentTorques, standardBolts, bySection } = getTorqueSpecs();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Torque Specifications" }]} />

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Torque Specifications
            </h1>
            <p className="mt-0.5 text-muted-foreground">
              All fastener torque values from the service manual, grouped by
              section — {componentTorques.length} component specs across{" "}
              {bySection.length} sections
              {standardBolts.length > 0 &&
                `, plus ${standardBolts.length} standard bolt references`}
            </p>
          </div>
        </div>
      </div>

      <TorqueTable
        bySection={bySection}
        standardBolts={standardBolts}
        totalCount={componentTorques.length}
      />
    </div>
  );
}
