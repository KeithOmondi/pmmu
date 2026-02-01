import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  approveIndicator,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  CheckCircle2,
  Gavel,
  X,
  FileText,
  Lock,
  ChevronRight,
  Archive,
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
    if (isOpen) dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch, isOpen]);

  const filteredItems = useMemo(() => 
    indicators.filter(i => i.status === "approved" || i.status === "completed"),
    [indicators]
  );

  const stats = useMemo(() => ({
    pending: filteredItems.filter(i => i.status === "approved").length,
    done: filteredItems.filter(i => i.status === "completed").length
  }), [filteredItems]);

  const handleRatify = async (indicator: IIndicator) => {
    if (indicator.status === "completed") return;
    try {
      setProcessingId(indicator._id);
      await dispatch(approveIndicator({ id: indicator._id, notes: "SuperAdmin Final Ratification" })).unwrap();
      toast.success("Registry Entry Sealed");
    } catch (err) {
      toast.error("Ratification Failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0a1a16]/80 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

      <div className="relative bg-[#fcfcfc] w-full max-w-6xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* JUDICIAL SIDEBAR */}
        <aside className="w-full md:w-72 bg-[#1a3a32] p-8 text-white flex flex-col shrink-0">
          <div className="mb-12">
            <div className="w-14 h-14 bg-[#c2a336] rounded-2xl flex items-center justify-center text-[#1a3a32] shadow-xl mb-4">
              <Gavel size={28} />
            </div>
            <h2 className="text-xl font-serif font-bold leading-tight">Registry Authorization</h2>
            <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-widest mt-2">Executive Chamber</p>
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-white/40 uppercase mb-1">Awaiting Seal</p>
              <p className="text-3xl font-serif font-bold text-[#c2a336]">{stats.pending}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-white/40 uppercase mb-1">Finalized</p>
              <p className="text-3xl font-serif font-bold text-emerald-400">{stats.done}</p>
            </div>
          </div>

          <button onClick={onClose} className="mt-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-tighter">
            <X size={16} /> Close Registry
          </button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <header className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-serif font-black text-[#1a3a32]">Master Ledger Ratification</h3>
              <p className="text-slate-400 text-xs font-medium">Seal approved indicators into the permanent archive.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black text-slate-500 uppercase">Secure Link Active</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3a32] mb-2" />
                <span className="text-[10px] font-black uppercase">Decrypting Ledger...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Archive size={64} strokeWidth={1} />
                <p className="mt-4 font-bold text-slate-400">Registry is currently up to date.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item._id} className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#c2a336]/40 transition-all shadow-sm hover:shadow-md">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                          item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status === 'completed' ? 'Finalized' : 'Action Required'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">#{item._id.slice(-8).toUpperCase()}</span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-[#1a3a32] group-hover:text-[#c2a336] transition-colors">
                        {item.indicatorTitle}
                      </h4>

                      <div className="flex flex-wrap gap-2">
                        {item.evidence.map((file) => (
                          <div key={file.publicId} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-white hover:border-[#c2a336] transition-all cursor-pointer">
                            <FileText size={12} className="text-[#c2a336]" />
                            <span className="truncate max-w-[120px]">{file.fileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <button
                        disabled={!!processingId || item.status === 'completed'}
                        onClick={() => handleRatify(item)}
                        className={`w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                          item.status === 'completed' 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-[#1a3a32] text-white hover:bg-[#2a5a4d] shadow-[#1a3a32]/20'
                        }`}
                      >
                        {processingId === item._id ? <Loader2 size={16} className="animate-spin" /> : item.status === 'completed' ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                        {item.status === 'completed' ? "Protocol Sealed" : "Ratify Entry"}
                        {item.status !== 'completed' && <ChevronRight size={14} className="ml-2" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminApprovedModal;