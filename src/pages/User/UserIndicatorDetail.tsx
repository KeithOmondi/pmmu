import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectUserIndicators,
  selectIndicatorsLoading,
  selectSubmittingEvidence,
  submitIndicatorEvidence,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { getSocket } from "../../utils/socket";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  ShieldCheck,
  Plus,
  X,
  FileText,
  Lock,
  ChevronRight,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import EvidencePreviewModal from "./EvidencePreviewModal";

/* --- HELPERS --- */
const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m remaining`;
};

// Map extensions to strict MIME types for backend compatibility
const getMimeType = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
  };
  return map[ext || ""] || "application/octet-stream";
};

const UserIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectUserIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const submittingEvidence = useAppSelector(selectSubmittingEvidence);

  const indicator = useMemo<IIndicator | undefined>(
    () => indicators.find((i) => i._id === id),
    [indicators, id],
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "pdf"];

  /* --- ZIP EXTRACTION & TYPE VALIDATION --- */
  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    const rawFiles = Array.from(files);
    const extractedList: File[] = [];

    toast.loading("Processing and validating files...", { id: "zip-process" });

    try {
      for (const file of rawFiles) {
        const isZip =
          file.type === "application/zip" || file.name.endsWith(".zip");

        if (isZip) {
          const zip = new JSZip();
          const contents = await zip.loadAsync(file);
          const promises: Promise<void>[] = [];

          contents.forEach((relativePath, zipEntry) => {
            if (
              !zipEntry.dir &&
              !relativePath.includes("__MACOSX") &&
              !relativePath.split("/").pop()?.startsWith(".")
            ) {
              const p = zipEntry.async("blob").then((blob) => {
                const mimeType = getMimeType(zipEntry.name);
                const newFile = new File([blob], zipEntry.name, {
                  type: mimeType,
                });
                extractedList.push(newFile);
              });
              promises.push(p);
            }
          });
          await Promise.all(promises);
        } else {
          extractedList.push(file);
        }
      }

      // --- PRE-FLIGHT VALIDATION ---
      for (const f of extractedList) {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";

        // Check Type
        if (!ALLOWED_EXT.includes(ext)) {
          toast.error(`Invalid type: ${f.name}. Only Images & PDFs allowed.`, {
            id: "zip-process",
          });
          return;
        }

        // Check Size
        if (f.size > MAX_SIZE) {
          toast.error(`${f.name} exceeds 5MB limit.`, { id: "zip-process" });
          return;
        }
      }

      setSelectedFiles((prev) => [...prev, ...extractedList]);
      setDescriptions((prev) => [...prev, ...extractedList.map(() => "")]);
      toast.success("Files verified and added", { id: "zip-process" });
    } catch (error) {
      toast.error("Error reading files", { id: "zip-process" });
      console.error(error);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, value: string) => {
    setDescriptions((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const handleSubmit = async () => {
    if (!indicator || !selectedFiles.length) return;
    if (descriptions.some((d) => !d.trim())) {
      return toast.error("Description required for all files.");
    }

    try {
      await dispatch(
        submitIndicatorEvidence({
          id: indicator._id,
          files: selectedFiles,
          descriptions,
        }),
      ).unwrap();

      getSocket().emit("notification:new", {
        title: "Evidence Updated",
        message: `New documents added to ${indicator.indicatorTitle}`,
        targetUserId: indicator.createdBy,
      });

      setSelectedFiles([]);
      setDescriptions([]);
      toast.success("Evidence uploaded successfully");
    } catch (err: any) {
      // Catching the backend "Only image files..." error here
      toast.error(err || "Upload failed");
    }
  };

  if (!indicator && !loading) return <NotFound navigate={navigate} />;
  if (!indicator) return <LoadingRecords />;

  const dueTime = new Date(indicator.dueDate).getTime();
  const isOverdue = now > dueTime;
  const canSubmit = indicator.status !== "approved";
  const isRevision = indicator.rejectionCount > 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E3A2B] selection:bg-emerald-100">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 sticky top-0 z-[60]">
        <div
          className={`h-full transition-all duration-1000 ${isRevision && indicator.status === "rejected" ? "bg-orange-500" : "bg-[#C69214]"}`}
          style={{ width: `${indicator.progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 hover:text-[#1E3A2B] mb-12 transition-all"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Audit Index
        </button>

        <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-16">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-[#C69214]" />
                <span className="text-[10px] font-black text-[#C69214] uppercase tracking-widest">
                  Case ID: {indicator._id.slice(-8).toUpperCase()}
                </span>
              </div>
              {isRevision && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-600 animate-pulse">
                  <History size={10} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    Revision Round: {indicator.rejectionCount}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-3xl font-serif font-bold leading-tight mb-6">
              {indicator.indicatorTitle}
            </h1>
            <div className="flex flex-wrap gap-4">
              <Badge
                icon={<ShieldCheck size={12} />}
                label="Encrypted Storage"
                color="bg-emerald-50 text-emerald-700 border-emerald-100"
              />
              <Badge
                icon={<Lock size={12} />}
                label="Read-Only Evidence"
                color="bg-blue-50 text-blue-700 border-blue-100"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div
              className={`rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group transition-colors duration-500 ${isRevision && indicator.status === "rejected" ? "bg-orange-600 shadow-orange-900/20" : "bg-[#1E3A2B] shadow-emerald-950/20"}`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <ShieldCheck size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                Audit Completion
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-serif font-bold">
                  {indicator.progress}
                </span>
                <span className="text-xl font-serif opacity-60">%</span>
              </div>
            </div>
          </div>
        </header>

        {indicator.status === "rejected" && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border-2 border-rose-100 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-start shadow-sm">
              <div className="p-4 bg-rose-50 rounded-2xl text-rose-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-rose-900 mb-2 tracking-widest flex items-center gap-2">
                  <History size={14} /> Revision Required (Attempt #
                  {indicator.rejectionCount})
                </h3>
                <p className="text-gray-600 leading-relaxed italic italic">
                  "{indicator.notes[indicator.notes.length - 1]?.text}"
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
              <StatCard
                label="Due Date"
                value={new Date(indicator.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <StatCard
                label="Countdown"
                value={isOverdue ? "OVERDUE" : formatDuration(dueTime - now)}
                highlight={isOverdue ? "text-rose-500" : "text-emerald-600"}
              />
              <StatCard label="Measure Unit" value={indicator.unitOfMeasure} />
              <StatCard
                label="Audit Status"
                value={indicator.status}
                highlight={
                  indicator.status === "rejected"
                    ? "text-rose-600"
                    : "text-[#C69214]"
                }
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <FileText size={16} className="text-[#C69214]" /> Evidence
                  Registry
                </h2>
                <span className="text-[10px] font-bold py-1 px-3 bg-white border rounded-full text-gray-400">
                  {indicator.evidence.length} Verified Documents
                </span>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                {indicator.evidence.length ? (
                  <div className="divide-y divide-gray-50">
                    {indicator.evidence.map((file, idx) => (
                      <EvidenceRow
                        key={`${file.publicId}-${idx}`}
                        file={file}
                        onPreview={() => setPreviewFile(file)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText size={24} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Registry Empty
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            {canSubmit ? (
              <div className="sticky top-12">
                <div
                  className={`bg-white rounded-[2.5rem] border shadow-xl p-8 relative overflow-hidden transition-colors ${isRevision ? "border-orange-100" : "border-gray-100"}`}
                >
                  <h2
                    className={`text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 ${isRevision ? "text-orange-600" : ""}`}
                  >
                    <Plus
                      size={16}
                      className={
                        isRevision ? "text-orange-500" : "text-[#C69214]"
                      }
                    />
                    {isRevision ? "Submit Revision" : "Submit Assets"}
                  </h2>

                  <label
                    className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 cursor-pointer transition-all duration-500 ${isRevision ? "border-orange-100 hover:border-orange-400 hover:bg-orange-50/30" : "border-gray-100 hover:border-[#C69214] hover:bg-emerald-50/10"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${isRevision ? "bg-orange-50 text-orange-400 group-hover:text-orange-600" : "bg-gray-50 text-gray-400 group-hover:text-[#C69214]"}`}
                    >
                      <Upload size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#1E3A2B]">
                      Select Files / ZIP
                    </span>
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                  </label>

                  <div className="mt-8 space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="group bg-gray-50 rounded-2xl p-4 border border-transparent hover:border-gray-200 transition-all"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText
                              size={12}
                              className="text-[#C69214] shrink-0"
                            />
                            <span className="text-[11px] font-bold truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            className="text-gray-300 hover:text-rose-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          className="w-full text-[11px] bg-white border border-gray-100 rounded-xl p-3 focus:ring-1 focus:ring-[#C69214] outline-none transition-all resize-none"
                          placeholder="Provide context for this file..."
                          value={descriptions[i]}
                          onChange={(e) => updateDescription(i, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFiles.length || submittingEvidence}
                    className={`w-full mt-8 py-5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl disabled:opacity-20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isRevision ? "bg-orange-600 shadow-orange-900/40" : "bg-[#1E3A2B] shadow-emerald-900/40"}`}
                  >
                    {submittingEvidence ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                        Uploading
                      </>
                    ) : isRevision ? (
                      "Push Final Revision"
                    ) : (
                      "Verify & Submit"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-[3rem] bg-gray-50/50">
                <Lock
                  size={32}
                  className="mx-auto text-gray-300 mb-4 opacity-40"
                />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                  Registry Locked
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {previewFile && (
        <EvidencePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const Badge = ({ icon, label, color }: any) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${color}`}
  >
    {icon} {label}
  </div>
);

const StatCard = ({ label, value, highlight = "text-gray-900" }: any) => (
  <div className="bg-white p-6 flex flex-col gap-2">
    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
      {label}
    </span>
    <span className={`text-sm font-bold truncate ${highlight}`}>{value}</span>
  </div>
);

const EvidenceRow = ({
  file,
  onPreview,
}: {
  file: IEvidence;
  onPreview: () => void;
}) => (
  <div className="group flex justify-between items-center p-6 hover:bg-[#F8F9FA] transition-all duration-300">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1E3A2B] group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
        <FileText size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-[#1E3A2B] mb-1 group-hover:translate-x-1 transition-transform">
          {file.fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-[#C69214] bg-orange-50 px-1.5 py-0.5 rounded">
            Exhibited
          </span>
          <p className="text-[10px] text-gray-400 font-medium">
            {file.description || "No context provided"}
          </p>
        </div>
      </div>
    </div>
    <button
      onClick={onPreview}
      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl border border-gray-100 bg-white hover:bg-[#1E3A2B] hover:text-white hover:border-[#1E3A2B] transition-all duration-300 shadow-sm"
    >
      Open Exhibit <ChevronRight size={12} />
    </button>
  </div>
);

const LoadingRecords = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <div className="relative w-16 h-16 mb-8">
      <div className="absolute inset-0 border-4 border-gray-50 rounded-full" />
      <div className="absolute inset-0 border-4 border-[#C69214] rounded-full border-t-transparent animate-spin" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">
      Syncing Vault
    </p>
  </div>
);

const NotFound = ({ navigate }: any) => (
  <div className="flex flex-col items-center justify-center h-screen text-center p-6 bg-[#F8F9FA]">
    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl mb-8">
      <AlertCircle size={40} className="text-rose-200" />
    </div>
    <h2 className="text-2xl font-serif font-bold mb-4 text-[#1E3A2B]">
      Registry Link Broken
    </h2>
    <button
      onClick={() => navigate(-1)}
      className="group flex items-center gap-3 px-10 py-4 bg-[#1E3A2B] text-white text-[10px] font-black uppercase rounded-2xl tracking-[0.2em] shadow-2xl hover:-translate-y-1 transition-all"
    >
      <ArrowLeft
        size={14}
        className="group-hover:-translate-x-1 transition-transform"
      />{" "}
      Return to Index
    </button>
  </div>
);

export default UserIndicatorDetail;
