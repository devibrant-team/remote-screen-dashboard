import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPage } from "../../Redux/Media/MediaLibrarySlice";
import type { RootState } from "../../../store";

export const Pager: React.FC = () => {
  const dispatch = useDispatch();
  const { page, meta, loading } = useSelector(
    (s: RootState) => s.mediaLibrary
  );

  const lastPage = Math.max(1, meta.last_page || 1);
  const total = meta.total ?? 0;

  const handlePrev = () => dispatch(setPage(Math.max(1, page - 1)));
  const handleNext = () => dispatch(setPage(Math.min(lastPage, page + 1)));

  if (lastPage <= 1) return null;

  return (
    <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 backdrop-blur">
      <div className="text-xs text-gray-600">
        Page <span className="font-semibold text-gray-900">{page}</span>
        <span className="text-gray-400"> / {lastPage}</span>
        <span className="ml-2 text-gray-400">• {total} items</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={page <= 1 || loading}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition enabled:hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Prev
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={page >= lastPage || loading}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition enabled:hover:bg-gray-50 disabled:opacity-50"
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
