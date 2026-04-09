"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ManualPage } from "@/lib/data/types";
import { usePageNavigation } from "@/lib/hooks/use-page-navigation";
import { pageCodeToSlug, sectionCodeToSlug } from "@/lib/data/sections";

function pageHref(page: ManualPage) {
  return `/${sectionCodeToSlug(page.section)}/${pageCodeToSlug(page.page_code)}`;
}

interface PageNavState {
  prev: ManualPage | null;
  next: ManualPage | null;
}

const PageNavContext = createContext<{
  nav: PageNavState;
  setNav: (nav: PageNavState) => void;
}>({
  nav: { prev: null, next: null },
  setNav: () => {},
});

export function PageNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<PageNavState>({ prev: null, next: null });
  const stableSetNav = useCallback((n: PageNavState) => setNav(n), []);

  return (
    <PageNavContext.Provider value={{ nav, setNav: stableSetNav }}>
      {children}
    </PageNavContext.Provider>
  );
}

export function usePageNav() {
  return useContext(PageNavContext);
}

/**
 * Invisible client component placed on detail pages.
 * Sets prev/next in context (consumed by TopNav) and hooks up keyboard/swipe.
 */
export function PageNavSetter({
  prev,
  next,
}: {
  prev: ManualPage | null;
  next: ManualPage | null;
}) {
  const { setNav } = usePageNav();

  const prevHref = prev ? pageHref(prev) : null;
  const nextHref = next ? pageHref(next) : null;

  // Register keyboard + swipe navigation
  usePageNavigation(prevHref, nextHref);

  // Sync prev/next into context so TopNav can render arrows
  useEffect(() => {
    setNav({ prev, next });
  }, [prev?.page_code, next?.page_code, prev, next, setNav]);

  return null;
}
