import type { HeadingBlock as HeadingBlockType } from "@/lib/data/types";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  // Bump level-1 to h2 since the page already renders an h1 for the title
  const rawLevel = block.level ?? 2;
  const level = rawLevel === 1 ? 2 : rawLevel;
  const id = slugify(block.text);

  const baseClass = "scroll-mt-20 font-bold tracking-tight";

  switch (level) {
    case 2:
      return (
        <h2 id={id} className={`${baseClass} text-xl mt-8 mb-3 border-b border-border pb-2`}>
          {block.text}
        </h2>
      );
    case 3:
    default:
      return (
        <h3 id={id} className={`${baseClass} text-lg mt-5 mb-2 text-muted-foreground`}>
          {block.text}
        </h3>
      );
  }
}
