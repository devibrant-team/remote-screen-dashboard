import React from "react";
import { Plus, Layers, Pencil, Trash2 } from "lucide-react";

export type GroupScreen = {
  id: number | string;
  name: string;
  status?: string;
  ratio?: string;
  screensCount: number;
  branch: string;
  tags: string[];
};

type Props = {
  items: GroupScreen[];
  onAdd: () => void;
};

const GroupScreensSection: React.FC<Props> = ({ items, onAdd }) => {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-neutral-600" />
          <h2 className="text-base font-semibold text-neutral-800">Group Screens</h2>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <Plus size={18} /> Add Group
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {items.map((g) => (
          <article
            key={g.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Layers size={18} className="text-red-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">{g.name}</h3>
                <p className="text-xs text-neutral-500">
                  {g.status && (
                    <>
                      <span className="text-red-500">{g.status}</span>
                      <span className="mx-2">•</span>
                    </>
                  )}
                  {g.ratio && (
                    <>
                      <span>{g.ratio}</span>
                      <span className="mx-2">•</span>
                    </>
                  )}
                  {g.screensCount} Screens <span className="mx-2">•</span> {g.branch}
                </p>
                <div className="flex gap-2">
                  {g.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-neutral-500">
              <button className="rounded p-1 hover:bg-neutral-100" title="Edit">
                <Pencil size={16} />
              </button>
              <button className="rounded p-1 hover:bg-neutral-100" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default GroupScreensSection;
