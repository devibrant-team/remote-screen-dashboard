import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { GetScheduleItem } from "../../../API/API";

/* -------- Server response -------- */
type ApiResponse = {
  success: boolean;
  count: number;
  data: Array<{
    id: number;
    name: string;
    created_at: string | null;
    updated_at: string | null;
  }>;
};

/* -------- UI model -------- */
export type ScheduleItem = {
  id: string;
  name: string;
  modifiedAtISO: string; // derived from updated_at || created_at || now
  filler: string | null; // optional in your UI
};

const toISO = (value: string | null | undefined) => {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const mapItem = (raw: ApiResponse["data"][number]): ScheduleItem => ({
  id: String(raw.id),
  name: raw.name ?? `Schedule ${raw.id}`,
  modifiedAtISO: toISO(raw.updated_at ?? raw.created_at),
  filler: null,
});

async function fetchItems(): Promise<ScheduleItem[]> {
  const token = localStorage.getItem("token") || "";
  const res = await axios.get<ApiResponse>(GetScheduleItem, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const list = res.data?.data ?? [];
  return list.map(mapItem);
}

export function useGetScheduleItem() {
  return useQuery({
    queryKey: ["scheduleItems"],
    queryFn: fetchItems,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 300_000,
  });
}
