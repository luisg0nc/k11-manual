import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, ShieldAlert, CircleAlert } from "lucide-react";
import type { ProseBlock as ProseBlockType } from "@/lib/data/types";

export function ProseBlock({ block }: { block: ProseBlockType }) {
  const text = block.text;

  if (block.style === "normal") {
    return (
      <div className="my-3 text-sm leading-relaxed whitespace-pre-line">
        {text}
      </div>
    );
  }

  const config = {
    note: {
      icon: Info,
      variant: "default" as const,
      label: "NOTE",
      className: "border-blue-500/30 bg-blue-500/5",
    },
    caution: {
      icon: CircleAlert,
      variant: "default" as const,
      label: "CAUTION",
      className: "border-yellow-500/30 bg-yellow-500/5",
    },
    warning: {
      icon: AlertTriangle,
      variant: "destructive" as const,
      label: "WARNING",
      className: "border-red-500/30 bg-red-500/5",
    },
    important: {
      icon: ShieldAlert,
      variant: "default" as const,
      label: "IMPORTANT",
      className: "border-orange-500/30 bg-orange-500/5",
    },
  };

  const c = config[block.style] ?? config.note;
  const Icon = c.icon;

  return (
    <Alert className={`my-4 ${c.className}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-xs font-bold uppercase tracking-widest">
        {c.label}
      </AlertTitle>
      <AlertDescription className="mt-1 text-sm whitespace-pre-line">
        {text}
      </AlertDescription>
    </Alert>
  );
}
