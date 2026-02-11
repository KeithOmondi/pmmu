import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  approveIndicator,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import { submitIndicatorScore } from "../../store/slices/scoreSlice";
import {
  Loader2,
  CheckCircle2,
  Gavel,
  X,
  FileText,
  Lock,
  Archive,
  ShieldCheck,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/* =======================================================
   PREVIEW MODAL
======================================================= */
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[2001] bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 flex flex-col items-center gap-4">
        <h3 className="font-bold text-lg">{fileName}</h3>
        <img
          src={fileUrl}
          alt={fileName}
          className="max-h-[70vh] w-auto object-contain"
        />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white font-bold"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
};

/* =======================================================
   SUPER ADMIN APPROVED MODAL
======================================================= */
const SuperAdminApprovedModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);

  const [processingId, setProcessingId] = useState<string | null>(null);
  // Track custom scores locally before submission
  const [customScores, setCustomScores] = useState<{ [key: string]: number }>(
    {},
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");

  useEffect(() => {
    if (isOpen) dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch, isOpen]);

  // Initialize scores with current indicator progress when data loads
  useEffect(() => {
    const initialScores: { [key: string]: number } = {};
    indicators.forEach((item) => {
      initialScores[item._id] = item.progress || 0;
    });
    setCustomScores(initialScores);
  }, [indicators]);

  const filteredItems = useMemo(
    () =>
      indicators.filter(
        (i) => i.status === "approved" || i.status === "completed",
      ),
    [indicators],
  );

  const stats = useMemo(
    () => ({
      pending: filteredItems.filter((i) => i.status === "approved").length,
      done: filteredItems.filter((i) => i.status === "completed").length,
    }),
    [filteredItems],
  );

  const handleScoreChange = (id: string, val: string) => {
    const numericVal = Math.min(100, Math.max(0, Number(val)));
    setCustomScores((prev) => ({ ...prev, [id]: numericVal }));
  };

  const handleRatify = async (indicator: IIndicator) => {
    if (indicator.status === "completed") return;
    const finalScore = customScores[indicator._id] ?? indicator.progress;

    try {
      setProcessingId(indicator._id);

      // 1. Submit the score chosen by the Super Admin
      await dispatch(
        submitIndicatorScore({
          indicatorId: indicator._id,
          score: finalScore,
        }),
      ).unwrap();

      // 2. Ratify the entry
      await dispatch(
        approveIndicator({
          id: indicator._id,
          notes: `SuperAdmin Ratified with manual score: ${finalScore}%`,
        }),
      ).unwrap();

      toast.success("Registry Sealed with Custom Score");
    } catch (err: any) {
      toast.error(err || "Ratification Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const openPreview = (fileName: string, fileUrl: string) => {
    setPreviewName(fileName);
    setPreviewUrl(fileUrl);
    setPreviewOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
        <div
          className="absolute inset-0 bg-[#0a1a16]/85 backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        />

        <div className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
          {/* LEFT PANEL */}
          <aside className="w-full md:w-64 bg-[#1a3a32] p-6 text-white flex flex-col shrink-0">
            <div className="mb-8">
              <div className="w-12 h-12 bg-[#c2a336] rounded-xl flex items-center justify-center text-[#1a3a32] shadow-lg mb-4">
                <Gavel size={24} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                Registry Authorization
              </h2>
              <p className="text-[#c2a336] text-[9px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">
                Executive Chamber
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Awaiting Seal
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-[#c2a336]">
                    {stats.pending}
                  </p>
                  <ShieldCheck size={16} className="text-white/20 mb-1" />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Finalized
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-emerald-400">
                    {stats.done}
                  </p>
                  <Lock size={16} className="text-white/20 mb-1" />
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <X size={14} /> Close Registry
            </button>
          </aside>

          {/* RIGHT PANEL */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
            <header className="px-8 py-6 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="text-xl font-bold text-[#1a3a32]">
                Master Ledger Ratification
              </h3>
              <p className="text-slate-400 text-[11px] font-medium">
                Verify evidence and assign the final performance score.
              </p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#c2a336] mb-3" />
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Synchronizing Registry...
                  </span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <Archive size={40} className="mb-4" />
                  <p className="font-bold text-sm">
                    No items pending ratification.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const activeEvidence = item.evidence.filter(
                    (f) => !(f as any).isArchived,
                  );
                  const isCompleted = item.status === "completed";

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:border-[#c2a336]/30 group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Info Section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isCompleted
                                ? "Finalized"
                                : "Pending Ratification"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#1a3a32] truncate group-hover:text-[#c2a336] transition-colors">
                            {item.indicatorTitle}
                          </h4>

                          {/* Evidence Preview */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {activeEvidence.length > 0 ? (
                              activeEvidence.slice(0, 3).map((file) => (
                                <div
                                  key={
                                    (file as any)._id || (file as any).publicId
                                  }
                                  onClick={() =>
                                    openPreview(
                                      (file as any).fileName,
                                      (file as any).previewUrl,
                                    )
                                  }
                                  className="cursor-pointer flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 hover:bg-slate-100"
                                >
                                  <FileText
                                    size={10}
                                    className="text-[#c2a336]"
                                  />
                                  <span className="max-w-[80px] truncate">
                                    {(file as any).fileName}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-rose-400 font-bold italic">
                                No active evidence
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Scoring & Action Section */}
                        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              Assigned Score (%)
                            </label>
                            <div className="relative">
                              <Target
                                size={12}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#c2a336]"
                              />
                              <input
                                type="number"
                                disabled={
                                  isCompleted || processingId === item._id
                                }
                                value={customScores[item._id] ?? ""}
                                onChange={(e) =>
                                  handleScoreChange(item._id, e.target.value)
                                }
                                className="w-24 pl-8 pr-2 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c2a336] focus:border-transparent outline-none disabled:bg-transparent disabled:border-none"
                              />
                            </div>
                          </div>

                          <button
                            disabled={!!processingId || isCompleted}
                            onClick={() => handleRatify(item)}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              isCompleted
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-[#1a3a32] text-white hover:bg-[#c2a336] hover:text-[#1a3a32] shadow-md active:scale-95"
                            }`}
                          >
                            {processingId === item._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isCompleted ? (
                              <Lock size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            {isCompleted ? "Sealed" : "Ratify & Archive"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>

      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileUrl={previewUrl}
        fileName={previewName}
      />
    </>
  );
};

export default SuperAdminApprovedModal;
