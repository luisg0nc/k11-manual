import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DiagnosticCodeBlock as DiagnosticCodeBlockType } from "@/lib/data/types";

export function DiagnosticCodeBlock({ block }: { block: DiagnosticCodeBlockType }) {
  return (
    <Card className="my-4 border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <Badge variant="outline" className="font-mono">
            Code {block.code_number}
          </Badge>
          <CardTitle className="text-base">{block.code_name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.description && (
          <p className="text-sm">{block.description}</p>
        )}

        {block.possible_causes && block.possible_causes.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Possible Causes
            </h5>
            <ul className="list-disc list-inside space-y-0.5">
              {block.possible_causes.map((cause, i) => (
                <li key={i} className="text-sm">{cause}</li>
              ))}
            </ul>
          </div>
        )}

        {block.diagnostic_procedure && (
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Diagnostic Procedure
            </h5>
            <p className="text-sm whitespace-pre-line">{block.diagnostic_procedure}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
