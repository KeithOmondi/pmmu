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
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Gavel,
  Calendar,
  Users,
  X,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

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
    () => indicators.filter((i) => i.status === "approved"),
    [indicators]
  );

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);
      // If approved by SuperAdmin, we might set status to "completed" or "verified"
      // Adjust the status string based on your backend workflow
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: { status: approve ? "overdue" : "pending" } as any,
        })
      ).unwrap();

      toast.success(
        approve ? "Protocol Ratified & Locked" : "Returned to Department Review"
      );
    } catch (err) {
      toast.error("Registry Sync Failure");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header - Fixed */}
        <header className="shrink-0 px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-[#c2a336] shadow-lg shadow-[#1a3a32]/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase tracking-[0.2em] text-[9px]">
                <Gavel size={12} /> SuperAdmin Authority
              </div>
              <h3 className="text-2xl font-black text-[#1a3a32] tracking-tighter">
                Final Ratification{" "}
                <span className="text-slate-300 font-light ml-2">Registry</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Verification Queue
              </span>
              <span className="text-sm font-black text-[#1a3a32]">
                {pendingRatification.length} Indicators
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-[#c2a336] mb-4" />
              <p className="text-[10px] font-black text-[#1a3a32] uppercase tracking-[0.3em]">
                Querying Master Registry...
              </p>
            </div>
          ) : !pendingRatification.length ? (
            <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-xl font-black text-[#1a3a32] mb-2">
                Everything Verified
              </h4>
              <p className="text-sm text-slate-500 italic max-w-xs mx-auto">
                No pending indicators require final ratification at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRatification.map((indicator) => (
                <div
                  key={indicator._id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Status indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#c2a336]/20 group-hover:bg-[#c2a336] transition-colors" />

                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded uppercase tracking-tighter">
                          Dept Approved
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {indicator.unitOfMeasure}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#1a3a32] leading-tight mb-3">
                        {indicator.indicatorTitle}
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Users size={14} className="text-[#c2a336]" />
                          {indicator.assignedToType === "individual"
                            ? indicator.assignedTo
                            : "Departmental Group"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Calendar size={14} className="text-slate-400" />
                          Due:{" "}
                          {new Date(indicator.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Meta Architecture */}
                    <div className="hidden xl:block w-64 border-l border-slate-50 px-6">
                      <p className="text-[9px] font-black text-slate-300 uppercase mb-1">
                        Architecture
                      </p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">
                        {indicator.category?.title}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 italic truncate">
                        {indicator.level2Category?.title}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          window.open(`/indicators/${indicator._id}`, "_blank")
                        }
                        className="p-3 text-slate-400 hover:text-[#1a3a32] hover:bg-slate-100 rounded-2xl transition-all"
                        title="Audit Dossier"
                      >
                        <Eye size={20} />
                      </button>
                      <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden lg:block" />
                      <button
                        disabled={!!processingId}
                        onClick={() => handleReview(indicator, false)}
                        className="px-5 py-3 rounded-2xl text-[11px] font-black uppercase text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 flex items-center gap-2"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button
                        disabled={!!processingId}
                        onClick={() => handleReview(indicator, true)}
                        className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase text-white bg-[#1a3a32] hover:bg-[#c2a336] shadow-lg shadow-[#1a3a32]/20 transition-all flex items-center gap-2 group/btn"
                      >
                        {processingId === indicator._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Ratify{" "}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <footer className="shrink-0 px-8 py-4 bg-white border-t border-slate-100 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            Secure SuperAdmin Session • {new Date().toLocaleDateString()}
          </p>
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
              Operational
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#c2a336]" /> Encrypted
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminApprovedModal;
