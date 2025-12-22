import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  selectUserIndicators,
  selectIndicatorsLoading,
  submitIndicatorEvidence,
} from "../../store/slices/indicatorsSlice";
import { addNotification } from "../../store/slices/notificationsSlice"; // Import this
import { getSocket } from "../../utils/socket";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  FileText,
  UploadCloud,
  X,
  ShieldCheck,
  FileCheck,
  History,
  FilePlus,
} from "lucide-react";

const UserIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectUserIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const currentUser = useAppSelector((state) => state.auth.user);

  const indicator = useMemo(
    () => indicators.find((i) => i._id === id),
    [indicators, id]
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    setFileDescriptions((prev) => [...prev, ...files.map(() => "")]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setFileDescriptions((prev) => {
      const newDescriptions = [...prev];
      newDescriptions[index] = value;
      return newDescriptions;
    });
  };

  const handleSubmit = async () => {
    if (!indicator || selectedFiles.length === 0) return;
    setSubmitting(true);

    try {
      // 1. Submit Evidence to API
      await dispatch(
        submitIndicatorEvidence({
          id: indicator._id,
          files: selectedFiles,
          descriptions: fileDescriptions,
        })
      ).unwrap();

      // 2. Create the Notification Object
      const newNotification = {
        _id: Math.random().toString(36).substr(2, 9), // Temp ID
        title: "Evidence Submitted",
        message: `Exhibits filed for: ${indicator.indicatorTitle}`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // 3. Update Redux Directly (This makes the Bell in UserHeader light up instantly)
      dispatch(addNotification(newNotification));

      // 4. Notify through Socket (For the server/admin to see)
      const socket = getSocket();
      const targetId = indicator.createdBy || currentUser?._id;

      if (targetId) {
        socket.emit("notification:new", {
          ...newNotification,
          targetUserId: targetId,
        });
      }

      // 5. Reset Form
      setSelectedFiles([]);
      setFileDescriptions([]);
    } catch (err) {
      console.error("Failed to submit evidence:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-xs">
          {submitting ? "Submitting Evidence..." : "Retrieving Case Details..."}
        </p>
      </div>
    );
  }

  if (!indicator) {
    return (
      <div className="p-20 text-center text-[#1a3a32] font-black italic">
        The requested record could not be found in the registry.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em] hover:text-[#c2a336] transition-colors"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Portfolio
        </button>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/[0.02] p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <div
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(
                indicator.status
              )}`}
            >
              {indicator.status}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#c2a336] mb-4 font-black uppercase tracking-[0.25em] text-[10px]">
            <ShieldCheck size={14} /> Mandate Specification
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#1a3a32] tracking-tighter leading-tight mb-6 max-w-2xl">
            {indicator.indicatorTitle}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-gray-50">
            <DetailItem
              label="Unit of Measure"
              value={indicator.unitOfMeasure}
              icon={<FileText size={14} />}
            />
            <DetailItem
              label="Filing Date"
              value={new Date(indicator.startDate).toLocaleDateString()}
              icon={<Calendar size={14} />}
            />
            <DetailItem
              label="Deadline"
              value={new Date(indicator.dueDate).toLocaleDateString()}
              icon={<Calendar size={14} />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-full">
              <h2 className="text-xs font-black text-[#1a3a32] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <History size={16} className="text-[#c2a336]" /> Evidence
                Archive
              </h2>
              {indicator.evidence.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                  <p className="text-[#8c94a4] text-xs font-bold italic">
                    No documents filed.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {indicator.evidence.map((file: any, index: number) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-2xl border border-gray-100 text-[#1a3a32] font-bold text-sm"
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm text-[#c2a336]">
                        <FileCheck size={16} />
                      </div>
                      <span className="truncate">
                        {file.fileName || "Stored Exhibit"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#1a3a32] rounded-[2rem] p-8 shadow-xl shadow-[#1a3a32]/10 text-white h-full flex flex-col">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-[#c2a336]">
                <FilePlus size={16} /> New Depository
              </h2>
              <div className="flex-1 space-y-6">
                <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[1.5rem] hover:border-[#c2a336] hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} className="text-[#c2a336]" />
                    </div>
                    <p className="mb-1 text-xs font-black uppercase tracking-widest">
                      Click to upload exhibits
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 text-[11px] font-bold bg-white/5 px-4 py-3 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[240px] flex items-center gap-2 text-white/80">
                            <FileText size={12} className="text-[#c2a336]" />{" "}
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-rose-500/20 rounded-md text-rose-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={fileDescriptions[index]}
                          onChange={(e) =>
                            handleDescriptionChange(index, e.target.value)
                          }
                          placeholder="Describe this evidence..."
                          className="w-full px-3 py-1 rounded-md text-black text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                <button
                  disabled={selectedFiles.length === 0 || submitting}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#c2a336] text-[#1a3a32] text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all shadow-lg active:scale-[0.98]"
                >
                  <UploadCloud size={16} /> Submit{" "}
                  {selectedFiles.length > 0 && `(${selectedFiles.length})`}{" "}
                  Exhibits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: any) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#8c94a4] uppercase tracking-widest">
      <span className="text-[#c2a336]">{icon}</span> {label}
    </div>
    <div className="text-sm font-black text-[#1a3a32] tracking-tight truncate">
      {value}
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

export default UserIndicatorDetail;
