// src/pages/SuperAdmin/SuperAdminApprovedModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  updateIndicator,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Gavel,
  X,
  ArrowRight,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/* ... existing imports ... */

const SuperAdminApprovedModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);

  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllIndicatorsForAdmin());
    }
  }, [dispatch, isOpen]);

  const pendingRatification = useMemo(
    () =>
      indicators.filter(
        (indicator) =>
          indicator.status === "approved" ||
          indicator.status === "completed"
      ),
    [indicators]
  );

  const isCompleted = (indicator: IIndicator) =>
    indicator.status === "completed";

  // 🟢 FIXED: Using previewUrl instead of a missing download action
  const handleViewFile = (previewUrl: string) => {
    if (!previewUrl) {
      toast.error("No preview URL available");
      return;
    }
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleRatify = async (indicator: IIndicator) => {
    if (isCompleted(indicator)) return;

    try {
      setProcessingId(indicator._id);
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: { status: "completed" },
        })
      ).unwrap();

      toast.success("Protocol Ratified & Locked");
      // Refresh list to show updated status
      dispatch(fetchAllIndicatorsForAdmin());
    } catch {
      toast.error("Registry Sync Failure");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="shrink-0 px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-[#c2a336] shadow-lg shadow-[#1a3a32]/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase tracking-[0.2em] text-[9px]">
                <Gavel size={12} />
                SuperAdmin Authority
              </div>
              <h3 className="text-2xl font-black text-[#1a3a32] tracking-tighter">
                Final Ratification
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-[#c2a336] mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Querying Master Registry...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingRatification.map((indicator) => (
                <div key={indicator._id} className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                  {isCompleted(indicator) && (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase">
                      Completed
                    </span>
                  )}

                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase bg-emerald-50 text-emerald-600">
                          {indicator.status === "completed" ? "Protocol Locked" : "Submission Approved"}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#1a3a32] mb-4">{indicator.indicatorTitle}</h4>

                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] font-black text-[#c2a336] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <FileText size={12} />
                          Verified Evidence ({indicator.evidence.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {indicator.evidence.map((file) => (
                            <button
                              key={file.publicId}
                              onClick={() => handleViewFile(file.previewUrl)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:border-[#c2a336] hover:text-[#c2a336] transition-all"
                            >
                              <FileText size={12} />
                              <span className="max-w-[150px] truncate">{file.fileName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 self-end lg:self-center">
                      <button
                        disabled={!!processingId || isCompleted(indicator)}
                        onClick={() => handleRatify(indicator)}
                        className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase text-white bg-[#1a3a32] hover:bg-[#c2a336] shadow-lg transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {processingId === indicator._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {isCompleted(indicator) ? "Ratified" : "Ratify Indicator"}
                        {!isCompleted(indicator) && <ArrowRight size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminApprovedModal;
