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

/** Replace with your actual API response shape if you know it */
export type ScheduleDetailsResponse = unknown;
export type ApiResponse = ScheduleDetailsResponse;

/* =========================
   API client (GET with CSV params + Bearer)
   ========================= */
export async function postGetScheduleDetails(
  payload: GetScheduleDetailsPayload
): Promise<ApiResponse> {
  const screensCsv = (payload.screens ?? [])
    .map((s) => s.screenId)
    .filter((n) => Number.isFinite(n))
    .join(",");

  const groupsCsv = (payload.groups ?? [])
    .map((g) => g.groupId)
    .filter((n) => Number.isFinite(n))
    .join(",");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await axios.get<ApiResponse>(GetScheduleDetailsApi, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    params: {
      groups: groupsCsv,
      screens: screensCsv,
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

export function useGetScheduleDetails({
  screenIds,
  groupIds,
}: UseGetScheduleDetailsArgs) {
  // Build stable, numeric payload
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
        screens: (payload?.screens ?? [])
          .map((x: ScreenRef) => x.screenId)
          .sort((a: number, b: number) => a - b),
        groups: (payload?.groups ?? [])
          .map((x: GroupRef) => x.groupId)
          .sort((a: number, b: number) => a - b),
      },
    ],
    [payload]
  );

  const query = useQuery<ScheduleDetailsResponse>({
    queryKey,
    queryFn: () => postGetScheduleDetails(payload as GetScheduleDetailsPayload),
    enabled: !!payload, // only when we have selections
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return { ...query, payload };
}
