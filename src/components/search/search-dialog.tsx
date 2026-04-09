"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import MiniSearch, { type SearchResult } from "minisearch";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GitBranch,
  Table2,
  FileText,
  Cog,
  Cable,
  ListOrdered,
  File,
} from "lucide-react";
import type { SearchDocument } from "@/lib/data/types";

// ── MiniSearch field config (must match prebuild.ts) ──────────────
const SEARCH_FIELDS = ["pageCode", "title", "headings", "body", "tools", "crossRefs", "diagnostics"] as const;
const STORE_FIELDS = ["pageCode", "section", "title", "pageType", "body"] as const;

// ── Context for open/close state ──────────────────────────────────
const SearchDialogContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSearchDialog() {
  return useContext(SearchDialogContext);
}

const PAGE_TYPE_ICON: Record<string, React.ReactNode> = {
  flowchart: <GitBranch className="h-4 w-4 text-yellow-500" />,
  spec_table: <Table2 className="h-4 w-4 text-blue-500" />,
  prose_procedure: <FileText className="h-4 w-4 text-green-500" />,
  parts_diagram: <Cog className="h-4 w-4 text-purple-500" />,
  wiring_diagram: <Cable className="h-4 w-4 text-orange-500" />,
  index_toc: <ListOrdered className="h-4 w-4 text-gray-500" />,
};

// ── Snippet extraction ────────────────────────────────────────────

/** Extract a short snippet from `body` around the first matched term, with <mark> highlighting */
function extractSnippet(
  body: string | undefined,
  matchedTerms: string[],
  maxLen = 120,
): { text: string; hasMatch: boolean } {
  if (!body || matchedTerms.length === 0) {
    return { text: body?.slice(0, maxLen) ?? "", hasMatch: false };
  }

  const lower = body.toLowerCase();

  // Find the earliest match position
  let earliest = body.length;
  for (const term of matchedTerms) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx >= 0 && idx < earliest) earliest = idx;
  }

  if (earliest >= body.length) {
    return { text: body.slice(0, maxLen), hasMatch: false };
  }

  // Window around the match
  const start = Math.max(0, earliest - 30);
  const end = Math.min(body.length, start + maxLen);
  let snippet = body.slice(start, end);

  if (start > 0) snippet = "…" + snippet;
  if (end < body.length) snippet = snippet + "…";

  return { text: snippet, hasMatch: true };
}

/** Render snippet text with matched terms highlighted via <mark> */
function HighlightedSnippet({
  text,
  matchedTerms,
}: {
  text: string;
  matchedTerms: string[];
}) {
  if (matchedTerms.length === 0) return <span>{text}</span>;

  // Build a regex matching any of the terms (longest first to avoid partial overlaps)
  const sorted = [...matchedTerms].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 rounded-xs px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

// ── Search result with snippet ────────────────────────────────────
interface SearchResultWithSnippet {
  id: string;
  pageCode: string;
  section: string;
  title: string;
  pageType: string;
  snippet: string;
  matchedTerms: string[];
}

// ── Provider wrapping the app ─────────────────────────────────────
export function SearchDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultWithSnippet[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const miniSearchRef = useRef<MiniSearch | null>(null);
  const docsMapRef = useRef<Map<string, SearchDocument> | null>(null);
  const loadingRef = useRef(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Load search index + docs lazily on first open
  useEffect(() => {
    if (open && !miniSearchRef.current && !loadingRef.current && !error) {
      loadingRef.current = true;
      setLoading(true);

      Promise.all([
        fetch("/search-index.json").then((r) => {
          if (!r.ok) throw new Error(`Index HTTP ${r.status}`);
          return r.json();
        }),
        fetch("/search-docs.json").then((r) => {
          if (!r.ok) throw new Error(`Docs HTTP ${r.status}`);
          return r.json();
        }),
      ])
        .then(([indexData, docsData]: [unknown, SearchDocument[]]) => {
          // Recreate MiniSearch from serialized index
          const ms = MiniSearch.loadJSON(JSON.stringify(indexData), {
            fields: [...SEARCH_FIELDS],
            storeFields: [...STORE_FIELDS],
            idField: "id",
          });
          miniSearchRef.current = ms;

          // Build a map for snippet extraction from the full body text
          const map = new Map<string, SearchDocument>();
          for (const doc of docsData) {
            map.set(doc.id, doc);
          }
          docsMapRef.current = map;

          loadingRef.current = false;
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          loadingRef.current = false;
          setLoading(false);
        });
    }
  }, [open, error]);

  // Search when query changes
  const searchResults = useMemo(() => {
    const ms = miniSearchRef.current;
    if (!ms || !query.trim()) return [];

    const raw: SearchResult[] = ms.search(query, {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        pageCode: 10,
        title: 5,
        headings: 3,
        diagnostics: 2,
        body: 1,
        tools: 1.5,
        crossRefs: 0.5,
      },
      combineWith: "AND",
    });

    // If AND returns nothing, fall back to OR
    const hits = raw.length > 0
      ? raw
      : ms.search(query, {
          prefix: true,
          fuzzy: 0.2,
          boost: {
            pageCode: 10,
            title: 5,
            headings: 3,
            diagnostics: 2,
            body: 1,
            tools: 1.5,
            crossRefs: 0.5,
          },
        });

    return hits.slice(0, 20);
  }, [query]);

  // Build results with snippets
  useEffect(() => {
    if (searchResults.length === 0) {
      setResults([]);
      return;
    }

    const mapped: SearchResultWithSnippet[] = searchResults.map((hit) => {
      const fullDoc = docsMapRef.current?.get(hit.id);
      const matchedTerms = hit.terms ?? [];

      // Try to get a snippet from the body text
      const bodyText = fullDoc?.body ?? (hit as Record<string, unknown>).body as string ?? "";
      const { text: snippet } = extractSnippet(bodyText, matchedTerms);

      return {
        id: hit.id,
        pageCode: (hit as Record<string, unknown>).pageCode as string ?? "",
        section: (hit as Record<string, unknown>).section as string ?? "",
        title: (hit as Record<string, unknown>).title as string ?? "",
        pageType: (hit as Record<string, unknown>).pageType as string ?? "",
        snippet,
        matchedTerms,
      };
    });

    setResults(mapped);
  }, [searchResults]);

  const handleSelect = useCallback(
    (doc: SearchResultWithSnippet) => {
      setOpen(false);
      setQuery("");
      router.push(`/${doc.id}`);
    },
    [router],
  );

  return (
    <SearchDialogContext.Provider value={{ open, setOpen }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search Manual</DialogTitle>
          <DialogDescription>
            Search pages, specs, and procedures
          </DialogDescription>
        </DialogHeader>
        <DialogContent
          className="top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              placeholder="Search pages, specs, procedures…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {error
                  ? "Search unavailable — rebuild the site to generate index."
                  : loading
                    ? "Loading search index…"
                    : "No results found."}
              </CommandEmpty>
              {results.length > 0 && (
                <CommandGroup heading="Results">
                  {results.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      value={doc.id}
                      onSelect={() => handleSelect(doc)}
                      className="flex items-center gap-3"
                    >
                      {PAGE_TYPE_ICON[doc.pageType] ?? (
                        <File className="h-4 w-4" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc.title}
                        </div>
                        {doc.snippet && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            <HighlightedSnippet
                              text={doc.snippet}
                              matchedTerms={doc.matchedTerms}
                            />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {doc.pageCode} — {doc.section}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {doc.pageType.replace(/_/g, " ")}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </SearchDialogContext.Provider>
  );
}
