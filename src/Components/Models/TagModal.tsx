import React, { useState } from "react";
import { X, Tag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useGetTags } from "@/ReactQuery/Tag/GetTag";
import { setExistingTag, setNewTagText } from "../../ReactQuery/Tag/TagSlice";
import type { RootState } from "store";
import { AssignTag, type AssignTagForm } from "../../ReactQuery/Tag/AssignTag";

type TagOption = {
  id: number | string;
  name: string;
};

type TagModalProps = {
  open: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
};

// ----- color helpers -----
const TAG_COLOR_PALETTE = [
  {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    hoverBg: "hover:bg-orange-100",
    hoverBorder: "hover:border-orange-300",
  },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    hoverBg: "hover:bg-emerald-100",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    hoverBg: "hover:bg-sky-100",
    hoverBorder: "hover:border-sky-300",
  },
  {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    hoverBg: "hover:bg-violet-100",
    hoverBorder: "hover:border-violet-300",
  },
  {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    hoverBg: "hover:bg-rose-100",
    hoverBorder: "hover:border-rose-300",
  },
  {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    hoverBg: "hover:bg-amber-100",
    hoverBorder: "hover:border-amber-300",
  },
  {
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-200",
    hoverBg: "hover:bg-lime-100",
    hoverBorder: "hover:border-lime-300",
  },
];

function getColorForTag(tag: TagOption) {
  const key = String(tag.id ?? tag.name);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}

const TagModal: React.FC<TagModalProps> = ({
  open,
  onClose,
  isSubmitting = false,
}) => {
  const dispatch = useDispatch();

  // 🔴 all hooks before any early return
  const tagState = useSelector((state: RootState) => state.tag);
  const [selectedTagId, setSelectedTagId] = useState<TagOption["id"] | null>(
    null
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const { data: tags = [], isLoading, isError } = useGetTags();

  if (!open) return null;

  const handleSelectTag = (id: TagOption["id"]) => {
    setSelectedTagId((prev) => (prev === id ? null : id));
    setIsAdding(false);
    setNewTagName("");
  };

  const handleSave = async () => {
    const trimmed = newTagName.trim();

    // update redux slice for tag meta (optional, but matches your design)
    if (selectedTagId != null) {
      dispatch(setExistingTag(selectedTagId));
    }
    if (isAdding && trimmed.length > 0) {
      dispatch(setNewTagText(trimmed));
    }

    const payload: AssignTagForm = {
      tagId:
        selectedTagId != null
          ? Number(selectedTagId) // ensure number if backend expects it
          : null,
      tagText: isAdding && trimmed.length > 0 ? trimmed : null,
      media: tagState.mediaIds.map((id) => ({ id })), // 👈 [{ id:10 }, { id:11 }]
    };

    try {
      setLocalSubmitting(true);
      const res = await AssignTag(payload);

      onClose();
    } catch (err) {
      console.error("❌ AssignTag API error:", err);
      // you can show toast / banner here later
    } finally {
      setLocalSubmitting(false);
    }
  };

  const canSave =
    (selectedTagId != null || (newTagName.trim().length > 0 && isAdding)) &&
    tagState.mediaIds.length > 0; // make sure we have media

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Tag className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Assign tag
              </h2>
              <p className="text-[11px] text-gray-500">
                Choose an existing tag or create a new one.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-4 py-4">
          {isLoading ? (
            <div className="text-xs text-gray-500">Loading tags…</div>
          ) : isError ? (
            <div className="text-xs text-red-500">
              Failed to load tags. Try again later.
            </div>
          ) : tags.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Tags</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(true);
                    setSelectedTagId(null);
                  }}
                  className="text-[11px] font-medium text-red-500 hover:underline"
                >
                  + Add new
                </button>
              </div>

              {/* Tag list */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: TagOption) => {
                    const isActive = selectedTagId === tag.id;
                    const color = getColorForTag(tag);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTag(tag.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition
                          ${
                            isActive
                              ? "bg-red-500 text-white shadow-sm"
                              : `${color.bg} ${color.text} ${color.border} border ${color.hoverBg} ${color.hoverBorder}`
                          }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            // Empty state
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-4 py-6 text-center hover:border-red-300 hover:bg-red-50/40"
            >
              <span className="text-sm font-medium text-gray-800">
                No tags yet
              </span>
              <span className="mt-1 text-xs font-semibold text-red-500">
                + Add new tag
              </span>
            </button>
          )}

          {/* Add new tag section */}
          {isAdding && (
            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3">
              <label className="block text-xs font-medium text-gray-700">
                New tag name
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Summer campaign"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black/70"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || isSubmitting || localSubmitting}
            onClick={handleSave}
            className="rounded-lg bg-[var(--mainred,_#ef4444)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || localSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagModal;
