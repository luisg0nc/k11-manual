# Project: Nissan Micra K11 Interactive Service Manual

@AGENTS.md

A fully static Next.js web app that renders a digitized factory service manual into a searchable, browsable site with diagnostic flowcharts, spec tables, repair procedures, parts diagrams, and wiring schematics.

## Tech Stack

- **Next.js 16.2.2** — App Router, `output: "export"` (static site, NO runtime server, NO API routes)
- **React 19.2.4** — async params in server components (Next.js 16 pattern)
- **TypeScript 5** — strict mode, path alias `@/*` → `./src/*`
- **Tailwind CSS v4** — via `@tailwindcss/postcss`, oklch color system, CSS variables
- **shadcn/ui** — `base-nova` style, RSC-compatible, `@base-ui/react` underneath
- **Mermaid 11** — client-side flowchart rendering
- **pnpm 10.28.2** — package manager (enforced)
- **Cloudflare Pages** — deployment via Wrangler (serves `./out` directory)

## Critical: Next.js 16 Breaking Changes

This project uses **Next.js 16**, which has breaking API changes. Your training data is likely outdated.
**Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.**

Key differences from Next.js 14/15:
- Route params are async (`params` is a Promise in page/layout components)
- `output: "export"` for static generation — no `getServerSideProps`, no API routes
- All routes use `generateStaticParams()` for static export

## Architecture

### Routing (App Router)
- `/` — Home page (section grid)
- `/[section]` — Section listing (pages grouped by section)
- `/[section]/[pageCode]` — Individual manual page (renders content blocks)

### Data Flow
1. **Upstream pipeline** (not in this repo): Extracts manual pages → structured JSON in `data/extracted/`
2. **Prebuild** (`scripts/prebuild.ts`): Reads all JSON, generates `public/search-docs.json`, copies images to `public/images/`
3. **SSG**: `src/lib/data/loader.ts` reads JSON via `fs.readFileSync` at build time, caches in memory
4. **Client search**: `search-docs.json` fetched lazily on Cmd+K; simple substring scoring

### Key Types (src/lib/data/types.ts)
- `ManualPage` — main interface (page_code, section, title, content_blocks, cross_references, etc.)
- `ContentBlock` — discriminated union on `block_type`
- `PageType` — `prose_procedure | spec_table | flowchart | parts_diagram | index_toc | wiring_diagram | component_photo | cover | section_divider | blank`

### Component Patterns
- **Server Components** by default; `"use client"` only for interactive parts
- **Block Renderer** (`src/components/blocks/block-renderer.tsx`): Dispatches `ContentBlock` union to specialized renderers via switch/case
- **10 block types**: `heading`, `prose`, `specs`, `procedure`, `flowchart`, `table`, `component_location`, `parts_diagram`, `wiring_schematic`, `diagnostic_code`
- **Client components**: flowcharts (Mermaid), search dialog (cmdk), theme toggle, page navigation (keyboard + swipe), figure zoom
- **Context providers** (root layout): ThemeProvider → PageNavProvider → TooltipProvider → SearchDialogProvider

### Sections
17 manual sections defined in `src/lib/data/sections.ts`:
GI, MA, EM, LC, EF&EC, FE, CL, MT, AT, PD, FA, RA, BR, ST, BF, HA, EL

## Directory Structure
```
data/extracted/     — ~80+ structured JSON files (one per manual page, pre-generated)
data/images/        — source figure images
scripts/            — prebuild.ts (search index + image copy)
src/app/            — pages and layouts (App Router)
src/components/blocks/  — content block renderers (10 types)
src/components/layout/  — nav, breadcrumbs, theme toggle
src/components/search/  — Cmd+K search dialog
src/components/ui/      — shadcn/ui primitives
src/lib/data/           — types.ts, loader.ts, sections.ts, search-index.ts
src/lib/hooks/          — use-page-navigation.ts (keyboard + swipe)
src/lib/utils.ts        — cn() helper (clsx + twMerge)
```

## Scripts
- `pnpm dev` — Turbopack dev server (runs prebuild first)
- `pnpm build` — Static export to `./out`
- `pnpm prebuild` — Generate search index + copy images

## Style
- oklch color system with CSS variables, neutral palette
- Dark mode via class toggle (custom ThemeProvider — do NOT use next-themes)
- Fonts: Barlow (sans) + JetBrains Mono (mono)

## Rules
- Do NOT add API routes — this is a fully static site
- Do NOT use `getServerSideProps` or any server-runtime APIs
- Do NOT modify JSON files in `data/extracted/` without understanding the upstream extraction pipeline
- Do NOT use `next-themes` — a custom ThemeProvider already exists
- Do NOT install packages without checking if a suitable one is already in deps
- Always use `generateStaticParams()` when adding new dynamic routes
- Prefer Server Components; only add `"use client"` when interactivity requires it
- Use the `@/*` path alias for imports (never relative paths climbing above `src/`)
