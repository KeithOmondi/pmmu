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
  updateEvidenceNote, // Kept for editing file-specific descriptions
  addIndicatorNote, // NEW: For general status updates
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { getSocket } from "../../utils/socket";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
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
  FilePlus,
  AlertTriangle,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import EvidencePreviewModal from "./EvidencePreviewModal";
import { format } from "date-fns";

/* --- CONFIGURATION --- */
const ALLOWED_EXT = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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

  // New state for status updates (text-only)
  const [statusNote, setStatusNote] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);

  /* --- LOGIC HELPERS --- */
  const isRejected = indicator?.status === "rejected";
  const isSubmitted = indicator?.status === "submitted";
  const isCompleted = indicator?.status === "completed";
  const canModify = [
    "pending",
    "rejected",
    "submitted",
    "partially_completed",
  ].includes(indicator?.status || "");

  const activeEvidence = useMemo(() => {
    if (!indicator) return [];
    return indicator.evidence.filter((e) => {
      if (e._id === isDeleting) return false;
      if (e.isArchived) return false;
      if (isRejected && indicator.rejectionCount > 0) {
        return e.resubmissionAttempt === indicator.rejectionCount;
      }
      return e.status !== "rejected";
    });
  }, [indicator, isDeleting, isRejected]);

  /* --- HANDLERS --- */

  // FIXED: Using the new addIndicatorNote thunk
  const handleSendStatusUpdate = async () => {
    if (!statusNote.trim() || !indicator) return;
    setIsSendingNote(true);
    try {
      await dispatch(
        addIndicatorNote({
          indicatorId: indicator._id,
          text: statusNote,
        }),
      ).unwrap();

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("notification:new", {
          title: "Status Update Provided",
          message: `${indicator.indicatorTitle}: ${statusNote.substring(0, 40)}...`,
          targetUserId: "admin", // Backend handles broadcast to admins
          type: "indicator_update",
        });
      }

      toast.success("Status update sent to admin");
      setStatusNote("");
    } catch (err: any) {
      toast.error(err || "Failed to send update");
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleUpdateDescription = async (evidenceId: string) => {
    if (!indicator || !editValue.trim()) return;
    setIsUpdating(true);
    try {
      await dispatch(
        updateEvidenceNote({
          indicatorId: indicator._id,
          evidenceId,
          description: editValue,
        }),
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
    const extractedList: File[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".zip")) {
          const zip = await new JSZip().loadAsync(file);
          const promises: any[] = [];
          zip.forEach((path, entry) => {
            if (!entry.dir && !path.includes("__MACOSX")) {
              promises.push(
                entry.async("blob").then((b) =>
                  extractedList.push(
                    new File([b], entry.name, {
                      type: "application/octet-stream",
                    }),
                  ),
                ),
              );
            }
          });
          await Promise.all(promises);
        } else {
          extractedList.push(file);
        }
      }

      const validFiles: File[] = [];
      extractedList.forEach((f) => {
        const fileExt = f.name.split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_EXT.includes(fileExt)) {
          toast.error(`"${f.name}" has an unsupported file type.`);
        } else if (f.size > MAX_SIZE) {
          toast.error(`"${f.name}" is too large (Max 5MB).`);
        } else {
          validFiles.push(f);
        }
      });

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setDescriptions((prev) => [...prev, ...validFiles.map(() => "")]);
      }
    } catch {
      toast.error("Error processing files");
    }
  };

  const handleAction = async () => {
    if (!indicator || !selectedFiles.length) return;
    if (descriptions.some((d) => !d.trim()))
      return toast.error("Please describe all files.");

    try {
      const payload = { id: indicator._id, files: selectedFiles, descriptions };
      let socketTitle = "Evidence Uploaded";

      if (isRejected) {
        await dispatch(
          resubmitIndicatorEvidence({
            ...payload,
            notes: `Revision Round ${indicator.rejectionCount + 1}`,
          }),
        ).unwrap();
        socketTitle = "Revision Submitted";
      } else {
        await dispatch(submitIndicatorEvidence(payload)).unwrap();
        socketTitle = isSubmitted
          ? "Additional Evidence Added"
          : "Evidence Uploaded";
      }

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("notification:new", {
          title: socketTitle,
          message: `${indicator.indicatorTitle}: ${selectedFiles.length} new document(s) attached.`,
          targetUserId: "admin",
          type: "indicator_update",
        });
      }

      setSelectedFiles([]);
      setDescriptions([]);
      toast.success(
        isSubmitted ? "Additional documents added" : "Evidence submitted",
      );
    } catch (err: any) {
      toast.error(err || "Action failed");
    }
  };

  if (!indicator)
    return loading ? <LoadingScreen /> : <NotFound navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-200 sticky top-0 z-50">
        <div
          className={`h-full transition-all duration-1000 ${
            isRejected
              ? "bg-rose-500"
              : isCompleted
                ? "bg-emerald-500"
                : "bg-[#C69214]"
          }`}
          style={{ width: `${indicator.progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black mb-10 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT COLUMN: INFORMATION & REGISTRY */}
          <div className="lg:col-span-8 space-y-10">
            <header>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-[10px] font-bold text-[#C69214] bg-orange-50 px-3 py-1 rounded-full">
                  ID: {indicator._id.slice(-6)}
                </span>
                {indicator.rejectionCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <History size={12} /> {indicator.rejectionCount} Rejections
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1 ${
                    isCompleted
                      ? "text-emerald-600 bg-emerald-50"
                      : isSubmitted
                        ? "text-blue-600 bg-blue-50"
                        : "text-amber-600 bg-amber-50"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={12} />
                  ) : (
                    <AlertCircle size={12} />
                  )}
                  {indicator.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-4xl font-serif font-bold text-[#1E3A2B] leading-tight">
                {indicator.indicatorTitle}
              </h1>
            </header>

            {/* COMMUNICATION HISTORY (NOTES) */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <MessageSquare size={14} /> Communication History
              </h3>
              <div className="space-y-4">
                {indicator.notes?.length > 0 ? (
                  indicator.notes
                    .map((note: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex gap-4 p-5 rounded-3xl border ${
                          note.createdBy?.role === "superadmin" ||
                          note.createdBy?.role === "admin"
                            ? "bg-white border-gray-100 ml-0 mr-12"
                            : "bg-[#1E3A2B] text-white border-transparent ml-12 mr-0"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl h-fit ${
                            note.createdBy?.role === "superadmin"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                              {note.createdBy?.name || "System"}
                            </span>
                            <span className="text-[9px] opacity-40 italic">
                              {format(
                                new Date(note.createdAt),
                                "MMM d, h:mm a",
                              )}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{note.text}</p>
                        </div>
                      </div>
                    ))
                    .reverse() // Most recent first
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      No messages recorded
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* EVIDENCE REGISTRY */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <FileText size={14} /> Attached Evidence
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
                      onDelete={() => {
                        if (window.confirm("Delete this document?")) {
                          setIsDeleting(file._id);
                          dispatch(
                            deleteIndicatorEvidence({
                              indicatorId: indicator._id,
                              evidenceId: file._id,
                            }),
                          ).finally(() => setIsDeleting(null));
                        }
                      }}
                      isEditing={editingFileId === file._id}
                      editValue={editValue}
                      isUpdating={isUpdating}
                      onStartEdit={() => {
                        setEditingFileId(file._id);
                        setEditValue(file.description || "");
                      }}
                      onCancelEdit={() => setEditingFileId(null)}
                      onSaveEdit={() => handleUpdateDescription(file._id)}
                      onEditChange={setEditValue}
                    />
                  ))
                ) : (
                  <div className="p-20 text-center">
                    <FileText
                      size={40}
                      className="mx-auto text-gray-100 mb-4"
                    />
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      No documents in registry
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ACTIONS */}
          <aside className="lg:col-span-4 space-y-6">
            {/* TEXT-ONLY STATUS UPDATE BOX */}
            <div className="bg-[#1E3A2B] rounded-[2.5rem] p-8 shadow-xl text-white sticky top-12">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-[#C69214]" />
                Status Justification
              </h3>
              <p className="text-[10px] text-gray-300 mb-4 leading-relaxed">
                Provide a text-only update if work is underway but documents
                aren't ready.
              </p>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full text-[12px] bg-[#2A4D3A] border border-[#3A5D4A] rounded-2xl p-4 outline-none text-white placeholder:text-gray-500 min-h-[120px] resize-none focus:border-[#C69214] transition-all"
                placeholder="Describe current progress or explain delays..."
              />
              <button
                onClick={handleSendStatusUpdate}
                disabled={isSendingNote || !statusNote.trim()}
                className="w-full mt-4 py-4 bg-[#C69214] hover:bg-[#a87d12] disabled:bg-gray-700 disabled:cursor-not-allowed rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {isSendingNote ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  <Send size={14} />
                )}
                {isSendingNote ? "Processing..." : "Submit Update"}
              </button>

              <div className="mt-8 pt-8 border-t border-white/10">
                {/* UPLOAD TRIGGER (ONLY IF NOT COMPLETED) */}
                {canModify ? (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#C69214] flex items-center gap-2">
                      {isRejected ? (
                        <RefreshCcw size={16} />
                      ) : (
                        <FilePlus size={16} />
                      )}
                      {isRejected ? "Corrective Evidence" : "Attach Files"}
                    </h3>

                    <label className="group flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-8 cursor-pointer hover:border-[#C69214] hover:bg-white/5 transition-all">
                      <Upload
                        size={20}
                        className="mb-3 text-gray-400 group-hover:text-[#C69214]"
                      />
                      <span className="text-[9px] font-black uppercase text-gray-400 group-hover:text-white">
                        Click to browse files
                      </span>
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => handleFileChange(e.target.files)}
                      />
                    </label>

                    {/* Pending Uploads List */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedFiles.map((file, i) => (
                          <div
                            key={i}
                            className="bg-white/5 rounded-2xl p-4 border border-white/5"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-white truncate max-w-[150px]">
                                {file.name}
                              </span>
                              <X
                                size={14}
                                className="text-gray-500 hover:text-rose-500 cursor-pointer"
                                onClick={() =>
                                  setSelectedFiles((prev) =>
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                              />
                            </div>
                            <textarea
                              className="w-full text-[10px] bg-[#1a3326] border border-white/5 rounded-xl p-2 outline-none text-gray-300"
                              placeholder="File description..."
                              value={descriptions[i]}
                              onChange={(e) => {
                                const d = [...descriptions];
                                d[i] = e.target.value;
                                setDescriptions(d);
                              }}
                            />
                          </div>
                        ))}
                        <button
                          onClick={handleAction}
                          disabled={submitting}
                          className="w-full py-4 bg-white text-[#1E3A2B] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C69214] hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          {submitting ? "Uploading..." : "Upload All Files"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Lock size={30} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      Task Locked for Review
                    </p>
                  </div>
                )}
              </div>
            </div>
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

/* --- SUB-COMPONENT: EvidenceRow --- */
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
  const isRejected = file.status === "rejected";

  return (
    <div
      className={`group flex flex-col p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-all ${isRejected ? "bg-rose-50/30" : ""}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                isRejected
                  ? "bg-rose-100 border-rose-200 text-rose-600"
                  : "bg-white border-gray-100 text-gray-400 group-hover:bg-[#1E3A2B] group-hover:text-white"
              }`}
            >
              <FileText size={20} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-bold ${isRejected ? "text-rose-900" : "text-[#1E3A2B]"}`}
              >
                {file.fileName}
              </p>
            </div>
            {isEditing ? (
              <div className="mt-2 flex items-center gap-2 max-w-md">
                <input
                  autoFocus
                  className="flex-1 text-[11px] border border-[#C69214] rounded px-2 py-1 outline-none"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                />
                <button onClick={onSaveEdit} className="text-green-600 p-1">
                  {isUpdating ? (
                    <div className="w-3 h-3 border border-current border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button onClick={onCancelEdit} className="text-gray-400 p-1">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400 italic truncate max-w-xs">
                  {file.description || "No description provided"}
                </p>
                {canModify && !isRejected && (
                  <Pencil
                    size={12}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 cursor-pointer hover:text-[#C69214] transition-all"
                    onClick={onStartEdit}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canModify && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-3 text-gray-200 hover:text-rose-600 transition-all"
              title="Delete Document"
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
            className="flex items-center gap-2 text-[10px] font-black uppercase px-5 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#1E3A2B] hover:shadow-sm transition-all"
          >
            View Document <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {isRejected && file.rejectionReason && (
        <div className="mt-4 ml-16 flex items-start gap-3 bg-rose-50 p-4 rounded-2xl border border-rose-100">
          <AlertTriangle size={14} className="text-rose-600 mt-0.5 shrink-0" />
          <div className="text-[11px] text-rose-800 leading-relaxed">
            <span className="font-black text-[9px] uppercase text-rose-400 block mb-1">
              Admin Rejection Remark:
            </span>
            {file.rejectionReason}
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
    <div className="w-10 h-10 border-4 border-[#C69214] border-t-transparent animate-spin rounded-full" />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
      Loading Registry
    </span>
  </div>
);

const NotFound = ({ navigate }: any) => (
  <div className="h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
      <AlertCircle size={40} className="text-gray-200" />
    </div>
    <h2 className="text-2xl font-serif font-bold text-[#1E3A2B] mb-2">
      Indicator Not Found
    </h2>
    <p className="text-gray-400 text-sm mb-8 max-w-xs">
      The record you are looking for may have been removed or moved to another
      category.
    </p>
    <button
      onClick={() => navigate(-1)}
      className="px-8 py-4 bg-[#1E3A2B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
    >
      Return to Dashboard
    </button>
  </div>
);

export default UserIndicatorDetail;
