import React from "react";
import { Plus, Monitor, Pencil, Trash2 } from "lucide-react";

export type SingleScreen = {
  id: number | string;
  name: string;
  ratio: string;
  branch: string;
  group: string;
};

type Props = {
  items: SingleScreen[];
  onAdd: () => void;
};

const SingleScreensSection: React.FC<Props> = ({ items, onAdd }) => {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor size={18} className="text-neutral-600" />
          <h2 className="text-base font-semibold text-neutral-800">Single Screens</h2>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <Plus size={18} /> Add Screen
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {items.map((s) => (
          <article
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Monitor size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{s.name}</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {s.ratio} <span className="mx-2">•</span> {s.branch}{" "}
                  <span className="mx-2">•</span> {s.group}
                </p>
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

export default SingleScreensSection;
