import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, CheckCircle2, FileText, 
  History, Eye, ShieldCheck, 
  BadgeInfo, Hash, Info, XCircle, Clock
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  selectAllIndicators, 
  approveIndicator, 
  rejectIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { selectAllUsers, fetchUsers } from "../../store/slices/userSlice";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SuperAdminIndicatorsIdPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // --- STATE ---
  const allIndicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);
  const [reviewNote, setReviewNote] = useState("");
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IEvidence | null>(null);

  const indicator = useMemo(() => 
    allIndicators.find((ind) => ind._id === id), 
  [allIndicators, id]);

  useEffect(() => {
    if (users.length === 0) dispatch(fetchUsers());
  }, [dispatch, users.length]);

  const assignee = useMemo(() => {
    if (!indicator) return null;
    const userId = typeof indicator.assignedTo === 'string' 
      ? indicator.assignedTo 
      : (indicator.assignedTo as any)?._id;
    return users.find((u) => u._id === userId);
  }, [indicator, users]);

  // --- HANDLERS ---
  const handleOpenPreview = (file: IEvidence) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleApprove = async () => {
    if (!indicator) return;
    const confirmMsg = indicator.status === "approved" 
      ? "Update approval notes for this metric?" 
      : "Perform final validation and seal this metric in the registry?";
    
    if (!window.confirm(confirmMsg)) return;
    await dispatch(approveIndicator({ id: indicator._id, notes: reviewNote }));
    setReviewNote(""); 
    navigate(-1);
  };

  const handleReject = async () => {
    if (!indicator) return;
    if (!reviewNote.trim()) {
      alert("Operational Requirement: Please provide a reason for rejection in the notes field.");
      return;
    }
    if (!window.confirm("Reject this submission and return to officer for correction?")) return;
    await dispatch(rejectIndicator({ id: indicator._id, notes: reviewNote }));
    setReviewNote("");
    navigate(-1);
  };

  if (!indicator) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100">
          <p className="font-black uppercase tracking-[0.3em] text-slate-300 mb-6 text-sm">Registry Missing</p>
          <button onClick={() => navigate(-1)} className="bg-[#1a1a1a] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
            <ArrowLeft size={18} /> Return to Command
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIC STATES ---
  const canModify = indicator.status === "submitted" || indicator.status === "approved" || indicator.status === "completed";
  const isRejected = indicator.status === "rejected";
  const isPendingUser = indicator.status === "pending" || indicator.status === "partially_completed";

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20 font-sans">
      {/* --- TOP BAR --- */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
            <div className="p-2 rounded-full group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to List</span>
          </button>

          <div className="flex items-center gap-4">
            {(indicator.status === "approved" || indicator.status === "completed") && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Registry Sealed</span>
              </div>
            )}
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
            <div className="text-right">
              <p className="text-[9px] font-black text-[#EFBF04] uppercase tracking-[0.2em]">Final Authority Review</p>
              <h1 className="font-bold text-slate-900 truncate max-w-[300px]">{indicator.indicatorTitle}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- LEFT COLUMN: CORE DATA --- */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Info size={120} />
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Measurement Unit</p>
                <div className="flex items-center gap-2 text-[#355E3B] font-bold text-lg">
                  <Hash size={18} className="text-[#EFBF04]" />
                  {indicator.unitOfMeasure}
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Deadline</p>
                <div className="flex items-center justify-end gap-2 text-slate-900 font-bold text-lg">
                  <Calendar size={18} className="text-[#EFBF04]" />
                  {new Date(indicator.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Division Assignment</p>
              <p className="text-slate-700 font-serif text-xl italic">
                "{indicator.category?.title || "General Performance Registry"}"
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
             <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#355E3B] text-white rounded-xl shadow-lg shadow-[#355E3B]/20">
                  <FileText size={18} />
                </div>
                Submitted Evidence
              </h3>
            {indicator.evidence.length === 0 ? (
              <div className="py-16 text-center border-4 border-dashed border-slate-50 rounded-[2rem] bg-slate-50/30">
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No documentation provided</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {indicator.evidence.map((file) => (
                  <div key={file._id} className="p-6 border border-slate-100 rounded-[2rem] hover:border-[#EFBF04] group bg-white transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText size={24} />
                        </div>
                        <div className="min-w-0 space-y-3">
                          <div>
                            <p className="text-xs font-black text-slate-900 truncate">{file.fileName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{file.format}</p>
                          </div>
                          {file.description && (
                            <div className="relative pl-4 border-l-2 border-slate-100">
                              <p className="text-[11px] text-slate-500 italic">{file.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleOpenPreview(file)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#355E3B] hover:text-white transition-all">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: AUTHORITY ACTIONS --- */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Reporting Officer</p>
            {assignee ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-[#355E3B] flex items-center justify-center text-white text-xl font-serif font-black overflow-hidden shrink-0">
                  {assignee.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{assignee.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">IDENTIFIED</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 text-[10px] font-bold uppercase flex items-center gap-2">
                <BadgeInfo size={14} /> Resolving...
              </div>
            )}
          </div>

          {canModify ? (
            <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldCheck size={80} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#EFBF04] mb-4">Authority Console</h3>
              
              {indicator.status === "approved" && (
                <div className="mb-6 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} /> Currently Approved
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                As Super Admin, you can update notes or revoke approval by rejecting the submission.
              </p>
              
              <textarea
                placeholder="Enter verification notes or rejection rationale..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-[#EFBF04]/50 transition-all min-h-[120px] placeholder:text-slate-600"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
              
              <div className="space-y-3">
                <button 
                  onClick={handleApprove} 
                  className="w-full py-5 bg-[#EFBF04] text-[#1a1a1a] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> 
                  {indicator.status === "approved" ? "Update Approval Notes" : "Finalize & Approve"}
                </button>
                <button 
                  onClick={handleReject} 
                  className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 hover:border-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Reject Submission
                </button>
              </div>
            </div>
          ) : isRejected ? (
            <div className="bg-rose-600 rounded-[2.5rem] p-8 shadow-2xl text-white flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <XCircle size={32} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Metric Rejected</h3>
              <p className="text-xs text-rose-100 opacity-80 italic">Awaiting corrections from the officer. Console will unlock upon resubmission.</p>
            </div>
          ) : isPendingUser ? (
             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Draft in Progress</h3>
              <p className="text-[11px] text-slate-400">Officer has not submitted this metric for review yet.</p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Status Unknown
            </div>
          )}

          {/* AUDIT TRAIL */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <History size={14} /> Audit Trail
            </h3>
            <div className="space-y-6">
              {indicator.notes.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">No entries recorded</div>
              ) : (
                indicator.notes.map((note, idx) => (
                  <div key={idx} className="relative pl-6 border-l border-slate-100 pb-2">
                    <div className="absolute -left-[4.5px] top-0 w-2 h-2 bg-slate-200 rounded-full" />
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-700 italic">"{note.text}"</p>
                  </div>
                )).reverse()
              )}
            </div>
          </div>
        </div>
      </div>

      {previewOpen && selectedFile && (
        <EvidencePreviewModal
          file={selectedFile}
          indicatorId={id!}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminIndicatorsIdPage;