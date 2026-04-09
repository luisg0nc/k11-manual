import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Continuation } from "@/lib/data/types";
import { pageCodeToSlug, sectionCodeToSlug } from "@/lib/data/sections";
import { getPageByCode } from "@/lib/data/loader";

function continuationHref(pageCode: string): string | null {
  const page = getPageByCode(pageCode);
  if (!page) return null;
  return `/${sectionCodeToSlug(page.section)}/${pageCodeToSlug(page.page_code)}`;
}

interface ContinuationNavProps {
  continuation: Continuation;
}

export function ContinuationNav({ continuation }: ContinuationNavProps) {
  const { continues_from, continues_to } = continuation;
  if (!continues_from && !continues_to) return null;

  const fromHref = continues_from ? continuationHref(continues_from) : null;
  const toHref = continues_to ? continuationHref(continues_to) : null;

  return (
    <div className="my-4 flex flex-col gap-2">
      {continues_from && fromHref && (
        <Link
          href={fromHref}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continued from {continues_from}
        </Link>
      )}
      {continues_to && toHref && (
        <Link
          href={toHref}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Continue to {continues_to}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
