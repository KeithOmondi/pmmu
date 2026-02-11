import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  approveIndicator,
  rejectIndicator,
  updateIndicator,
  type IIndicator,
  type IEvidence,
  type UpdateIndicatorPayload,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import {
  submitIndicatorScore,
  resetScoreState,
} from "../../store/slices/scoreSlice";
import {
  Loader2, User as UserIcon, Users as GroupIcon, Calendar, ChevronLeft,
  XCircle, FileText, AlertTriangle, ShieldCheck, Eye, Gavel,
  History, Save, Edit3, MessageSquare, Clock, Target, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector((state) => state.indicators.allIndicators);
  const users = useAppSelector(selectAllUsers);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const indicator = useMemo(() => indicators.find((i) => i._id === id), [indicators, id]);
  const isSuperAdmin = currentUser?.role?.toLowerCase() === "superadmin";

  // Check if the record is already "Sealed" (completed)
  const isFinalized = useMemo(() => indicator?.status === "completed", [indicator]);

  const lastAdminNote = useMemo(() => {
    if (!indicator || !indicator.notes || indicator.notes.length === 0) return null;
    return indicator.notes[indicator.notes.length - 1];
  }, [indicator]);

  const submissionTimeInfo = useMemo(() => {
    if (!indicator) return null;
    return {
      submittedAt: new Date(indicator.createdAt).toLocaleString(),
      lastModified: new Date(indicator.updatedAt).toLocaleString(),
      isResubmitted: indicator.rejectionCount > 0
    };
  }, [indicator]);

  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedScore, setSelectedScore] = useState(0);
  const [editingFile, setEditingFile] = useState<IEvidence | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([dispatch(fetchAllIndicatorsForAdmin()), dispatch(fetchUsers())]);
      setLoading(false);
    };
    init();
    return () => { dispatch(resetScoreState()); };
  }, [dispatch]);

  // Sync the local slider score with the indicator's progress on load
  useEffect(() => {
    if (indicator) {
      setSelectedScore(indicator.progress);
    }
  }, [indicator?._id, indicator?.progress]);

  const handleUpdateEvidenceDescription = async () => {
    if (!indicator || !editingFile) return;
    const updatedEvidence = indicator.evidence.map((ev) =>
      ev._id === editingFile._id ? { ...ev, description: editDescription } : ev
    );
    const payload: UpdateIndicatorPayload = {
      id: indicator._id,
      updates: { evidence: updatedEvidence } as Partial<IIndicator>,
    };
    setIsUpdating(true);
    try {
      await dispatch(updateIndicator(payload)).unwrap();
      toast.success("Exhibit annotation updated.");
      setEditingFile(null);
    } catch (err: any) {
      toast.error(err || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!indicator || isFinalized) return;
    
    // Prevent Standard Admin from approving if it's already "approved" (Pending Super Admin)
    if (!isSuperAdmin && indicator.status === "approved") {
      toast.error("This record is already verified. Awaiting Super Admin certification.");
      return;
    }

    try {
      setIsUpdating(true);
      
      if (isSuperAdmin) {
        // 1. Super Admin dispatches the final manual performance score
        await dispatch(submitIndicatorScore({ 
          indicatorId: indicator._id, 
          score: selectedScore 
        })).unwrap();

        // 2. Super Admin sets status to 'completed' (Sealed)
        await dispatch(updateIndicator({
            id: indicator._id,
            updates: {
                status: "completed",
                reviewedAt: new Date().toISOString()
            }
        })).unwrap();
        toast.success(`Record Certified & Sealed at ${selectedScore}%`);
      } else {
        // Standard Admin move status to 'approved' (Awaiting Super Admin)
        await dispatch(approveIndicator({ 
          id: indicator._id, 
          notes: "Exhibits verified by Admin. Forwarded for Super Admin certification." 
        })).unwrap();
        toast.success("Exhibits Approved. Pending final score assignment.");
      }

      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Action failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!indicator || !rejectReason.trim()) return toast.error("Justification required.");
    try {
      setIsUpdating(true);
      await dispatch(rejectIndicator({ id: indicator._id, notes: rejectReason.trim() })).unwrap();
      toast.success("Returned for revision.");
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Failed to reject.");
    } finally {
      setIsUpdating(false);
      setShowRejectModal(false);
    }
  };

  const custodians = useMemo(() => {
    if (!indicator) return "-";
    if (indicator.assignedToType === "individual") {
      return users.find((u) => u._id === indicator.assignedTo)?.name || "Individual Custodian";
    }
    return indicator.assignedGroup
      ?.map((uid) => users.find((u) => u._id === uid)?.name)
      .filter(Boolean).join(", ") || "Assigned Group";
  }, [indicator, users]);

  if (loading) return <LoadingState />;
  if (!indicator) return <div className="p-20 text-center font-bold text-[#1a3a32]">Registry Record Not Found.</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-black text-[10px] uppercase tracking-widest transition-colors">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        <div className="flex gap-3">
          {submissionTimeInfo?.isResubmitted && (
            <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-2">
              <History size={14} /> Resubmitted
            </div>
          )}
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 ${getStatusStyles(indicator.status)}`}>
            {indicator.status === "approved" ? "Verified (Pending Seal)" : indicator.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          
          {indicator.rejectionCount > 0 && lastAdminNote && (
            <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-[0.2em]">Audit Flag Log</h4>
                <p className="text-sm text-rose-700 leading-relaxed font-medium italic">"{lastAdminNote.text}"</p>
                <p className="text-[9px] font-bold text-rose-400 uppercase">Logged on {new Date(lastAdminNote.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* PRIMARY INFO */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase text-[10px] tracking-widest">
                <ShieldCheck size={14} /> Audit ID: {indicator._id.toUpperCase()}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-1.5"><Clock size={12}/> {submissionTimeInfo?.submittedAt}</div>
              </div>
            </div>

            <h1 className="text-3xl font-black text-[#1a3a32] mb-4 font-serif">{indicator.indicatorTitle}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50">
              <Stat icon={indicator.assignedToType === "group" ? <GroupIcon size={14} /> : <UserIcon size={14} />} label="Custodian" value={custodians} />
              <Stat icon={<Calendar size={14} />} label="Deadline" value={new Date(indicator.dueDate).toLocaleDateString()} />
              <Stat icon={<FileText size={14} />} label="Unit" value={indicator.unitOfMeasure} />
              <Stat icon={<Target size={14} />} label="User Claim" value={`${indicator.progress}%`} />
            </div>
          </div>

          {/* EXHIBITS SECTION */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-widest flex items-center gap-2">
                <FileText className="text-[#c2a336]" size={18} /> Evidence Ledger
              </h3>
            </div>
            
            {indicator.evidence?.filter(e => !e.isArchived).length === 0 ? (
              <EmptyEvidence />
            ) : (
              <ul className="space-y-4">
                {indicator.evidence?.filter(e => !e.isArchived).map((file) => (
                  <li key={file._id} className="p-5 flex items-start justify-between bg-white border border-slate-100 rounded-3xl hover:border-[#c2a336]/30 transition-all group">
                    <div className="flex flex-col space-y-2 max-w-[65%]">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#c2a336]/10 transition-colors">
                            <FileText size={16} className="text-slate-500 group-hover:text-[#c2a336]" />
                        </div>
                        <span className="text-sm font-bold text-[#1a3a32] truncate">{file.fileName}</span>
                      </div>
                      <div className="flex items-start gap-2 pl-1">
                        <MessageSquare size={12} className="text-[#c2a336] mt-0.5 shrink-0" />
                        <span className="text-[11px] text-slate-500 font-medium leading-normal">
                           <span className="font-black text-[9px] uppercase text-slate-400 block mb-0.5">Exhibit Note:</span>
                           {file.description || "No specific comments provided."}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-center">
                      <button 
                        onClick={() => { setEditingFile(file); setEditDescription(file.description || ""); }} 
                        disabled={isFinalized} 
                        className="p-3 text-slate-400 hover:text-[#c2a336] hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => setPreviewFile(file)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3a32] text-white rounded-xl text-[10px] font-black hover:bg-[#c2a336] transition-all shadow-lg shadow-[#1a3a32]/10">
                        <Eye size={14} /> Preview
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SIDEBAR - SCORING TERMINAL */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl space-y-8 sticky top-10">
           <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#c2a336]">Scoring Terminal</h3>
            <p className="text-xs text-slate-300 italic">
              {isSuperAdmin 
                ? "Assign the final performance score based on the exhibits. This action seals the registry." 
                : "Verify the quality of exhibits below. Final scoring is reserved for Super Admins."}
            </p>
          </div>

          {isSuperAdmin ? (
            <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                 <span>Official Performance Rating</span>
                 <span className="text-[#c2a336]">{selectedScore}%</span>
               </label>
               <input 
                type="range" 
                min="0" max="100" 
                step="1"
                value={selectedScore}
                onChange={(e) => setSelectedScore(parseInt(e.target.value))}
                disabled={isFinalized}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#c2a336]" 
               />
               <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-bold text-white/30">0%</span>
                  <div className="px-3 py-1 bg-[#c2a336]/20 rounded-full border border-[#c2a336]/30">
                    <span className="text-xs font-black text-[#c2a336]">{selectedScore}%</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/30">100%</span>
               </div>
               <p className="text-[9px] text-white/40 text-center font-bold uppercase tracking-tighter pt-2">
                 Slide to override custodian's claim
               </p>
            </div>
          ) : (
            <div className="p-6 rounded-[2rem] border border-white/5 bg-white/5 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white/40">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Score Control</p>
                <p className="text-[10px] font-bold text-white/60">Super Admin Authorized Only</p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-6 border-t border-white/10">
            <button 
              onClick={handleApprove} 
              disabled={isFinalized || isUpdating || (!isSuperAdmin && indicator.status === "approved")} 
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isFinalized ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" : "bg-[#c2a336] text-[#1a3a32] hover:bg-[#d4b44a] shadow-xl shadow-[#c2a336]/10"}`}
            >
              {isUpdating ? <Loader2 size={18} className="animate-spin" /> : isFinalized ? <Lock size={18} /> : <Gavel size={18} />} 
              {isFinalized ? "Registry Sealed" : isSuperAdmin ? "Certify & Seal Record" : "Approve Exhibits"}
            </button>
            
            <button 
              onClick={() => setShowRejectModal(true)} 
              disabled={isFinalized || isUpdating} 
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors disabled:opacity-30"
            >
              <XCircle size={18} /> Return for Revision
            </button>
          </div>
        </div>
      </div>

      {editingFile && (
        <EditEvidenceDescriptionModal fileName={editingFile.fileName} description={editDescription} setDescription={setEditDescription} onConfirm={handleUpdateEvidenceDescription} onClose={() => setEditingFile(null)} loading={isUpdating} />
      )}
      {showRejectModal && (
        <RejectModal reason={rejectReason} setReason={setRejectReason} onConfirm={handleReject} onClose={() => setShowRejectModal(false)} loading={isUpdating} />
      )}
      {previewFile && indicator && (
        <EvidencePreviewModal file={previewFile} indicatorId={indicator._id} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};

/* --- SUBCOMPONENTS --- */
const Stat = ({ icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{icon} {label}</div>
    <div className="text-xs font-black text-[#1a3a32] uppercase truncate">{value}</div>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
    <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
    <p className="text-[#8c94a4] font-black uppercase tracking-widest text-[10px]">Accessing Secure Registry...</p>
  </div>
);

const EmptyEvidence = () => (
  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
    <AlertTriangle size={32} className="mx-auto text-amber-300 mb-4" />
    <p className="text-[10px] font-black text-slate-400 uppercase">Registry Missing Exhibits</p>
  </div>
);

const getStatusStyles = (s: string) => {
  const status = s?.toLowerCase();
  if (status === "approved") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const EditEvidenceDescriptionModal = ({ fileName, description, setDescription, onConfirm, onClose, loading }: any) => (
  <div className="fixed inset-0 bg-[#1a3a32]/90 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
      <h2 className="text-2xl font-black uppercase mb-2 flex items-center gap-3 font-serif"><Edit3 className="text-[#c2a336]" /> Exhibit Note</h2>
      <p className="text-[10px] text-slate-400 mb-6 uppercase font-black tracking-widest truncate">Annotation for: <span className="text-[#c2a336]">{fileName}</span></p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter specific audit notes regarding this document..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-[#c2a336] outline-none min-h-[150px] text-sm font-medium"
      />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 font-black uppercase text-[10px] text-slate-400">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#1a3a32] text-white text-[11px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#1a3a32]/20 transition-all">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Audit Note
        </button>
      </div>
    </div>
  </div>
);

const RejectModal = ({ reason, setReason, onConfirm, onClose, loading }: any) => (
  <div className="fixed inset-0 bg-[#1a3a32]/90 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
      <h2 className="text-2xl font-black uppercase mb-6 text-rose-600 flex items-center gap-3 font-serif"><AlertTriangle /> Revision Flag</h2>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Identify specific deficiencies and corrective actions required..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-rose-500 outline-none min-h-[150px] text-sm font-medium"
      />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 font-black uppercase text-[10px] text-slate-400">Abort</button>
        <button onClick={onConfirm} disabled={loading} className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase shadow-lg shadow-rose-600/20 transition-all">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Send Back for Revision"}
        </button>
      </div>
    </div>
  </div>
);

export default SubmittedIndicatorDetail;