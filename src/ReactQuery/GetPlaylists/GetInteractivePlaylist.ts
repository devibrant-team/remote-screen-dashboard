import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { getInteractiveplaylistApi } from "../../API/API";

/* 1) Schemas — only the fields you actually use */
const InteractivePlaylistSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  duration: z.coerce.number(),
  slide_number: z.coerce.number(),
  media: z.string(), // keep plain; URLs may include spaces
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
  playLists: z.array(InteractivePlaylistSchema),
  pagination: PaginationSchema,
  now: z.string().optional(), // not used, but present
});

/* 2) Types */
type InteractivePlaylistRaw = z.infer<typeof InteractivePlaylistSchema>;
export type InteractivePlaylist = {
  id: number;
  name: string;
  duration: number;
  slideNumber: number;
  media: string;
};

type PageResult = {
  items: InteractivePlaylistRaw[];
  pagination: z.infer<typeof PaginationSchema>;
};

/* 3) Fetch a single page (by page number) */
async function fetchInteractiveplaylistPage(page: number, signal?: AbortSignal): Promise<PageResult> {
  const token = localStorage.getItem("token");
  // If your base already has query params, this still works:
  const join = getInteractiveplaylistApi.includes("?") ? "&" : "?";
  const url = `${getInteractiveplaylistApi}${join}page=${page}`;

  const res = await axios.get(url, {
    signal,
    timeout: 12_000,
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  const parsed = ApiResponseSchema.parse(res.data);
  const items = parsed.playLists.map((r) => ({
    ...r,
    // Encode once so <img> doesn't choke on spaces
    media: encodeURI(r.media),
  }));

  return { items, pagination: parsed.pagination };
}

/* 4) Infinite hook */
export function useGetInteractiveplaylist() {
  return useInfiniteQuery<PageResult, Error, InteractivePlaylist[], ["interactiveplaylist"], number>({
    queryKey: ["interactiveplaylist"],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchInteractiveplaylistPage(pageParam, signal),
    // Compute next page from numbers (robust even if next_page_url is null)
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
    retry: 0, // easier debugging
    // Flatten + map to your camelCase type
    select: (data) =>
      data.pages.flatMap((p) =>
        p.items.map<InteractivePlaylist>((r) => ({
          id: r.id,
          name: r.name,
          duration: r.duration,
          slideNumber: r.slide_number,
          media: r.media,
        }))
      ),
  });
}
