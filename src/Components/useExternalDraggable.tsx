// Components/useExternalDraggable.ts
import { useEffect } from "react";
import { Draggable } from "@fullcalendar/interaction";

declare global {
  interface Window {
    __draggingPlaylist?: boolean;
  }
}

export function useExternalDraggable(
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector = ".fc-draggable"
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const draggable = new Draggable(container, {
      itemSelector,
      eventData: (el) => {
        const root = el as HTMLElement;
        const id = root.getAttribute("data-playlist-id");
        const title = root.getAttribute("data-title") || "";
        const duration = Number(root.getAttribute("data-duration") || 0);

        return {
          title,
          extendedProps: {
            playlistId: id ? Number(id) : undefined,
            durationSec: duration || undefined,
          },
        };
      },
    });

    // Track dragging state (see section 2)
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(itemSelector)) {
        window.__draggingPlaylist = true;
      }
    };

    const handleMouseUp = () => {
      window.__draggingPlaylist = false;
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      draggable.destroy();
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.__draggingPlaylist = false;
    };
  }, [containerRef, itemSelector]);
}
