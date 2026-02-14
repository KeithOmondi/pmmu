import { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { 
  fetchUserIndicators,
  fetchSubmittedIndicators,
  selectAllIndicators,
  selectUserIndicators,
  selectSubmittedIndicators,
  selectIndicatorsLoading,
  type IIndicator,
  type IEvidence 
} from "../../store/slices/indicatorsSlice";
import { 
  FileText, 
  History, 
  Loader2, 
  RefreshCcw,
  ArrowUpRight,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  MessageSquare,
  Search,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EvidencePreviewModal from "./EvidencePreviewModal";

/* =====================================================
   TYPES
===================================================== */
interface IRejectedEntry extends IEvidence {
  indicatorId: string;
  indicatorTitle: string;
}

const UserRejectionsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Redux Selectors
  const allInd = useAppSelector(selectAllIndicators);
  const userInd = useAppSelector(selectUserIndicators);
  const subInd = useAppSelector(selectSubmittedIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  
  // Local State
  const [previewFile, setPreviewFile] = useState<IRejectedEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchUserIndicators());
    dispatch(fetchSubmittedIndicators());
  }, [dispatch]);

  /* =====================================================
     LOGIC: GROUPING REJECTED INDICATORS
  ===================================================== */
  const groupedRejections = useMemo(() => {
    // Combine all potential state sources and deduplicate
    const combined = [...allInd, ...userInd, ...subInd];
    const uniqueMap = new Map<string, IIndicator>();
    combined.forEach(item => uniqueMap.set(item._id, item));

    const groups: Record<string, { 
      title: string; 
      files: IRejectedEntry[]; 
      attempts: number;
      lastFeedback: string;
    }> = {};

    uniqueMap.forEach((ind) => {
      // Logic: Only show if indicator is explicitly in rejected status
      if (ind.status === "rejected") {
        // We show ALL evidence for a rejected indicator so nothing is hidden
        const relevantEvidence = ind.evidence || [];

        const latestNote = ind.notes && ind.notes.length > 0 
          ? ind.notes[ind.notes.length - 1].text 
          : "Reviewer provided no specific comments.";

        groups[ind._id] = {
          title: ind.indicatorTitle,
          attempts: ind.rejectionCount || 1,
          lastFeedback: latestNote,
          files: relevantEvidence.map(e => ({
            ...e,
            indicatorId: ind._id,
            indicatorTitle: ind.indicatorTitle
          }))
        };
      }
    });

    return Object.entries(groups)
      .map(([id, data]) => ({ id, ...data }))
      .filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allInd, userInd, subInd, searchTerm]);

  const handleRefresh = () => {
    dispatch(fetchUserIndicators());
    dispatch(fetchSubmittedIndicators());
  };

  if (loading && groupedRejections.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-[#EFBF04]" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <div className="max-w-5xl mx-auto px-6 pt-12 space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#355E3B]/10 pb-10 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#EFBF04] font-black text-[10px] uppercase tracking-[0.25em]">
              <ShieldAlert size={14} /> Compliance Hub
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#355E3B] flex items-center gap-3">
              <History size={32} /> Revision Archive
            </h1>
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
              Access your previously flagged submissions. Inspect the evidence and reviewer notes before rectifying the records.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#355E3B]/20 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={handleRefresh}
              className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-[#355E3B] transition-all"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* LISTING */}
        {groupedRejections.length === 0 ? (
          <div className="bg-white rounded-[3rem] py-32 text-center border border-dashed border-slate-200 shadow-sm">
             <UserCheck size={48} className="mx-auto text-slate-200 mb-6" />
             <h3 className="text-[#355E3B] font-bold text-xl">Registry Clear</h3>
             <p className="text-sm italic text-slate-400">No rejected indicators found.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedRejections.map((group) => (
              <section key={group.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                
                {/* INDICATOR HEADER */}
                <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/40">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                    <div className="space-y-3 flex-1">
                      <span className="inline-block px-4 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full">
                        Round #{group.attempts}
                      </span>
                      <h2 className="text-3xl font-bold text-[#355E3B] leading-tight">
                        {group.title}
                      </h2>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/user/indicators/${group.id}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 text-[11px] font-black uppercase text-white bg-[#355E3B] px-8 py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg active:scale-95"
                    >
                      Rectify Submission <ArrowUpRight size={16} />
                    </button>
                  </div>

                  {/* FEEDBACK */}
                  <div className="flex gap-5 p-6 bg-white border border-red-100 rounded-[2rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                    <MessageSquare size={20} className="text-red-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviewer Feedback</h4>
                      <p className="text-base text-slate-700 font-serif italic">"{group.lastFeedback}"</p>
                    </div>
                  </div>
                </div>

                {/* EVIDENCE SECTION */}
                <div className="p-8 md:p-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <AlertCircle size={14} className="text-[#EFBF04]" /> Attached Exhibits
                   </p>
                   
                   {group.files.length === 0 ? (
                     <p className="text-xs text-slate-400 italic p-6 border-2 border-dashed border-slate-50 rounded-2xl text-center">
                        No files currently associated with this record.
                     </p>
                   ) : (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                       {group.files.map((file) => (
                         <div key={file._id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-[#EFBF04]/40 hover:bg-white transition-all group">
                           <div className="flex items-center gap-4 overflow-hidden">
                             <div className="p-3 bg-white rounded-2xl text-[#355E3B] shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                               <FileText size={20} />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-800 truncate">{file.fileName || "Exhibit"}</span>
                                <span className="text-[10px] text-slate-400 font-black uppercase">
                                  {file.format || "File"} • {(file.fileSize / 1024).toFixed(1)} KB
                                </span>
                             </div>
                           </div>
                           
                           {/* THE INSPECT BUTTON */}
                           <button 
                             type="button"
                             onClick={() => {
                               console.log("Viewing File ID:", file._id);
                               setPreviewFile(file);
                             }}
                             className="shrink-0 ml-4 flex items-center gap-2 text-[10px] font-black text-[#355E3B] uppercase bg-white border border-slate-200 hover:bg-[#355E3B] hover:text-white px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95"
                           >
                             <Eye size={14} /> Inspect
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {previewFile && (
        <EvidencePreviewModal
          file={previewFile}
          indicatorId={previewFile.indicatorId}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default UserRejectionsPage;