import React from "react";
import {
  Plus,
  Monitor,
  Layers,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

export default function ScreenManagement() {
  const [branch, setBranch] = React.useState("All Branches");
  const [query, setQuery] = React.useState("");

  const branches = ["All Branches", "Downtown Branch", "Uptown Branch"]; 

  const singleScreens = [
    {
      id: 1,
      name: "Test",
      ratio: "9:16",
      branch: "Downtown Branch",
      group: "No Group",
    },
    {
      id: 2,
      name: "LOL",
      ratio: "9:16",
      branch: "Downtown Branch",
      group: "No Group",
    },
  ];

  const groupScreens = [
    {
      id: 10,
      name: "Group1",
      status: "unassigned",
      ratio: "",
      screensCount: 1,
      branch: "Downtown Branch",
      tags: ["Test"],
    },
    {
      id: 11,
      name: "Group1",
      status: "",
      ratio: "16:9",
      screensCount: 1,
      branch: "Downtown Branch",
      tags: ["Test"],
    },
  ];

  const filteredSingles = singleScreens.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredGroups = groupScreens.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddBranch = () => alert("Add Branch clicked");
  const handleAddScreen = () => alert("Add Screen clicked");
  const handleAddGroup = () => alert("Add Group clicked");

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Branch Select */}
          <div className="relative">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
            >
              {branches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" size={16} />
          </div>

          <button
            onClick={handleAddBranch}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            <Plus size={18} /> Add Branch
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search screens..."
              className="w-72 rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400"
            />
          </div>

          <button className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Single Screens */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor size={18} className="text-neutral-600" />
              <h2 className="text-base font-semibold text-neutral-800">Single Screens</h2>
            </div>
            <button
              onClick={handleAddScreen}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Plus size={18} /> Add Screen
            </button>
          </header>

          <div className="flex flex-col gap-3">
            {filteredSingles.map((s) => (
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
                      {s.ratio} <span className="mx-2">•</span> {s.branch} <span className="mx-2">•</span> {s.group}
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

        {/* Group Screens */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-neutral-600" />
              <h2 className="text-base font-semibold text-neutral-800">Group Screens</h2>
            </div>
            <button
              onClick={handleAddGroup}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Plus size={18} /> Add Group
            </button>
          </header>

          <div className="flex flex-col gap-3">
            {filteredGroups.map((g) => (
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
      </div>
    </div>
  );
}
