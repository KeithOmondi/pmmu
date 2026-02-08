import { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { 
  selectRejectedEvidence, 
  fetchUserIndicators,
  type IEvidence 
} from "../../store/slices/indicatorsSlice";
import { 
  FileText, 
  History, 
  Loader2, 
  RefreshCcw, 
  Clock,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import EvidencePreviewModal from "./EvidencePreviewModal";

interface IRejectedEvidence extends IEvidence {
  indicatorId: string;
  indicatorTitle: string;
  resubmissionAttempt: number;
  updatedAt?: string;
  updatedBy?: string; // Name of the admin who rejected
}

const UserRejectionsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const rawRejected = useAppSelector(selectRejectedEvidence) as IRejectedEvidence[];
  const loading = useAppSelector((state) => state.indicators.loading);
  
  const [previewFile, setPreviewFile] = useState<IRejectedEvidence | null>(null);

  useEffect(() => {
    dispatch(fetchUserIndicators());
  }, [dispatch]);

  const groupedArchives = useMemo(() => {
    const groups: Record<string, { 
      title: string; 
      files: IRejectedEvidence[]; 
      lastRejected: string;
      rejectedBy: string;
      attempts: number;
    }> = {};

    rawRejected.forEach((file) => {
      if (!groups[file.indicatorId]) {
        groups[file.indicatorId] = {
          title: file.indicatorTitle,
          files: [],
          attempts: file.resubmissionAttempt || 1,
          lastRejected: file.updatedAt || new Date().toISOString(),
          rejectedBy: file.updatedBy || "System Admin" // Fallback name
        };
      }
      groups[file.indicatorId].files.push(file);
    });

    return Object.entries(groups).map(([id, data]) => ({ id, ...data }));
  }, [rawRejected]);

  const handleRefresh = () => {
    dispatch(fetchUserIndicators());
  };

  if (loading && rawRejected.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-[#C69214]" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12 space-y-8">
        
        <header className="flex justify-between items-end border-b border-gray-200 pb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold flex items-center gap-3 text-[#1E3A2B]">
              <History size={28} className="text-[#C69214]" /> Revision Archive
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Audit trail of rejected submissions
            </p>
          </div>
          <button onClick={handleRefresh} className="p-3 text-gray-400 hover:text-[#C69214] transition-colors">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {groupedArchives.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
             <p className="text-sm font-serif italic text-gray-400">No archived records found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedArchives.map((group) => (
              <div key={group.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                
                {/* Header: Detailed Metadata */}
                <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase rounded">
                        Attempt #{group.attempts}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                        <Clock size={12} className="text-[#C69214]" />
                        {format(new Date(group.lastRejected), "MMM dd, yyyy • hh:mm a")}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase border-l border-gray-200 pl-3">
                        <UserCheck size={12} className="text-[#C69214]" />
                        Rejected By: <span className="text-[#1E3A2B]">{group.rejectedBy}</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-[#1E3A2B] leading-tight">
                      {group.title}
                    </h2>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/user/indicators/${group.id}`)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-white bg-[#1E3A2B] px-5 py-3 rounded-xl hover:bg-[#C69214] transition-all shadow-md active:scale-95"
                  >
                    Resubmit Now <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* File List Section */}
                <div className="p-6 md:p-8">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <FileText size={12} /> Files in this rejected batch
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {group.files.map((file, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group hover:border-[#C69214]/50 hover:shadow-sm transition-all">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-[#1E3A2B] transition-colors">
                             <FileText size={18} />
                           </div>
                           <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 truncate">{file.fileName}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-medium">{file.format}</span>
                           </div>
                         </div>
                         <button 
                           onClick={() => setPreviewFile(file)}
                           className="text-[10px] font-black text-[#C69214] uppercase bg-[#C69214]/5 px-3 py-1.5 rounded-lg hover:bg-[#C69214] hover:text-white transition-all"
                         >
                           Inspect
                         </button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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