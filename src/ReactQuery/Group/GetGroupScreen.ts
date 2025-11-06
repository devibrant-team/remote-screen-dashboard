// src/ReactQuery/Group/useGetGroupScreens.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getScreensGroupApi } from "../../API/API";

export type GroupScreen = {
  id: number;
  name: string;
  branchId: number;
  branchName: string;
  ratio: string;
  ratioId: number | null;
  defaultPlaylistId: number | null;
  defaultPlaylistName: string | null;
};

export const GROUP_SCREENS_QK = ["group-screens"] as const;

async function fetchGroupScreens(groupId: number): Promise<GroupScreen[]> {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${getScreensGroupApi}/${groupId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  // The backend already returns the shape you need
  return (res.data?.screens ?? []) as GroupScreen[];
}

export function useGetGroupScreens(groupId: number | null | undefined) {
  return useQuery<GroupScreen[], Error>({
    queryKey: [...GROUP_SCREENS_QK, groupId],
    queryFn: () => fetchGroupScreens(groupId as number),
    enabled: typeof groupId === "number", // only fetch when an id is provided
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
