import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  approveIndicator,
  rejectIndicator,
  updateIndicator,
  submitIndicatorScore,
  updateEvidenceNote,
  rejectSingleEvidence, // Added new thunk
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import {
  Loader2,
  User as UserIcon,
  Users as GroupIcon,
  Calendar,
  ChevronLeft,
  XCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Gavel,
  History,
  Save,
  Edit3,
  MessageSquare,
  Clock,
  Target,
  Lock,
  Activity,
  FileX, // Added for granular rejection
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

  const indicator = useMemo(
    () => indicators.find((i) => i._id === id),
    [indicators, id],
  );
  
  const isSuperAdmin = currentUser?.role?.toLowerCase() === "superadmin";
  const isFinalized = useMemo(() => indicator?.status === "completed", [indicator]);

  const lastAdminNote = useMemo(() => {
    if (!indicator || !indicator.notes || indicator.notes.length === 0) return null;
    return indicator.notes[indicator.notes.length - 1];
  }, [indicator]);

  // State Management
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedScore, setSelectedScore] = useState(0);
  
  // States for Granular Evidence Actions
  const [editingFile, setEditingFile] = useState<IEvidence | null>(null);
  const [rejectingFile, setRejectingFile] = useState<IEvidence | null>(null); // New
  const [editDescription, setEditDescription] = useState("");
  const [fileRejectReason, setFileRejectReason] = useState(""); // New
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        dispatch(fetchAllIndicatorsForAdmin()),
        dispatch(fetchUsers()),
      ]);
      setLoading(false);
    };
    init();
  }, [dispatch]);

  useEffect(() => {
    if (indicator) {
      setSelectedScore(indicator.progress);
    }
  }, [indicator?._id, indicator?.progress]);

  /* --- HANDLERS --- */

  const handleUpdateEvidenceDescription = async () => {
    if (!indicator || !editingFile) return;
    const evidenceId = editingFile._id;

    if (!evidenceId || evidenceId.includes("evidence-")) {
      toast.error("Traceability Error: Exhibit not yet synced with server.");
      return;
    }

    try {
      setIsUpdating(true);
      await dispatch(
        updateEvidenceNote({
          indicatorId: indicator._id,
          evidenceId: evidenceId,
          description: editDescription.trim(),
        }),
      ).unwrap();

      toast.success("Exhibit annotation saved");
      setEditingFile(null);
    } catch (err: any) {
      toast.error(err || "Failed to save note");
    } finally {
      setIsUpdating(false);
    }
  };

  // NEW: Handle Single File Rejection
  const handleRejectSingleFile = async () => {
    if (!indicator || !rejectingFile || !fileRejectReason.trim()) {
      return toast.error("Please provide a reason for rejecting this document.");
    }

    try {
      setIsUpdating(true);
      await dispatch(
        rejectSingleEvidence({
          indicatorId: indicator._id,
          evidenceId: rejectingFile._id,
          reason: fileRejectReason.trim(),
        })
      ).unwrap();

      toast.success("Document marked as rejected");
      setRejectingFile(null);
      setFileRejectReason("");
    } catch (err: any) {
      toast.error(err || "Failed to reject document");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!indicator || isFinalized) return;
    try {
      setIsUpdating(true);
      
      const sanitizedEvidence: IEvidence[] = indicator.evidence.map(ev => ({
        ...ev,
        uploadedBy: ev.uploadedBy || currentUser?._id || "system_admin" 
      })) as IEvidence[];

      if (isSuperAdmin) {
        await dispatch(
          submitIndicatorScore({
            id: indicator._id,
            score: selectedScore,
            note: "Final certification by Super Admin",
          })
        ).unwrap();

        await dispatch(
          updateIndicator({
            id: indicator._id,
            updates: {
              status: "completed",
              reviewedAt: new Date().toISOString(),
              evidence: sanitizedEvidence, 
            },
          }),
        ).unwrap();
        
        toast.success(`Registry Certified & Sealed`);
      } else {
        await dispatch(
          approveIndicator({ 
            id: indicator._id, 
            notes: "Exhibits verified by Admin" 
          })
        ).unwrap();
        
        toast.success("Exhibits Verified");
      }
      
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Operation failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!indicator || !rejectReason.trim()) return toast.error("Justification required.");
    try {
      setIsUpdating(true);
      await dispatch(
        rejectIndicator({ id: indicator._id, notes: rejectReason.trim() }),
      ).unwrap();
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
    return indicator.assignedGroup?.map((uid) => users.find((u) => u._id === uid)?.name).filter(Boolean).join(", ") || "Assigned Group";
  }, [indicator, users]);

  if (loading) return <LoadingState />;
  if (!indicator) return <div className="p-20 text-center font-bold text-[#1a3a32]">Registry Record Not Found.</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        <div className="flex gap-3">
          {indicator.rejectionCount > 0 && (
            <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-2">
              <History size={14} /> Resubmitted ({indicator.rejectionCount})
            </div>
          )}
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 ${getStatusStyles(indicator.status)}`}>
            {indicator.status === "approved" ? "Verified (Pending Seal)" : indicator.status.replace("_", " ")}
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
                <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-[0.2em]">Last Revision Requirement</h4>
                <p className="text-sm text-rose-700 leading-relaxed font-medium italic">"{lastAdminNote.text}"</p>
                <p className="text-[9px] font-bold text-rose-400 uppercase">Logged {new Date(lastAdminNote.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase text-[10px] tracking-widest">
                <ShieldCheck size={14} /> Audit ID: {indicator._id.toUpperCase()}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-1.5"><Clock size={12} /> Updated: {new Date(indicator.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <h1 className="text-3xl font-black text-[#1a3a32] mb-4 font-serif">{indicator.indicatorTitle}</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50">
              <Stat icon={indicator.assignedToType === "group" ? <GroupIcon size={14} /> : <UserIcon size={14} />} label="Custodian" value={custodians} />
              <Stat icon={<Calendar size={14} />} label="Original Due" value={new Date(indicator.dueDate).toLocaleDateString()} />
              <Stat icon={<FileText size={14} />} label="Unit" value={indicator.unitOfMeasure} />
              <Stat icon={<Target size={14} />} label="User Claim" value={`${indicator.progress}%`} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-widest flex items-center gap-2">
                <FileText className="text-[#c2a336]" size={18} /> Evidence Ledger
              </h3>
            </div>

            {indicator.evidence?.filter((e) => !e.isArchived).length === 0 ? (
              <EmptyEvidence />
            ) : (
              <ul className="space-y-4">
                {indicator.evidence?.filter((e) => !e.isArchived).map((file, idx) => (
                  <li key={file._id || `file-${idx}`} className={`p-5 flex items-start justify-between bg-white border rounded-3xl transition-all group ${file.status === 'rejected' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 hover:border-[#c2a336]/30'}`}>
                    <div className="flex flex-col space-y-2 max-w-[60%]">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg transition-colors ${file.status === 'rejected' ? 'bg-rose-100' : 'bg-slate-100 group-hover:bg-[#c2a336]/10'}`}>
                          <FileText size={16} className={file.status === 'rejected' ? 'text-rose-600' : 'text-slate-500 group-hover:text-[#c2a336]'} />
                        </div>
                        <span className="text-sm font-bold text-[#1a3a32] truncate">{file.fileName}</span>
                        {file.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-[8px] font-black text-white uppercase tracking-tighter">Rejected</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pl-1">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={12} className="text-[#c2a336] mt-0.5 shrink-0" />
                          <div className="text-[11px] text-slate-500 font-medium leading-normal">
                            <span className="font-black text-[9px] uppercase text-slate-400 block mb-0.5">Exhibit Note:</span>
                            {file.description || "No specific comments provided."}
                          </div>
                        </div>
                        {file.rejectionReason && (
                          <div className="flex items-start gap-2 bg-white/60 p-2 rounded-xl border border-rose-100">
                            <AlertTriangle size={12} className="text-rose-600 mt-0.5 shrink-0" />
                            <div className="text-[10px] text-rose-700 font-bold leading-tight">
                              <span className="font-black text-[8px] uppercase text-rose-400 block mb-0.5">Rejection Reason:</span>
                              {file.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-center">
                      <button
                        onClick={() => {
                          setEditingFile(file);
                          setEditDescription(file.description || "");
                        }}
                        disabled={isFinalized || isUpdating}
                        className={`p-3 rounded-xl transition-all ${isFinalized ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-[#c2a336] hover:bg-slate-50"}`}
                        title="Edit Description"
                      >
                        {isFinalized ? <Lock size={18} /> : <Edit3 size={18} />}
                      </button>

                      {/* NEW: Granular Rejection Button */}
                      {file.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectingFile(file)}
                          disabled={isFinalized || isUpdating}
                          className="p-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Reject Document"
                        >
                          <FileX size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => setPreviewFile(file)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a3a32] text-white rounded-xl text-[10px] font-black hover:bg-[#c2a336] transition-all shadow-lg shadow-[#1a3a32]/10"
                      >
                        <Eye size={14} /> Preview
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Audit History */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-widest flex items-center gap-2 mb-8">
              <Activity className="text-[#c2a336]" size={18} /> Audit History
            </h3>
            <div className="space-y-6">
              {indicator.scoreHistory?.map((entry, idx) => (
                <div key={idx} className="flex gap-4 border-l-2 border-slate-50 pl-6 relative">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-[#1a3a32]">Score Updated to {entry.score}%</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      by {typeof entry.submittedBy === "object" ? (entry.submittedBy as any).name : "System"} • {new Date(entry.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 border-l-2 border-slate-50 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-[#1a3a32]">Registry Created</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(indicator.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Sidebar */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl space-y-8 sticky top-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#c2a336]">Scoring Terminal</h3>
            <p className="text-xs text-slate-300 italic">
              {isSuperAdmin ? "Assign final performance score. This action seals the registry." : "Verify exhibits. Final scoring is reserved for Super Admins."}
            </p>
          </div>

          {isSuperAdmin ? (
            <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                <span>Official Performance Rating</span>
                <span className="text-[#c2a336]">{selectedScore}%</span>
              </label>
              <input
                type="range" min="0" max="100" step="1"
                value={selectedScore}
                onChange={(e) => setSelectedScore(parseInt(e.target.value))}
                disabled={isFinalized || isUpdating}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#c2a336] disabled:opacity-50"
              />
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-bold text-white/30">0%</span>
                <div className="px-3 py-1 bg-[#c2a336]/20 rounded-full border border-[#c2a336]/30">
                  <span className="text-xs font-black text-[#c2a336]">{selectedScore}%</span>
                </div>
                <span className="text-[10px] font-bold text-white/30">100%</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[2rem] border border-white/5 bg-white/5 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white/40"><Lock size={20} /></div>
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

      {/* --- MODALS --- */}

      {editingFile && (
        <EditEvidenceDescriptionModal
          fileName={editingFile.fileName}
          description={editDescription}
          setDescription={setEditDescription}
          onConfirm={handleUpdateEvidenceDescription}
          onClose={() => setEditingFile(null)}
          loading={isUpdating}
        />
      )}

      {/* NEW: Single File Rejection Modal */}
      {rejectingFile && (
        <RejectFileModal
          fileName={rejectingFile.fileName}
          reason={fileRejectReason}
          setReason={setFileRejectReason}
          onConfirm={handleRejectSingleFile}
          onClose={() => setRejectingFile(null)}
          loading={isUpdating}
        />
      )}

      {showRejectModal && (
        <RejectModal
          reason={rejectReason}
          setReason={setRejectReason}
          onConfirm={handleReject}
          onClose={() => setShowRejectModal(false)}
          loading={isUpdating}
        />
      )}

      {previewFile && indicator && (
        <EvidencePreviewModal
          file={previewFile}
          indicatorId={indicator._id}
          onClose={() => setPreviewFile(null)}
        />
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
  if (status === "partially_completed") return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

// NEW: Reject Single File Modal Component
const RejectFileModal = ({ fileName, reason, setReason, onConfirm, onClose, loading }: any) => (
  <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
      <h2 className="text-2xl font-black uppercase mb-2 text-rose-600 flex items-center gap-3 font-serif"><FileX /> Invalid Exhibit</h2>
      <p className="text-[10px] text-slate-400 mb-6 uppercase font-black tracking-widest truncate">Document: <span className="text-rose-600">{fileName}</span></p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejecting this specific document..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-rose-500 outline-none min-h-[150px] text-sm font-medium"
      />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 font-black uppercase text-[10px] text-slate-400">Cancel</button>
        <button onClick={onConfirm} disabled={loading || !reason.trim()} className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Confirm Rejection"}
        </button>
      </div>
    </div>
  </div>
);

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