// hooks/useExternalDraggable.ts
import { useEffect } from "react";
import { Draggable } from "@fullcalendar/interaction";

declare global {
  interface Window {
    __draggingPlaylist?: boolean;
  }
}

/**
 * Attach FullCalendar external Draggable to a container.
 * Automatically toggles a global "dragging playlist" flag so the calendar
 * won't also create via select/dateClick during an external drop.
 */
export function useExternalDraggable(
  container: HTMLElement | null,
  itemSelector: string
) {
  useEffect(() => {
    if (!container) return;

    const onMouseDown = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      // set flag if mousedown starts on a draggable playlist row
      if (target.closest(itemSelector)) {
        window.__draggingPlaylist = true;
      }
    };

    const onMouseUp = () => {
      window.__draggingPlaylist = false;
    };

    container.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mouseup", onMouseUp, true);

    const draggable = new Draggable(container, {
      itemSelector,
      eventData: (el) => {
        const playlistId = el.getAttribute("data-playlist-id") || "";
        const title = el.getAttribute("data-title") || "Playlist";
        const isInteractive = el.getAttribute("data-interactive") === "1";
        return {
          title,
          duration: "00:30:00",
          extendedProps: {
            borderClass: "border-red-600",
            isLocal: true,
            playlistId,
            isInteractive,
          },
        };
      },
    });

    return () => {
      draggable.destroy();
      container.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mouseup", onMouseUp, true);
    };
  }, [container, itemSelector]);
}
