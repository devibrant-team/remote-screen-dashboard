//RatioSelectors.ts

import type { RootState } from "../../../../store";

// convenient selectors so UI code is clean
export const selectRatioNums = (s: RootState) => {
  const n = s.playlist.selectedRatio?.numerator ?? 16;
  const d = s.playlist.selectedRatio?.denominator ?? 9;
  return { n, d };
};

export const selectRatioString = (s: RootState) => {
  const r = s.playlist.selectedRatio;
  return r ? `${r.numerator}:${r.denominator}` : "16:9";
};
