// src/pages/User/UserIndicatorDetail.tsx
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
  Clock,
  AlertCircle,
  FileCheck,
  Download,
  Calendar,
  ShieldCheck,
} from "lucide-react";

/* ===================================== TYPES ===================================== */
type EvidenceWithMeta = IEvidence & { createdAt?: string };

/* ===================================== CONSTANTS ===================================== */


/* ===================================== HELPERS ===================================== */
const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);
  const seconds = Math.floor((abs / 1000) % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours && !minutes) parts.push(`${seconds}s`);

  return parts.join(" ");
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
    [indicators, id]
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  /* ======================= REAL-TIME CLOCK ======================= */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!indicator && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle className="text-red-700 w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold text-[#1E3A2B]">Record Not Found</h2>
        <p className="text-gray-600 mb-6">
          The requested indicator could not be retrieved.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-[#1E3A2B] text-white rounded-md hover:bg-opacity-90 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!indicator) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C69214] mb-4"></div>
        <p className="text-[#1E3A2B] font-serif italic font-semibold tracking-wide">
          Loading Official Judiciary Records...
        </p>
      </div>
    );
  }

  /* ======================= TIME DERIVATIONS ======================= */
  const startTime = new Date(indicator.startDate).getTime();
  const dueTime = new Date(indicator.dueDate).getTime();

  const canSubmit = now >= startTime;
  const isOverdue = now > dueTime;
  const timeUntilStart = startTime - now;
  const timeUntilDue = dueTime - now;

  /* ======================= START COUNTDOWN ======================= */
  const startCountdownLabel = useMemo(() => {
    if (canSubmit) return null;
    return formatDuration(timeUntilStart);
  }, [canSubmit, timeUntilStart]);

  /* ======================= SUBMISSION INFO ======================= */
  const submissionInfo = useMemo(() => {
    if (!indicator.evidence.length) return { status: "notSubmitted" as const };

    const times = indicator.evidence
      .map((e: EvidenceWithMeta) =>
        e.createdAt ? new Date(e.createdAt).getTime() : NaN
      )
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);

    if (!times.length) return { status: "notSubmitted" as const };

    const diff = dueTime - times[0];

    return {
      status: "submitted" as const,
      early: diff > 0,
      label: formatDuration(diff),
    };
  }, [indicator.evidence, dueTime]);

  /* ======================= HANDLERS ======================= */
  const handleFileChange = (files: FileList | null) => {
    if (!files || !canSubmit) return;
    const arr = Array.from(files);
    setSelectedFiles(arr);
    setDescriptions(arr.map(() => ""));
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length || !canSubmit) return;

    try {
      await dispatch(
        submitIndicatorEvidence({
          id: indicator._id,
          files: selectedFiles,
          descriptions,
        })
      ).unwrap();

      getSocket().emit("notification:new", {
        title: "Evidence Submitted",
        message: `New evidence for "${indicator.indicatorTitle}"`,
        targetUserId: indicator.createdBy,
      });

      setSelectedFiles([]);
      setDescriptions([]);
    } catch (err) {
      // Optional: handle local error toast if needed
    }
  };

  /* ======================= RENDER ======================= */
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 bg-gray-50 min-h-screen font-sans text-[#1E3A2B]">
      {/* Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-bold tracking-widest text-[#1E3A2B] opacity-70 hover:opacity-100 transition-all uppercase"
      >
        <ArrowLeft size={16} className="mr-2" /> Return to List
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-md border-l-[6px] border-[#C69214] p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ShieldCheck size={120} />
        </div>

        <div className="relative z-10">
          <span className="text-[10px] font-bold text-[#C69214] uppercase tracking-[0.2em]">
            Judiciary Indicator Detail
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mt-2 leading-tight">
            {indicator.indicatorTitle}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 border-t border-gray-100 pt-8">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Current Progress
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1E3A2B] h-full transition-all duration-1000"
                    style={{ width: `${indicator.progress}%` }}
                  ></div>
                </div>
                <p className="font-mono font-bold text-sm">
                  {indicator.progress}%
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Deadline Date
              </p>
              <p className="flex items-center gap-2 font-semibold text-sm">
                <Calendar size={14} className="text-[#C69214]" />
                {new Date(indicator.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Time Left
              </p>
              <p
                className={`flex items-center gap-2 font-bold text-sm ${
                  isOverdue ? "text-red-700" : "text-[#1E3A2B]"
                }`}
              >
                <Clock size={14} />
                {isOverdue
                  ? "OFFICIAL DEADLINE EXPIRED"
                  : formatDuration(timeUntilDue)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Compliance Status
              </p>
              {submissionInfo.status === "notSubmitted" ? (
                <p className="text-gray-400 text-sm font-semibold italic">
                  Awaiting Evidence
                </p>
              ) : (
                <p
                  className={`text-sm font-bold flex items-center gap-1 ${
                    submissionInfo.early ? "text-green-800" : "text-red-800"
                  }`}
                >
                  <FileCheck size={14} />
                  {submissionInfo.label}{" "}
                  {submissionInfo.early
                    ? "Early Submission"
                    : "Late Submission"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evidence List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
                Official Filing History
              </h2>
              <span className="text-xs bg-[#F9F4E8] text-[#C69214] px-3 py-1 rounded-full font-bold">
                {indicator.evidence.length} Records
              </span>
            </div>

            {!indicator.evidence.length ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FileCheck size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium italic">
                  No evidence has been officially filed yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {indicator.evidence.map((file: EvidenceWithMeta) => (
                  <div
                    key={file.publicId}
                    className="group flex justify-between items-center bg-white border border-gray-200 p-4 rounded-lg hover:border-[#C69214] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded group-hover:bg-[#F9F4E8] transition-colors">
                        <FileCheck size={20} className="text-[#1E3A2B]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#1E3A2B]">
                          {file.fileName}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                          <Calendar size={10} />
                          Filed on:{" "}
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleString("en-GB")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        dispatch(
                          downloadEvidence({
                            publicId: file.publicId,
                            fileName: file.fileName,
                          })
                        )
                      }
                      className="flex items-center gap-2 text-xs font-bold text-[#C69214] hover:text-[#1E3A2B] border-b border-transparent hover:border-[#1E3A2B] transition-all uppercase tracking-wider"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-1">
          {indicator.status !== "approved" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 sticky top-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#1E3A2B] mb-6 flex items-center gap-2">
                Submission Portal
              </h2>

              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all group
                  ${
                    canSubmit
                      ? "border-gray-200 hover:border-[#C69214] cursor-pointer hover:bg-[#F9F4E8]"
                      : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                  }`}
              >
                <div
                  className={`p-4 rounded-full mb-4 transition-colors ${
                    canSubmit
                      ? "bg-[#F9F4E8] group-hover:bg-[#C69214]"
                      : "bg-gray-100"
                  }`}
                >
                  <Upload
                    size={24}
                    className={
                      canSubmit
                        ? "text-[#C69214] group-hover:text-white"
                        : "text-gray-300"
                    }
                  />
                </div>
                <p className="text-xs font-bold text-center leading-relaxed">
                  {canSubmit
                    ? "Drag & drop files here or click to browse"
                    : `Submission window opens in: ${startCountdownLabel}`}
                </p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-tighter">
                  PDF, DOCX, XLSX up to 10MB
                </p>
                <input
                  type="file"
                  multiple
                  hidden
                  disabled={!canSubmit}
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] font-bold text-[#C69214] uppercase tracking-wider">
                    Pending Selection ({selectedFiles.length})
                  </p>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] font-medium bg-gray-50 p-2 rounded truncate border border-gray-100 italic"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  !selectedFiles.length || submittingEvidence || !canSubmit
                }
                className={`mt-8 w-full py-4 rounded-md font-bold text-xs uppercase tracking-[0.15em] shadow-lg transition-all
                  ${
                    !selectedFiles.length || submittingEvidence || !canSubmit
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#1E3A2B] text-white hover:bg-opacity-90 active:transform active:scale-95"
                  }
                `}
              >
                {submittingEvidence
                  ? "Processing Filing..."
                  : "Submit Official Evidence"}
              </button>

              <p className="mt-4 text-[10px] text-center text-gray-400 italic">
                By submitting, you confirm the accuracy of this documentation.
              </p>
            </div>
          ) : (
            <div className="bg-[#1E3A2B] rounded-lg shadow-sm p-8 text-center border-b-4 border-[#C69214]">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-[#C69214]" size={32} />
              </div>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm">
                Approved
              </h3>
              <p className="text-white/60 text-xs mt-2">
                This indicator has been verified and closed by the
                administration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserIndicatorDetail;
