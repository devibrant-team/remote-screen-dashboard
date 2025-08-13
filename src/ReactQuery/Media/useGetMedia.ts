// src/hooks/media/useGetMedia.ts
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMediaUserApi } from "../../API/API";

export type AllowedType = "image" | "video";

export interface MediaItem {
  id: number;
  type: AllowedType | string; // backend might return other strings; we'll normalize in UI
  media: string; // absolute URL
}

export interface GetMediaResponse {
  success: boolean;
  media: MediaItem[];
  meta?: {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
}

type FetchArgs = {
  signal?: AbortSignal;
  token?: string | null;
  page?: number;
  perPage?: number;
};

export interface PaginatedMedia {
  media: MediaItem[];
  meta: {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
}

export async function fetchUserMedia({
  signal,
  token,
  page = 1,
  perPage = 6,
}: FetchArgs = {}): Promise<PaginatedMedia> {
  const { data } = await axios.get<GetMediaResponse>(getMediaUserApi, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params: { page, per_page: perPage },
  });

  if (!data?.success || !Array.isArray(data.media)) {
    throw new Error("Invalid media response");
  }

  // Require meta from backend for proper paging
  if (!data.meta) {
    // If your backend doesn't send meta yet, add it (see Laravel snippet below).
    // Temporary graceful fallback:
    return {
      media: data.media,
      meta: {
        current_page: page,
        per_page: perPage,
        last_page: data.media.length < perPage ? page : page + 1, // naive guess
        total: page * perPage, // naive guess
      },
    };
  }

  return { media: data.media, meta: data.meta };
}

const FIVE_MIN = 5 * 60 * 1000;

export function useGetMedia(
  opts: { page?: number; perPage?: number; requireAuth?: boolean } = {}
) {
  const { page = 1, perPage = 6, requireAuth = true } = opts;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery<PaginatedMedia>({
    queryKey: ["userMedia", Boolean(token), page, perPage],
    queryFn: ({ signal }) => fetchUserMedia({ signal, token, page, perPage }),
    enabled: requireAuth ? Boolean(token) : true,
    staleTime: FIVE_MIN,
    gcTime: FIVE_MIN,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
