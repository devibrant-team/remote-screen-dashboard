// src/ReactQuery/Media/useGetMedia.ts
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMediaUserApi } from "../../API/API";

export type AllowedType = "image" | "video";

export interface MediaItem {
  id: number;
  type: AllowedType | string;
  media: string;
  storage: number | string;     // backend sends string, we accept both
  tagId?: number | null;        // OPTIONAL, matches API
  tag: string | null;           // 👈 IMPORTANT: allow null (matches backend)
}

export interface GetMediaResponse {
  success: boolean;
  media: MediaItem[];

  // some APIs send a `meta` block, some send flat pagination fields
  meta?: {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };

  current_page?: number;
  total_pages?: number;
  total?: number;
}

type FetchArgs = {
  signal?: AbortSignal;
  token?: string | null;
  page?: number;
  perPage?: number;
  tagId?: number | string | null;
};

export interface PaginatedMedia {
  media: MediaItem[];
  meta: {
    current_page: number;
    per_page: number;
    last_page: number; // treat as total_pages
    total: number;
  };
}

export async function fetchUserMedia({
  signal,
  token,
  page = 1,
  perPage = 6,
  tagId = null,
}: FetchArgs = {}): Promise<PaginatedMedia> {
  const params: Record<string, any> = {
    page,
    per_page: perPage,
  };

  if (tagId !== null && tagId !== undefined) {
    params.tagId = tagId;
  }

  const { data } = await axios.get<GetMediaResponse>(getMediaUserApi, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params,
  });

  if (!data?.success || !Array.isArray(data.media)) {
    throw new Error("Invalid media response");
  }

  // 🔹 Normalize pagination regardless of whether it comes in `meta` or flat
  const current_page =
    data.meta?.current_page ?? data.current_page ?? page ?? 1;

  const last_page =
    data.meta?.last_page ??
    data.total_pages ?? // backend field
    (data.media.length < perPage ? current_page : current_page + 1);

  const per_page = data.meta?.per_page ?? perPage;

  const total =
    data.meta?.total ??
    data.total ?? // if backend gives it
    data.media.length;

  return {
    media: data.media,
    meta: {
      current_page,
      last_page,
      per_page,
      total,
    },
  };
}

const FIVE_MIN = 5 * 60 * 1000;

export function useGetMedia(
  opts: {
    page?: number;
    perPage?: number;
    requireAuth?: boolean;
    tagId?: number | string | null;
  } = {}
) {
  const { page = 1, perPage = 6, requireAuth = true, tagId = null } = opts;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery<PaginatedMedia>({
    queryKey: ["userMedia", Boolean(token), page, perPage, tagId ?? "all"],
    queryFn: ({ signal }) =>
      fetchUserMedia({ signal, token, page, perPage, tagId }),
    enabled: requireAuth ? Boolean(token) : true,
    staleTime: FIVE_MIN,
    gcTime: FIVE_MIN,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
