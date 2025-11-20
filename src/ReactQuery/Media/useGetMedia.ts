// src/hooks/media/useGetMedia.ts
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMediaUserApi } from "../../API/API";

export type AllowedType = "image" | "video";

export interface MediaItem {
  id: number;
  type: AllowedType | string;
  media: string;
  storage: number;
  tag:string;
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
  tagId?: number | string | null; // 🔴 NEW
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
  tagId = null, // 🔴 NEW
}: FetchArgs = {}): Promise<PaginatedMedia> {
  const params: Record<string, any> = {
    page,
    per_page: perPage,
  };

  // 🔴 only send tagId if not null (All → null → not sent)
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

  if (!data.meta) {
    return {
      media: data.media,
      meta: {
        current_page: page,
        per_page: perPage,
        last_page: data.media.length < perPage ? page : page + 1,
        total: page * perPage,
      },
    };
  }

  return { media: data.media, meta: data.meta };
}

const FIVE_MIN = 5 * 60 * 1000;

export function useGetMedia(
  opts: {
    page?: number;
    perPage?: number;
    requireAuth?: boolean;
    tagId?: number | string | null; // 🔴 NEW
  } = {}
) {
  const {
    page = 1,
    perPage = 6,
    requireAuth = true,
    tagId = null,
  } = opts;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery<PaginatedMedia>({
    // 🔴 include tagId in cache key
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
