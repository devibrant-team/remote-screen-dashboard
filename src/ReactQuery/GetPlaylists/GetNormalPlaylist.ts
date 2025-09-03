// useGetNormalPlaylist.ts
import { useInfiniteQuery } from "@tanstack/react-query";
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
  media: z.string(), // keep plain; encode before rendering
});

const PaginationSchema = z.object({
  current_page: z.coerce.number(),
  per_page: z.coerce.number(),
  total: z.coerce.number(),
  last_page: z.coerce.number(),
  next_page_url: z.string().nullable().optional(),
  prev_page_url: z.string().nullable().optional(),
  first_page_url: z.string().nullable().optional(),
  last_page_url: z.string().nullable().optional(),
});

const ApiResponseSchema = z.object({
  success: z.boolean(),
  playLists: z.array(NormalPlaylistSchema),
  pagination: PaginationSchema,
});

type NormalPlaylistRaw = z.infer<typeof NormalPlaylistSchema>;

/* 2) Public type (camelCase) */
export type NormalPlaylist = {
  id: number;
  name: string;
  duration: number;
  slideNumber: number;
  media: string;
};

/* 3) One-page fetcher */
type PageResult = {
  items: NormalPlaylistRaw[];
  pagination: z.infer<typeof PaginationSchema>;
};

async function fetchNormalPlaylistsPage(page: number, signal?: AbortSignal): Promise<PageResult> {
  const token = localStorage.getItem("token");
  const join = getNormalplaylistApi.includes("?") ? "&" : "?";
  const url = `${getNormalplaylistApi}${join}page=${page}`;

  const res = await axios.get(url, {
    signal,
    timeout: 12_000,
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  const parsed = ApiResponseSchema.parse(res.data);

  const items = parsed.playLists.map((r) => ({
    ...r,
    media: encodeURI(r.media), // handle spaces safely for <img src>
  }));

  return { items, pagination: parsed.pagination };
}

/* 4) Infinite hook */
export function useGetNormalPlaylist() {
  return useInfiniteQuery<PageResult, Error, NormalPlaylist[], ["normalplaylist"], number>({
    queryKey: ["normalplaylist"],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchNormalPlaylistsPage(pageParam, signal),
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.pagination;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const { current_page } = firstPage.pagination;
      return current_page > 1 ? current_page - 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
    // Flatten + map to your camelCase type
    select: (data) =>
      data.pages.flatMap((p) =>
        p.items.map<NormalPlaylist>((r) => ({
          id: r.id,
          name: r.name,
          duration: r.duration,
          slideNumber: r.slide_number,
          media: r.media,
        }))
      ),
  });
}
