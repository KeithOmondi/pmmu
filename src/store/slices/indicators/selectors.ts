import type { RootState } from "../../store";

/* =====================================================
   INDICATOR SELECTORS
===================================================== */

export const selectUserIndicators = (s: RootState) =>
  s.indicators.userIndicators;

export const selectAllIndicators = (s: RootState) =>
  s.indicators.allIndicators;

export const selectSubmittedIndicators = (s: RootState) =>
  s.indicators.submittedIndicators;

export const selectIndicatorsLoading = (s: RootState) =>
  s.indicators.loading;

export const selectIndicatorsError = (s: RootState) =>
  s.indicators.error;
