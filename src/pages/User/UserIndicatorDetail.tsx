import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectUserIndicators,
  selectIndicatorsLoading,
  selectSubmittingEvidence,
  submitIndicatorEvidence,
  downloadEvidence,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { getSocket } from "../../utils/socket";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  FileCheck,
  Download,
  ShieldCheck,
  Clock,
  Plus,
  X,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

/* ===================================== HELPERS ===================================== */
const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m remaining`;
};

/* ===================================== COMPONENT ===================================== */
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

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...arr]);
    setDescriptions((prev) => [...prev, ...arr.map(() => "")]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, val: string) => {
    setDescriptions((prev) => prev.map((d, i) => (i === index ? val : d)));
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length || !indicator) return;
    if (descriptions.some((d) => !d.trim()))
      return toast.error("Please provide a description for every file.");

    try {
      await dispatch(
        submitIndicatorEvidence({
          id: indicator._id,
          files: selectedFiles,
          descriptions,
          zipParent: selectedFiles.length > 1 ? `zip-${Date.now()}` : undefined,
        }),
      ).unwrap();

      getSocket().emit("notification:new", {
        title: "Evidence Re-Submitted",
        message: `Updated evidence submitted for "${indicator.indicatorTitle}".`,
        targetUserId: indicator.createdBy,
      });

      setSelectedFiles([]);
      setDescriptions([]);
      toast.success("Evidence submitted for review!");
    } catch {
      toast.error("Failed to submit evidence");
    }
  };

  if (!indicator && !loading) return <NotFound navigate={navigate} />;
  if (!indicator) return <LoadingRecords />;

  const dueTime = new Date(indicator.dueDate).getTime();
  const isOverdue = now > dueTime;
  const canSubmit =
    now >= new Date(indicator.startDate).getTime() &&
    !["approved", "completed"].includes(indicator.status);
  const rejectionNote =
    indicator.status === "rejected"
      ? indicator.notes?.[indicator.notes.length - 1]
      : null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 min-h-screen bg-[#FDFDFD] text-[#1E3A2B]">
      {/* Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center text-[10px] font-black tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-all mb-10"
      >
        <ArrowLeft
          size={14}
          className="mr-2 transition-transform group-hover:-translate-x-1"
        />
        Back to Dashboard
      </button>

      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="flex-1">
          <span className="inline-block text-[10px] font-black text-[#C69214] uppercase tracking-widest bg-[#F9F4E8] px-3 py-1 rounded-md mb-4">
            Registry Entry #{indicator._id.slice(-6).toUpperCase()}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            {indicator.indicatorTitle}
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
            Please ensure all uploaded documents are legible and comply with
            audit standards. Once submitted, your progress will be reviewed by
            the authorized auditor.
          </p>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-6 min-w-[240px]">
          <div className="bg-[#F9F4E8] p-4 rounded-xl">
            <ShieldCheck className="text-[#C69214]" size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Verified Progress
            </p>
            <p className="text-4xl font-serif font-bold">
              {indicator.progress}%
            </p>
          </div>
        </div>
      </header>

      {/* Rejection Alert */}
      {rejectionNote && (
        <div className="mb-10 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-2 text-red-700">
            <AlertCircle size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest">
              Auditor Feedback
            </h3>
          </div>
          <p className="text-sm text-red-800 leading-relaxed font-medium">
            {rejectionNote.text}
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Stats & Existing Evidence */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <Stat
              label="Deadline"
              value={new Date(indicator.dueDate).toLocaleDateString("en-GB")}
            />
            <Stat
              label="Time Clock"
              value={isOverdue ? "OVERDUE" : formatDuration(dueTime - now)}
              valueClass={isOverdue ? "text-red-600" : "text-blue-600"}
              icon={<Clock size={12} />}
            />
            <Stat label="Unit" value={indicator.unitOfMeasure} />
            <Stat
              label="Status"
              value={indicator.status.toUpperCase()}
              valueClass="text-[#C69214]"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h2 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <FileCheck size={16} className="text-[#C69214]" /> Evidence
                Registry
              </h2>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {indicator.evidence.length} Record
                {indicator.evidence.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {indicator.evidence.length > 0 ? (
                indicator.evidence.map((file) => (
                  <EvidenceRow
                    key={file.publicId}
                    file={file}
                    onDownload={() =>
                      dispatch(
                        downloadEvidence({
                          indicatorId: indicator._id,
                          publicId: file.publicId,
                          fileName: file.fileName,
                        }),
                      )
                    }
                  />
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm italic">
                  No evidence uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upload Section */}
        <aside className="lg:col-span-4">
          {canSubmit ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xl sticky top-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Plus size={16} className="text-[#C69214]" /> New Submission
              </h2>

              <label className="group flex flex-col items-center border-2 border-dashed border-gray-200 rounded-2xl p-10 cursor-pointer hover:border-[#C69214] hover:bg-[#F9F4E8]/30 transition-all">
                <div className="bg-gray-50 p-4 rounded-full group-hover:bg-white transition-colors">
                  <Upload
                    size={24}
                    className="text-gray-400 group-hover:text-[#C69214]"
                  />
                </div>
                <span className="text-[11px] font-black mt-4 uppercase tracking-tighter">
                  Browse Registry Files
                </span>
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </label>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-8 space-y-4">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-4 rounded-xl relative border border-gray-100"
                    >
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full p-1 hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-[10px] font-bold truncate pr-4 mb-2">
                        {file.name}
                      </p>
                      <input
                        type="text"
                        placeholder="Describe this evidence..."
                        className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C69214]"
                        value={descriptions[idx]}
                        onChange={(e) => updateDescription(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedFiles.length || submittingEvidence}
                className="w-full mt-8 py-4 rounded-xl bg-[#1E3A2B] text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a4f3b] transition-all shadow-lg active:scale-[0.98]"
              >
                {submittingEvidence
                  ? "Processing Submission..."
                  : "Finalize Submission"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <ShieldCheck className="mx-auto text-gray-300 mb-4" size={32} />
              <p className="text-xs font-bold text-gray-400 uppercase">
                Submissions Locked
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

/* ===================================== SUB COMPONENTS ===================================== */
const Stat = ({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest">
      {label}
    </p>
    <div
      className={`flex items-center gap-1.5 text-sm font-bold ${valueClass || "text-[#1E3A2B]"}`}
    >
      {icon} {value}
    </div>
  </div>
);

const EvidenceRow = ({
  file,
  onDownload,
}: {
  file: IEvidence;
  onDownload: () => void;
}) => (
  <div className="flex items-center justify-between p-6 hover:bg-gray-50/80 transition-colors group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
        <FileText size={20} className="text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#1E3A2B]">{file.fileName}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-tight">
          {file.description || "No description provided"}
        </p>
      </div>
    </div>
    <button
      onClick={onDownload}
      className="p-2 text-gray-400 hover:text-[#C69214] hover:bg-[#F9F4E8] rounded-full transition-all"
      title="Download Evidence"
    >
      <Download size={18} />
    </button>
  </div>
);

const LoadingRecords = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#FDFDFD]">
    <div className="w-10 h-10 border-2 border-[#C69214]/10 border-t-[#C69214] rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
      Loading Registry
    </p>
  </div>
);

const NotFound = ({ navigate }: { navigate: (n: number) => void }) => (
  <div className="flex flex-col items-center justify-center h-screen text-center p-6">
    <div className="bg-red-50 p-6 rounded-full mb-6">
      <AlertCircle className="text-red-500" size={48} />
    </div>
    <h2 className="text-2xl font-serif font-bold mb-2">Record Not Found</h2>
    <p className="text-gray-500 text-sm mb-8">
      The requested indicator could not be located in the registry.
    </p>
    <button
      onClick={() => navigate(-1)}
      className="px-8 py-3 bg-[#1E3A2B] text-white text-[10px] font-black uppercase tracking-widest rounded-full"
    >
      Return to Dashboard
    </button>
  </div>
);

export default UserIndicatorDetail;
