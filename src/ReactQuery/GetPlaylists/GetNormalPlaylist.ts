import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { getNormalplaylistApi } from "../../API/API";

/* 1) Schemas */
const NormalPlaylistSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  playListStyle: z.string(),
  duration: z.coerce.number(),
  slide_number: z.coerce.number(),
  grid: z.string(),
  // .url() fails if there are spaces; keep it plain or encode later
  media: z.string(),
});
const NormalPlaylistArraySchema = z.array(NormalPlaylistSchema);

const ApiResponseSchema = z.object({
  success: z.boolean(),
  // Note the capital L: playLists
  playLists: NormalPlaylistArraySchema,
});

type NormalPlaylistRaw = z.infer<typeof NormalPlaylistSchema>;

export type NormalPlaylist = {
  id: number;
  name: string;
  duration: number;
  slideNumber: number;
  media: string; // you can encode with encodeURI when rendering if needed
};

/* 2) Fetcher */
const fetchNormalPlaylists = async (signal?: AbortSignal): Promise<NormalPlaylistRaw[]> => {
  const token = localStorage.getItem("token");

  const res = await axios.get(getNormalplaylistApi, {
    signal,
    timeout: 12_000,
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  const parsed = ApiResponseSchema.parse(res.data);
  // optional: ensure media is safe to use in <img src>
  const rows = parsed.playLists.map((r) => ({
    ...r,
    media: encodeURI(r.media), // handles spaces like "Omar Yassin"
  }));

  return rows;
};

/* 3) Hook */
export const useGetNormalPlaylist = () =>
  useQuery({
    queryKey: ["normalplaylist"],
    queryFn: ({ signal }) => fetchNormalPlaylists(signal),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0, // disable while debugging
    select: (rows): NormalPlaylist[] =>
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        duration: r.duration,
        slideNumber: r.slide_number,
        media: r.media,
      })),
  });
