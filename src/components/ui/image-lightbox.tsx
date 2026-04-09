"use client";

import { useCallback, useRef } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt: string;
  caption?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1.5 backdrop-blur-sm">
      <button
        onClick={() => zoomOut(0.5)}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" />
      <button
        onClick={() => resetTransform()}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Reset zoom"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/20" />
      <button
        onClick={() => zoomIn(0.5)}
        className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ImageLightbox({
  src,
  alt,
  caption,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking directly on the backdrop/wrapper, not on the image
      if (e.target === wrapperRef.current) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/90 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex flex-col outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          {/* Accessible title (visually hidden) */}
          <DialogPrimitive.Title className="sr-only">
            {alt || "Image viewer"}
          </DialogPrimitive.Title>

          {/* Close button */}
          <DialogPrimitive.Close className="absolute top-3 right-3 z-20 rounded-full border border-white/10 bg-black/60 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Image area with pan & zoom */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={8}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 1.5 }}
              wheel={{ step: 0.08 }}
              panning={{ velocityDisabled: false }}
              limitToBounds={false}
            >
              <ZoomControls />
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                wrapperClass="!w-full !h-full"
              >
                <div
                  ref={wrapperRef}
                  onClick={handleBackdropClick}
                  className="flex h-full w-full items-center justify-center p-4 sm:p-8"
                >
                  <img
                    src={src}
                    alt={alt}
                    className={cn(
                      "max-h-[calc(100dvh-6rem)] max-w-full rounded-sm object-contain",
                      "select-none",
                      "bg-white shadow-2xl shadow-black/40"
                    )}
                    draggable={false}
                  />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Caption bar */}
          {caption && (
            <div className="shrink-0 border-t border-white/10 bg-black/60 px-4 py-2.5 text-center text-sm text-white/70 backdrop-blur-sm">
              {caption}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
