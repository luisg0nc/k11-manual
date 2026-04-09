"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Adds keyboard arrow-key and touch-swipe navigation between manual pages.
 *
 * - ArrowLeft / ArrowRight navigate to prev / next page.
 * - Horizontal swipe (>60 px, with vertical rejection) on touch devices.
 */
export function usePageNavigation(prevHref: string | null, nextHref: string | null) {
  const router = useRouter();

  // --- Keyboard navigation ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when user is typing in an input / textarea / contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === "ArrowLeft" && prevHref) {
        e.preventDefault();
        router.push(prevHref);
      } else if (e.key === "ArrowRight" && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
    },
    [prevHref, nextHref, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // --- Touch / swipe navigation ---
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      touchStart.current = null;

      // Must be primarily horizontal (|dx| > 2 * |dy|) and exceed threshold
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;

      if (dx > 0 && prevHref) {
        router.push(prevHref);
      } else if (dx < 0 && nextHref) {
        router.push(nextHref);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [prevHref, nextHref, router]);
}
