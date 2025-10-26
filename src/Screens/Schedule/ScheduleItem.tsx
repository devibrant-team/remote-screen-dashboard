import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, ChevronDown } from "lucide-react";
import SelectScreenModal from "./Components/Models/SelectScreenModal";


/* --- mock rows (design only) --- */
const MOCK = [
  { id: "1", name: "Schedule 1", modifiedAtISO: "2025-10-25T12:25:00", filler: "Playlist 1" },
  { id: "2", name: "Schedule 2", modifiedAtISO: "2025-10-25T13:25:00", filler: "Playlist 1" },
  { id: "3", name: "Schedule 3", modifiedAtISO: "2025-10-25T15:25:00", filler: "Playlist 1" },
];

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).replace(" ", "");
  return `${date.replace(" ", " , ")} - ${time}`;
};

const ScheduleItem: React.FC = () => {
  const rows = useMemo(() => MOCK, []);
  const [filter] = useState<"today" | "thisWeek" | "all">("today");
  const [openWizard, setOpenWizard] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <section className="w-full mt-5 px-5">
        {/* Top bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
          <div className="flex w-full flex-wrap justify-between gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {filter === "today" && "Today Schedule's"}
              {filter === "thisWeek" && "This Week"}
              {filter === "all" && "All"}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setOpenWizard(true)}
              className="inline-flex items-center gap-2 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create New Schedule
            </button>
          </div>
        </div>

        {/* Table (desktop) */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-gray-50 text-sm text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Modified at</th>
                  <th className="px-4 py-3 font-medium">Filler Content</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {rows.map((r) => (
                  <tr key={r.id} className="group border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200 group-hover:ring-gray-300">
                        {r.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDateTime(r.modifiedAtISO)}</td>
                    <td className="px-4 py-3">{r.filler}</td>
                    <td className="px-3 py-3">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          className="rounded-full p-2 hover:bg-gray-100"
                          onClick={() => setOpenMenu((p) => (p === r.id ? null : r.id))}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                        {openMenu === r.id && (
                          <div
                            className="absolute right-2 top-9 z-10 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
                            onMouseLeave={() => setOpenMenu(null)}
                          >
                            <button className="block w-full px-3 py-2 text-left hover:bg-gray-50">Open</button>
                            <button className="block w-full px-3 py-2 text-left hover:bg-gray-50">Duplicate</button>
                            <button className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards (mobile) */}
        <div className="grid gap-2 md:hidden">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{r.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{fmtDateTime(r.modifiedAtISO)}</div>
                  <div className="mt-2 inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200">
                    {r.filler}
                  </div>
                </div>
                <button className="rounded-full p-2 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wizard modal */}
      <SelectScreenModal
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        onConfirmNavigate={() => {
          setOpenWizard(false);
          navigate("/calender");
        }}
      />
    </>
  );
};

export default ScheduleItem;
