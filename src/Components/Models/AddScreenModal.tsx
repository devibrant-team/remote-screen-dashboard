// AddScreenModal.tsx
import React, { useMemo, useState } from "react";

const PRESET_RATIOS = ["unassigned", "16:9", "9:16", "4:3"];
const PRESET_BRANCHES = ["Downtown Branch", "Uptown Branch"];
const PRESET_GROUPS = ["No Group", "Promo", "Menu"];

const AddScreenModal: React.FC = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // ratio mode: preset value OR "custom"
  const [ratioSelect, setRatioSelect] = useState<string>(PRESET_RATIOS[0]); // or "custom"
  const [ratioNum, setRatioNum] = useState<string>(""); // numerator
  const [ratioDen, setRatioDen] = useState<string>(""); // denominator

  // optional exact size
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");

  const [branch, setBranch] = useState(PRESET_BRANCHES[0]);
  const [group, setGroup] = useState(PRESET_GROUPS[0]);

  const usingCustom = ratioSelect === "custom";

  const ratioError =
    usingCustom &&
    ((ratioNum && !ratioDen) || (!ratioNum && ratioDen) || Number(ratioNum) <= 0 || Number(ratioDen) <= 0)
      ? "Enter positive numbers for both fields, or choose a preset."
      : null;

  const finalRatio = useMemo(() => {
    if (!usingCustom) return ratioSelect; // preset like "16:9" or "unassigned"
    const n = parseInt(ratioNum, 10);
    const d = parseInt(ratioDen, 10);
    if (!Number.isFinite(n) || !Number.isFinite(d) || n <= 0 || d <= 0) return "";
    return `${n}:${d}`;
  }, [usingCustom, ratioSelect, ratioNum, ratioDen]);

  const sizeProvided =
    width.trim().length > 0 && height.trim().length > 0 && Number(width) > 0 && Number(height) > 0;

  const canConfirm =
    name.trim().length > 0 &&
    branch.trim().length > 0 &&
    group.trim().length > 0 &&
    !ratioError &&
    (finalRatio === "unassigned" || finalRatio.includes(":")); // preset or valid custom

  const handleConfirm = () => {
    if (!canConfirm) return;

    const payload: {
      name: string;
      code?: string;
      ratio: string; // "unassigned" or "N:D"
      branch: string;
      group: string;
      width?: number;
      height?: number;
    } = {
      name: name.trim(),
      code: code.trim() || undefined,
      ratio: finalRatio || "unassigned",
      branch,
      group,
    };

    if (sizeProvided) {
      payload.width = Number(width);
      payload.height = Number(height);
    }

    // TODO: API/Redux save
    console.log("Create Screen:", payload);

    // reset
    setName("");
    setCode("");
    setRatioSelect(PRESET_RATIOS[0]);
    setRatioNum("");
    setRatioDen("");
    setWidth("");
    setHeight("");
    setBranch(PRESET_BRANCHES[0]);
    setGroup(PRESET_GROUPS[0]);

    // Optionally close parent modal via event:
    // window.dispatchEvent(new CustomEvent("close-base-modal"));
  };

  return (
    <div className="w-full">

      <hr className="mb-4 border-neutral-200" />

      <div className="space-y-4">
        {/* Screen Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Screen Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Front Window TV"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        {/* Code (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Code (optional)</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Internal code"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        {/* Ratio: preset or custom */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Screen Ratio</label>
          <select
            value={ratioSelect}
            onChange={(e) => setRatioSelect(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            {PRESET_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="custom">Custom…</option>
          </select>

          {usingCustom && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={ratioNum}
                onChange={(e) => setRatioNum(e.target.value)}
                placeholder="16"
                className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <span className="text-neutral-500">:</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={ratioDen}
                onChange={(e) => setRatioDen(e.target.value)}
                placeholder="9"
                className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          )}

          {ratioError && <p className="mt-1 text-xs text-red-600">{ratioError}</p>}
          {!ratioError && finalRatio && finalRatio !== "unassigned" && (
            <p className="mt-1 text-xs text-neutral-500">Final ratio: {finalRatio}</p>
          )}
        </div>

        {/* Exact Size (optional) */}
        {usingCustom && (

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Exact Size (optional)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="Width (px)"
              className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Height (px)"
              className="w-1/2 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          {((width && !height) || (!width && height)) && (
            <p className="mt-1 text-xs text-red-600">Provide both width and height, or leave both empty.</p>
          )}
        </div>
        )}

        {/* Branch */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            {PRESET_BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Group */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Assign to Group</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            {PRESET_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="my-4 border-neutral-200" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            // window.dispatchEvent(new CustomEvent("close-base-modal"));
          }}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default AddScreenModal;
