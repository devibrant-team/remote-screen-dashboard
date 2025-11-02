// GetDeviceSchedule.ts
import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { GetScheduleDetailsApi } from "../../API/API";

/* =========================
   Types (exported)
   ========================= */
export type ScreenRef = { screenId: number };
export type GroupRef  = { groupId: number };

export type GetScheduleDetailsPayload = {
  screens: ScreenRef[];
  groups: GroupRef[];
};

/** One schedule row returned by your backend */
export type ApiScheduleRow = {
  id: number | string;
  title?: string;
  scheduleItem?: string;
  playlistId?: number;
  startDate?: string;
  endDate?: string | null;
  startTime?: string;
  endTime?: string;
  groups?: Array<{ groupId: number; groupName?: string }>;
  screens?: Array<{ screenId: number; screenName?: string }>;
};

/** Support `{ data: { schedule } }` *or* `{ schedule }` */
export type ScheduleDetailsResponse =
  | { data?: { schedule?: ApiScheduleRow[] } }
  | { schedule?: ApiScheduleRow[] };

/* =========================
   Helpers
   ========================= */
function toBracketParams(payload: GetScheduleDetailsPayload) {
  const params: Record<string, string | number> = {};

  (payload.screens ?? []).forEach((s, i) => {
    if (Number.isFinite(s.screenId)) {
      params[`screens[${i}][screenId]`] = s.screenId;
    }
  });

  (payload.groups ?? []).forEach((g, i) => {
    if (Number.isFinite(g.groupId)) {
      params[`groups[${i}][groupId]`] = g.groupId;
    }
  });

  return params;
}

/* =========================
   API client (GET with bracket params + Bearer)
   ========================= */
export async function getScheduleDetails(
  payload: GetScheduleDetailsPayload
): Promise<ScheduleDetailsResponse> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await axios.get<ScheduleDetailsResponse>(GetScheduleDetailsApi, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Build query string like screens[0][screenId]=12&...
    params: toBracketParams(payload),
    // Keep axios from re-serializing; our keys already include brackets
    paramsSerializer: {
      serialize: (p) => {
        const usp = new URLSearchParams();
        Object.entries(p).forEach(([k, v]) => usp.append(k, String(v)));
        return usp.toString();
      },
    },
  });

  return res.data;
}

/* =========================
   Hook
   ========================= */
type UseGetScheduleDetailsArgs = {
  screenIds: Array<string | number>;
  groupIds: Array<string | number>;
};

export function useGetScheduleDetails({ screenIds, groupIds }: UseGetScheduleDetailsArgs) {
  const payload: GetScheduleDetailsPayload | null = useMemo(() => {
    const s: ScreenRef[] = (screenIds ?? [])
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n))
      .map((screenId) => ({ screenId }));

    const g: GroupRef[] = (groupIds ?? [])
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n))
      .map((groupId) => ({ groupId }));

    if (s.length === 0 && g.length === 0) return null;
    return { screens: s, groups: g };
  }, [screenIds, groupIds]);

  const queryKey = useMemo(
    () => [
      "schedule-details",
      {
        screens: (payload?.screens ?? []).map((x) => x.screenId).sort((a, b) => a - b),
        groups: (payload?.groups ?? []).map((x) => x.groupId).sort((a, b) => a - b),
      },
    ],
    [payload]
  );

  const query = useQuery<ScheduleDetailsResponse>({
    queryKey,
    queryFn: () => getScheduleDetails(payload as GetScheduleDetailsPayload),
    enabled: !!payload,           // only when we have at least one id
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return { ...query, payload };
}
