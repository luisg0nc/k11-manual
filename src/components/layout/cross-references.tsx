import Link from "next/link";
import { resolveReference, getPageByCode } from "@/lib/data/loader";
import type { PageType } from "@/lib/data/types";

interface CrossReferencesProps {
  refs: string[];
  /** Page codes to exclude (e.g. continuation targets to avoid redundancy) */
  exclude?: string[];
  /** Hide cross references on TOC pages (they duplicate the table) */
  pageType?: PageType;
}

export function CrossReferences({
  refs,
  exclude = [],
  pageType,
}: CrossReferencesProps) {
  if (!refs || refs.length === 0) return null;
  if (pageType === "index_toc") return null;

  const excludeSet = new Set(exclude.filter(Boolean));

  const linked: { ref: string; href: string; title: string | null }[] = [];
  const textRefs: string[] = [];

  for (const ref of refs) {
    if (excludeSet.has(ref)) continue;

    const resolution = resolveReference(ref);
    if (resolution && resolution.href !== "#") {
      const page = getPageByCode(ref);
      linked.push({
        ref,
        href: resolution.href,
        title: page?.title ?? null,
      });
    } else {
      textRefs.push(ref);
    }
  }

  if (linked.length === 0 && textRefs.length === 0) return null;

  return (
    <div className="mt-8">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        See also
      </h4>

      {linked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linked.map((r, i) => (
            <Link
              key={i}
              href={r.href}
              className="group rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent hover:border-border/80"
            >
              <span className="block font-mono text-xs text-primary group-hover:underline">
                {r.ref}
              </span>
              {r.title && (
                <span className="block text-[11px] leading-tight text-muted-foreground group-hover:text-foreground truncate max-w-44">
                  {r.title}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {textRefs.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          {textRefs.join(" · ")}
        </p>
      )}
    </div>
  );
}
