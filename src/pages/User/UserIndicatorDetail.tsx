import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectUserIndicators,
  selectIndicatorsLoading,
  selectSubmittingEvidence,
  submitIndicatorEvidence,
  resubmitIndicatorEvidence,
  deleteIndicatorEvidence,
  updateEvidenceNote,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { getSocket } from "../../utils/socket";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  Plus,
  X,
  FileText,
  Lock,
  History,
  Trash2,
  ChevronRight,
  RefreshCcw,
  Send,
  Pencil,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import EvidencePreviewModal from "./EvidencePreviewModal";

/* --- CONFIGURATION --- */
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

const UserIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectUserIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const submitting = useAppSelector(selectSubmittingEvidence);

  const indicator = useMemo(
    () => indicators.find((i) => i._id === id),
    [indicators, id],
  );

  /* --- LOCAL STATE --- */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  /* --- THE MODIFICATION (SLICE-ALIGNED FILTERING) --- */
  const activeEvidence = useMemo(() => {
    if (!indicator) return [];

    return indicator.evidence.filter((e) => {
      // 1. Hide if currently being deleted
      if (e._id === isDeleting) return false;

      // 2. Hide if explicitly archived or rejected (from your slice types)
      if (e.isArchived || e.status === "rejected") return false;

      /** * 3. Resubmission Logic:
       * If the indicator has been rejected before, hide files from previous rounds.
       * A file is "Active" only if its resubmissionAttempt matches the current round.
       */
      if (indicator.rejectionCount > 0) {
        return e.resubmissionAttempt === indicator.rejectionCount;
      }

      return true;
    });
  }, [indicator, isDeleting]);

  const isRejected = indicator?.status === "rejected";
  const canModify = ["pending", "rejected", "submitted"].includes(indicator?.status || "");

  /* --- HANDLERS --- */
  const handleUpdateDescription = async (evidenceId: string) => {
    if (!indicator || !editValue.trim()) return;
    setIsUpdating(true);
    try {
      await dispatch(updateEvidenceNote({ indicatorId: indicator._id, evidenceId, description: editValue })).unwrap();
      toast.success("Description updated");
      setEditingFileId(null);
    } catch (err: any) {
      toast.error(err || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    const extractedList: File[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".zip")) {
          const zip = await new JSZip().loadAsync(file);
          const promises: any[] = [];
          zip.forEach((path, entry) => {
            if (!entry.dir && !path.includes("__MACOSX")) {
              promises.push(entry.async("blob").then(b => extractedList.push(new File([b], entry.name, { type: "application/octet-stream" }))));
            }
          });
          await Promise.all(promises);
        } else {
          extractedList.push(file);
        }
      }
      const validFiles = extractedList.filter(f => ALLOWED_EXT.includes(f.name.split(".").pop()?.toLowerCase() || "") && f.size <= MAX_SIZE);
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setDescriptions(prev => [...prev, ...validFiles.map(() => "")]);
    } catch {
      toast.error("Error processing files");
    }
  };

 const handleAction = async () => {
    if (!indicator || !selectedFiles.length) return;
    if (descriptions.some(d => !d.trim())) return toast.error("Please describe all files.");

    try {
      const payload = { id: indicator._id, files: selectedFiles, descriptions };
      
      // 1. Dispatch the appropriate Thunk
      if (isRejected) {
        await dispatch(resubmitIndicatorEvidence({ 
          ...payload, 
          notes: `Revision Round ${indicator.rejectionCount + 1}` 
        })).unwrap();
      } else {
        await dispatch(submitIndicatorEvidence(payload)).unwrap();
      }

      // 2. TRIGGER THE SOCKET (The missing part)
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("notification:new", {
          title: isRejected ? "Revision Submitted" : "Evidence Uploaded",
          message: `${indicator.indicatorTitle} has been updated by the user.`,
          targetUserId: "admin", // Or the specific auditor ID if stored in indicator.createdBy
          type: "indicator_update"
        });
      }

      setSelectedFiles([]);
      setDescriptions([]);
      toast.success(isRejected ? "Revision submitted" : "Evidence uploaded");
    } catch (err: any) {
      toast.error(err || "Action failed");
    }
  };

  if (!indicator) return loading ? <LoadingScreen /> : <NotFound navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="h-1.5 bg-gray-200 sticky top-0 z-50">
        <div className={`h-full transition-all duration-1000 ${isRejected ? "bg-rose-500" : "bg-[#C69214]"}`} style={{ width: `${indicator.progress}%` }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black mb-10">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <header>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-bold text-[#C69214] bg-orange-50 px-3 py-1 rounded-full">ID: {indicator._id.slice(-6)}</span>
                {indicator.rejectionCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <History size={12} /> {indicator.rejectionCount} Rejections
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-serif font-bold text-[#1E3A2B]">{indicator.indicatorTitle}</h1>
            </header>

            {isRejected && (
              <div className="bg-white border-l-4 border-rose-500 rounded-3xl p-8 shadow-sm flex gap-6">
                <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 h-fit"><AlertCircle size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-rose-800 tracking-widest mb-1">Correction Required</h4>
                  <p className="text-gray-600 italic">"{indicator.notes[indicator.notes.length - 1]?.text || "Please review previous uploads."}"</p>
                </div>
              </div>
            )}

            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Current Evidence Registry</h3>
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                {activeEvidence.length > 0 ? (
                  activeEvidence.map((file) => (
                    <EvidenceRow
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      canModify={canModify}
                      isDeleting={isDeleting === file._id}
                      onDelete={() => { if(window.confirm("Delete this file?")) setIsDeleting(file._id); dispatch(deleteIndicatorEvidence({indicatorId: indicator._id, evidenceId: file._id})).finally(() => setIsDeleting(null)); }}
                      isEditing={editingFileId === file._id}
                      editValue={editValue}
                      isUpdating={isUpdating}
                      onStartEdit={() => { setEditingFileId(file._id); setEditValue(file.description || ""); }}
                      onCancelEdit={() => setEditingFileId(null)}
                      onSaveEdit={() => handleUpdateDescription(file._id)}
                      onEditChange={setEditValue}
                    />
                  ))
                ) : (
                  <div className="p-20 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">No active documents</div>
                    {isRejected && <p className="text-xs text-gray-400 mt-2">Old rejected documents have been archived for your history.</p>}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            {canModify ? (
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl sticky top-12">
                <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-[#1E3A2B] flex items-center gap-2">
                  {isRejected ? <RefreshCcw size={16} className="text-rose-500" /> : <Plus size={16} />}
                  {isRejected ? "Resubmit Evidence" : "Upload Evidence"}
                </h3>
                <label className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-10 cursor-pointer hover:border-[#C69214] transition-all">
                  <Upload size={24} className="mb-4 text-gray-400 group-hover:text-[#C69214]" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Attach Files</span>
                  <input type="file" multiple hidden onChange={(e) => handleFileChange(e.target.files)} />
                </label>
                <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#1E3A2B] truncate">{file.name}</span>
                        <X size={14} className="text-gray-300 cursor-pointer" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                      <textarea className="w-full text-[11px] bg-white border border-gray-100 rounded-xl p-3 outline-none" placeholder="Description..." value={descriptions[i]} onChange={(e) => { const d = [...descriptions]; d[i] = e.target.value; setDescriptions(d); }} />
                    </div>
                  ))}
                </div>
                <button onClick={handleAction} disabled={submitting || !selectedFiles.length} className={`w-full mt-8 py-5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!selectedFiles.length || submitting ? "bg-gray-200" : isRejected ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1E3A2B]"}`}>
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={14} />}
                  {isRejected ? "Submit Revision" : "Submit Evidence"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
                <Lock size={40} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-[10px] font-black uppercase text-gray-400">Submissions Locked</h4>
              </div>
            )}
          </aside>
        </div>
      </div>
      {previewFile && <EvidencePreviewModal file={previewFile} indicatorId={indicator._id} onClose={() => setPreviewFile(null)} />}
    </div>
  );
};

const EvidenceRow = ({ file, onPreview, onDelete, isDeleting, canModify, isEditing, editValue, isUpdating, onStartEdit, onCancelEdit, onSaveEdit, onEditChange }: any) => (
  <div className="group flex justify-between items-center p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-4 flex-1">
      <div className="relative">
        <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#1E3A2B] group-hover:text-white transition-all"><FileText size={20} /></div>
        {file.resubmissionAttempt > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white"><RefreshCcw size={10} /></div>}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[#1E3A2B]">{file.fileName}</p>
          {file.resubmissionAttempt > 0 && <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">Rev. {file.resubmissionAttempt}</span>}
        </div>
        {isEditing ? (
          <div className="mt-2 flex items-center gap-2 max-w-md">
            <input autoFocus className="flex-1 text-[11px] border border-[#C69214] rounded px-2 py-1 outline-none" value={editValue} onChange={(e) => onEditChange(e.target.value)} />
            <button onClick={onSaveEdit} className="text-green-600">{isUpdating ? "..." : <Check size={14}/>}</button>
            <X size={14} className="text-gray-400 cursor-pointer" onClick={onCancelEdit} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-gray-400 italic truncate max-w-xs">{file.description || "No description"}</p>
            {canModify && <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-gray-300 cursor-pointer hover:text-[#C69214]" onClick={onStartEdit} />}
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {canModify && (
        <button onClick={onDelete} disabled={isDeleting} className="p-3 text-rose-200 hover:text-rose-600 transition-all">
          {isDeleting ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <Trash2 size={16} />}
        </button>
      )}
      <button onClick={onPreview} className="flex items-center gap-2 text-[10px] font-black uppercase px-5 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#1E3A2B] transition-all">
        View <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

const LoadingScreen = () => <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-[#C69214] border-t-transparent animate-spin rounded-full" /></div>;
const NotFound = ({ navigate }: any) => <div className="h-screen flex flex-col items-center justify-center"><h2 className="text-xl font-bold mb-4">Record Not Found</h2><button onClick={() => navigate(-1)} className="px-6 py-2 bg-[#1E3A2B] text-white rounded-lg">Back</button></div>;

export default UserIndicatorDetail;