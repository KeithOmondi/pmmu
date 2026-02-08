import type { IIndicator } from "./types";

/* =====================================================
   NORMALIZERS
===================================================== */

export const normalizeIndicator = (raw: any): IIndicator => ({
  ...raw,

  indicatorTitle: raw.indicatorTitle ?? "",

  // Flatten populated refs → ids
  assignedTo: raw.assignedTo?._id ?? raw.assignedTo ?? null,

  assignedGroup: Array.isArray(raw.assignedGroup)
    ? raw.assignedGroup.map((g: any) => g._id ?? g)
    : [],

  notes: (raw.notes || []).map((n: any) => ({
    ...n,
    createdBy: n.createdBy?._id ?? n.createdBy ?? null,
  })),

  evidence: (raw.evidence || []).map((e: any) => ({
    ...e,
    type: "file",
  })),
});
