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

/* --- UTILS --- */
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  return days > 0 ? `${days}d ${hours}h left` : "Less than a day left";
};

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
  
  // States for Inline Editing
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  /* --- DATA FILTERING --- */
  const activeEvidence = useMemo(() => {
    if (!indicator) return [];
    return indicator.evidence
      .filter((e) => !e.isArchived)
      .filter((e) => e._id !== isDeleting);
  }, [indicator, isDeleting]);

  const isRejected = indicator?.status === "rejected";
  const canModify =
    indicator?.status === "pending" ||
    indicator?.status === "rejected" ||
    indicator?.status === "submitted";

  /* --- HANDLERS --- */

  const handleUpdateDescription = async (evidenceId: string) => {
    if (!indicator || !editValue.trim()) return;
    setIsUpdating(true);
    try {
      await dispatch(
        updateEvidenceNote({
          indicatorId: indicator._id,
          evidenceId,
          description: editValue,
        })
      ).unwrap();
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
    const toastId = toast.loading("Processing files...");
    const extractedList: File[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".zip")) {
          const zip = await new JSZip().loadAsync(file);
          const promises: Promise<void>[] = [];
          zip.forEach((path, entry) => {
            if (!entry.dir && !path.includes("__MACOSX")) {
              promises.push(
                entry.async("blob").then((b) => {
                  extractedList.push(
                    new File([b], entry.name, { type: "application/octet-stream" })
                  );
                }),
              );
            }
          });
          await Promise.all(promises);
        } else {
          extractedList.push(file);
        }
      }

      const validFiles = extractedList.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        return ALLOWED_EXT.includes(ext) && f.size <= MAX_SIZE;
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setDescriptions((prev) => [...prev, ...validFiles.map(() => "")]);
      toast.success(`${validFiles.length} files added`, { id: toastId });
    } catch {
      toast.error("Error processing files", { id: toastId });
    }
  };

  const handleAction = async () => {
    if (!indicator) return;
    if (!selectedFiles.length) return toast.error("Please select at least one file");
    if (descriptions.some((d) => !d.trim())) return toast.error("All files need a description.");

    const toastId = toast.loading(isRejected ? "Resubmitting revision..." : "Uploading...");

    try {
      const payload = {
        id: indicator._id,
        files: selectedFiles,
        descriptions,
        notes: isRejected ? `Revised submission (Attempt ${indicator.rejectionCount + 1})` : undefined,
      };

      if (isRejected) {
        await dispatch(resubmitIndicatorEvidence(payload)).unwrap();
      } else {
        await dispatch(submitIndicatorEvidence(payload)).unwrap();
      }

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("notification:new", {
          title: isRejected ? "Revision Submitted" : "Evidence Updated",
          message: `${isRejected ? "A revision" : "New files"} submitted for ${indicator.indicatorTitle}`,
          targetUserId: indicator.createdBy,
        });
      }

      setSelectedFiles([]);
      setDescriptions([]);
      toast.success("Success", { id: toastId });
    } catch (err: any) {
      toast.error(err || "Upload failed", { id: toastId });
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!indicator) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    setIsDeleting(evidenceId);
    try {
      await dispatch(deleteIndicatorEvidence({ indicatorId: indicator._id, evidenceId })).unwrap();
      toast.success("File removed");
    } catch (err: any) {
      toast.error(err || "Failed to delete file");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!indicator) return loading ? <LoadingScreen /> : <NotFound navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="h-1.5 bg-gray-200 sticky top-0 z-50">
        <div
          className={`h-full transition-all duration-1000 ${isRejected ? "bg-orange-500" : "bg-[#C69214]"}`}
          style={{ width: `${indicator.progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <header>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-bold text-[#C69214] bg-orange-50 px-3 py-1 rounded-full uppercase">
                  ID: {indicator._id.slice(-6)}
                </span>
                {indicator.rejectionCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase">
                    <History size={12} /> {indicator.rejectionCount} Rejections
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-serif font-bold text-[#1E3A2B] leading-tight">
                {indicator.indicatorTitle}
              </h1>
            </header>

            {isRejected && (
              <div className="bg-white border-l-4 border-orange-500 rounded-3xl p-8 shadow-sm flex gap-6">
                <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 h-fit">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-orange-800 tracking-widest mb-1">
                    Feedback
                  </h4>
                  <p className="text-gray-600 italic">
                    "{indicator.notes[indicator.notes.length - 1]?.text}"
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Due Date" value={new Date(indicator.dueDate).toLocaleDateString()} />
              <Stat label="Time Left" value={formatDuration(new Date(indicator.dueDate).getTime() - Date.now())} />
              <Stat label="Unit" value={indicator.unitOfMeasure} />
              <Stat label="Status" value={indicator.status} />
            </div>

            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
                Registry
              </h3>
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                {activeEvidence.length > 0 ? (
                  activeEvidence.map((file) => (
                    <EvidenceRow
                      key={file._id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      canModify={canModify}
                      isDeleting={isDeleting === file._id}
                      onDelete={() => handleDeleteEvidence(file._id)}
                      // Inline Edit Props
                      isEditing={editingFileId === file._id}
                      editValue={editValue}
                      isUpdating={isUpdating}
                      onStartEdit={() => {
                        setEditingFileId(file._id);
                        setEditValue(file.description || "");
                      }}
                      onCancelEdit={() => setEditingFileId(null)}
                      onSaveEdit={() => handleUpdateDescription(file._id)}
                      onEditChange={(val: string) => setEditValue(val)}
                    />
                  ))
                ) : (
                  <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">
                    No active evidence
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            {canModify ? (
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl sticky top-12">
                <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 text-[#1E3A2B]">
                  {isRejected ? <RefreshCcw size={16} className="text-orange-500" /> : <Plus size={16} />}
                  {isRejected ? "Resubmit Revised" : "Add Evidence"}
                </h3>

                <label className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-10 cursor-pointer hover:border-[#C69214] transition-all">
                  <Upload size={24} className="mb-4 text-gray-400 group-hover:text-[#C69214]" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Select Files</span>
                  <input type="file" multiple hidden onChange={(e) => handleFileChange(e.target.files)} />
                </label>

                <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#1E3A2B] truncate">{file.name}</span>
                        <button onClick={() => setSelectedFiles(f => f.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-rose-500">
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        className="w-full text-[11px] bg-white border border-gray-100 rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#C69214]"
                        placeholder="Description..."
                        value={descriptions[i]}
                        onChange={(e) => {
                          const d = [...descriptions];
                          d[i] = e.target.value;
                          setDescriptions(d);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAction}
                  disabled={submitting}
                  className={`w-full mt-8 py-5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    selectedFiles.length === 0 || submitting ? "bg-gray-300" : isRejected ? "bg-orange-600 hover:bg-orange-700" : "bg-[#1E3A2B] hover:brightness-110"
                  }`}
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={14} />}
                  {submitting ? "Processing..." : "Submit to Auditor"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
                <Lock size={40} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-[10px] font-black uppercase text-gray-400">Locked</h4>
              </div>
            )}
          </aside>
        </div>
      </div>

      {previewFile && (
        <EvidencePreviewModal
          file={previewFile}
          indicatorId={indicator._id}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-bold text-[#1E3A2B] truncate uppercase">{value}</p>
  </div>
);

const EvidenceRow = ({
  file,
  onPreview,
  onDelete,
  isDeleting,
  canModify,
  isEditing,
  editValue,
  isUpdating,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
}: any) => {
  const attemptValue = file.resubmissionAttempt ?? 0;
  const isResub = attemptValue > 0;

  return (
    <div className="group flex justify-between items-center p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#1E3A2B] group-hover:text-white transition-all">
            <FileText size={20} />
          </div>
          {isResub && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white">
              <RefreshCcw size={10} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#1E3A2B]">{file.fileName}</p>
            {isResub && (
              <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">
                Rev. {attemptValue}
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 flex items-center gap-2 max-w-md">
              <input
                autoFocus
                className="flex-1 text-[11px] bg-white border border-[#C69214] rounded-lg px-2 py-1 outline-none"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSaveEdit()}
              />
              <button onClick={onSaveEdit} disabled={isUpdating} className="text-green-600 hover:bg-green-50 p-1 rounded">
                {isUpdating ? <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <Check size={14} />}
              </button>
              <button onClick={onCancelEdit} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400 italic truncate max-w-[200px] md:max-w-xs">
                {file.description || "No description"}
              </p>
              {canModify && (
                <button 
                  onClick={onStartEdit}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#C69214] transition-all p-1"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {canModify && !isEditing && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-3 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}
        <button
          onClick={onPreview}
          className="flex items-center gap-2 text-[10px] font-black uppercase px-5 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#1E3A2B] transition-all"
        >
          View <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-[#C69214] border-t-transparent animate-spin rounded-full mb-4" />
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processing...</p>
  </div>
);

const NotFound = ({ navigate }: any) => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center">
    <h2 className="text-2xl font-serif font-bold text-[#1E3A2B] mb-6">Indicator Not Found</h2>
    <button
      onClick={() => navigate(-1)}
      className="px-10 py-4 bg-[#1E3A2B] text-white text-[10px] font-black uppercase rounded-2xl"
    >
      Return to Index
    </button>
  </div>
);

export default UserIndicatorDetail;