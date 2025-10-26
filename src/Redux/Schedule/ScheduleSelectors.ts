// src/Redux/schedule/scheduleSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../../store"; // adjust if needed
import type { ScheduleItem } from "./ScheduleTypes";

/* Root slice */
const selectScheduleState = (state: RootState) => state.schedule;

/* Return a stable array of ScheduleItem (memoized) */
export const selectAllScheduleItems = createSelector(
  [selectScheduleState],
  (schedule): ScheduleItem[] =>
    schedule.allIds.map((id) => schedule.byId[id]).filter(Boolean)
);

/* --- date helpers --- */
const fromDateTimeStrings = (date: string, time: string) => {
  const [dd, mm, yyyy] = date.split("-").map(Number);
  const [hh, mi, ss] = time.split(":").map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1, hh || 0, mi || 0, ss || 0);
};

/* Base events for FullCalendar (stable & memoized) */
export const selectCalendarBaseEvents = createSelector(
  [selectAllScheduleItems],
  (items) =>
    items.map((it) => {
      const start = fromDateTimeStrings(it.startDate, it.startTime);
      const end = fromDateTimeStrings(it.endDate, it.endTime);
      return {
        id: it.id,
        title: it.title || `Playlist ${it.playlistId ?? ""}`,
        start: start.toISOString(),
        end: end.toISOString(),
      };
    })
);

/* Lane colors */
const LANE_COLORS = ["#EF4444", "#8B5CF6", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"];

/* Decorated events with lane info (memoized) */
export const selectDecoratedCalendarEvents = createSelector(
  [selectCalendarBaseEvents],
  (baseEvents) => {
    type Tmp = (typeof baseEvents)[number] & { sd: Date; ed: Date; used?: boolean };
    const tmp: Tmp[] = baseEvents.map((e) => ({ ...e, sd: new Date(e.start), ed: new Date(e.end) }));

    const overlaps = (a: Tmp, b: Tmp) => a.sd < b.ed && b.sd < a.ed;
    const out: Array<
      (typeof baseEvents)[number] & {
        backgroundColor?: string;
        borderColor?: string;
        extendedProps?: any;
      }
    > = [];

    for (let i = 0; i < tmp.length; i++) {
      const root = tmp[i];
      if (root.used) continue;

      // build overlap cluster
      const cluster: Tmp[] = [root];
      root.used = true;

      let grew = true;
      while (grew) {
        grew = false;
        for (let j = 0; j < tmp.length; j++) {
          const c = tmp[j];
          if (c.used) continue;
          if (cluster.some((x) => overlaps(x, c))) {
            c.used = true;
            cluster.push(c);
            grew = true;
          }
        }
      }

      // assign lanes in the cluster
      type Lane = { end: Date };
      const lanes: Lane[] = [];
      const assigned: Array<{ ev: Tmp; laneIdx: number }> = [];

      cluster
        .slice()
        .sort((a, b) => a.sd.getTime() - b.sd.getTime())
        .forEach((ev) => {
          let slot = lanes.findIndex((l) => l.end <= ev.sd);
          if (slot === -1) {
            lanes.push({ end: ev.ed });
            slot = lanes.length - 1;
          } else {
            lanes[slot].end = ev.ed;
          }
          assigned.push({ ev, laneIdx: slot });
        });

      for (const { ev, laneIdx } of assigned) {
        const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
        out.push({
          id: ev.id,
          title: ev.title,
          start: ev.start,
          end: ev.end,
          backgroundColor: "transparent",
          borderColor: "transparent",
          extendedProps: { laneIndex: laneIdx, laneColor: color },
        });
      }
    }

    return out;
  }
);

/* Optional convenience selectors */
export const selectScheduleItemById = (id: string) =>
  createSelector([selectScheduleState], (s) => s.byId[id] as ScheduleItem | undefined);
