import axios from "axios";
import { getmediacontent } from "../../API/API";
import type { PlayListItem, PlayListsResponse } from "./PlaylistInterface";

export const fetchPlaylists = async (): Promise<PlayListItem[]> => {
  const { data } = await axios.get<PlayListsResponse>(getmediacontent);
  return data.playLists; // ✅ PlayListItem[]
};
