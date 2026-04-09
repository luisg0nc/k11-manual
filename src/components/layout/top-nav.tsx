"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Wrench, Cog } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SearchButton } from "@/components/search/search-button";
export function TopNav() {
  const pathname = usePathname();

  // Hide nav on homepage — search and theme toggle live in the hero instead
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 sm:gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight shrink-0">
          <Image
            src="/k11-sil-removebg-preview.png"
            alt="K11"
            width={543}
            height={165}
            className="h-6 w-auto invert dark:invert-0 opacity-80"
          />
          <span className="hidden sm:inline">K11 Service Manual</span>
          <span className="sm:hidden">K11</span>
        </Link>

        <div className="flex-1" />

        <Link
          href="/torque"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          title="Torque Specifications"
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Torque Specs</span>
        </Link>

        <Link
          href="/parts"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          title="Parts Diagrams"
        >
          <Cog className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Parts</span>
        </Link>

        <SearchButton />

        <ThemeToggle />
      </div>
    </header>
  );
}
