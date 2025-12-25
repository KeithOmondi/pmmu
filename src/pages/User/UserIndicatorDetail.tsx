import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  selectUserIndicators,
  selectIndicatorsLoading,
  submitIndicatorEvidence,
} from "../../store/slices/indicatorsSlice";
import { addNotification } from "../../store/slices/notificationsSlice";
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
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ============================
   Helpers & Formatters
============================ */
const formatDuration = (ms: number) => {
  if (isNaN(ms)) return "0d 0h 0m";
  const absMs = Math.abs(ms);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((absMs / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${mins}m`;
};

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved": return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
    case "rejected": return "bg-rose-50 text-rose-600 border-rose-100";
    default: return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

/* ============================
   Custom Hooks
============================ */
const useCountdown = (dueDate: string | undefined) => {
  const calculateTimeLeft = () => {
    if (!dueDate) return null;
    const end = new Date(dueDate).getTime();
    const now = Date.now();
    
    if (isNaN(end)) return null;
    const difference = end - now;
    
    if (difference <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };

    return {
      expired: false,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); 
    return () => clearInterval(timer);
  }, [dueDate]);

  return timeLeft;
};

/* ============================
   Main Component
============================ */
const UserIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectUserIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);

  const indicator = useMemo(() => indicators.find((i) => i._id === id), [indicators, id]);

  /**
   * REFINED SUBMISSION LOGIC
   * Filters out invalid dates to prevent "NaN" errors in the header.
   */
  const submissionInfo = useMemo(() => {
    if (!indicator?.evidence || indicator.evidence.length === 0) return null;
    
    const deadline = new Date(indicator.dueDate).getTime();
    if (isNaN(deadline)) return null;

    // Filter for valid timestamps only
    const validSubmissions = indicator.evidence
      .map(ev => ev.createdAt ? new Date(ev.createdAt).getTime() : NaN)
      .filter(time => !isNaN(time))
      .sort((a, b) => a - b);

    // If we have items but no valid dates, we know it's submitted but can't calculate "early/late"
    if (validSubmissions.length === 0) return { unknownTime: true };
    
    const firstSubmission = validSubmissions[0];
    const diff = deadline - firstSubmission;

    return {
      isEarly: diff > 0,
      formatted: formatDuration(diff),
      unknownTime: false
    };
  }, [indicator]);

  const timeLeft = useCountdown(indicator?.dueDate);
  const isCloseToDeadline = timeLeft && !timeLeft.expired && timeLeft.days < 2;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      await dispatch(
        submitIndicatorEvidence({
          id: indicator._id,
          files: selectedFiles,
          descriptions: fileDescriptions,
        })
      ).unwrap();

      const newNotification = {
        _id: `temp-${Date.now()}`,
        title: "Task Submitted",
        message: `New exhibits filed for: ${indicator.indicatorTitle}`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      dispatch(addNotification(newNotification));

      const socket = getSocket();
      socket.emit("notification:new", {
        ...newNotification,
        targetUserId: indicator.createdBy || "admin", 
      });

      setSelectedFiles([]);
      setFileDescriptions([]);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-black uppercase tracking-[0.3em] text-[10px]">
          {submitting ? "Transmitting Exhibits..." : "Accessing Registry..."}
        </p>
      </div>
    );
  }

  if (!indicator) return <div className="p-20 text-center font-black">Record Not Found</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 lg:p-10 text-[#1a3a32]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em] hover:text-[#c2a336] transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </button>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 flex flex-col items-end gap-3">
               <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(indicator.status)}`}>
                 {indicator.status}
               </div>
               
               {submissionInfo ? (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-tight shadow-sm ${
                    submissionInfo.unknownTime || submissionInfo.isEarly 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {submissionInfo.unknownTime || submissionInfo.isEarly ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                    {submissionInfo.unknownTime 
                      ? "Task Submitted & Logged" 
                      : `Task Submitted ${submissionInfo.formatted} ${submissionInfo.isEarly ? 'Early' : 'Late'}`}
                  </div>
               ) : (
                 isCloseToDeadline && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 animate-pulse">
                      <Clock size={12} />
                      <span className="text-[10px] font-black uppercase">
                        Due in: {timeLeft?.days}d {timeLeft?.hours}h {timeLeft?.minutes}m
                      </span>
                    </div>
                 )
               )}
            </div>

            <div className="flex items-center gap-2 text-[#c2a336] mb-4 font-black uppercase tracking-[0.2em] text-[10px]">
              <ShieldCheck size={14} /> Official Mandate Detail
            </div>
            <h1 className="text-3xl font-black tracking-tighter max-w-2xl leading-none mb-8">
              {indicator.indicatorTitle}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t border-slate-50">
               <DetailItem label="Metric" value={indicator.unitOfMeasure} icon={<FileText size={14} />} />
               <DetailItem label="Effective" value={new Date(indicator.startDate).toLocaleDateString()} icon={<Calendar size={14} />} />
               <DetailItem 
                  label="Maturity" 
                  value={
                    timeLeft?.expired && !submissionInfo ? (
                      <span className="text-rose-600 font-black">Lapsed</span>
                    ) : (
                      new Date(indicator.dueDate).toLocaleDateString()
                    )
                  } 
                  icon={<Calendar size={14} />} 
               />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm h-full flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2"><History size={16} className="text-[#c2a336]" /> Evidence History</span>
                <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-400">{indicator.evidence?.length || 0}</span>
              </h2>
              
              <div className="flex-1 space-y-3">
                {!indicator.evidence || indicator.evidence.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-3xl">
                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Archive Empty</p>
                  </div>
                ) : (
                  <>
                    {indicator.evidence.slice(0, 4).map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-[#c2a336]/30 transition-colors">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-[#c2a336] group-hover:bg-[#1a3a32] group-hover:text-white transition-all"><FileCheck size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black truncate uppercase tracking-tight">{file.fileName || "Exhibit_"+idx}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Date N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {indicator.evidence.length > 4 && (
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-4 mt-2 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-[#c2a336] uppercase tracking-widest hover:bg-[#f4f0e6] hover:border-transparent transition-all"
                      >
                        View Full Archive (+{indicator.evidence.length - 4} More)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#1a3a32] rounded-[2.5rem] p-10 shadow-xl shadow-[#1a3a32]/10 text-white">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-[#c2a336]">
                <FilePlus size={18} /> Add New Exhibits
              </h2>
              
              <label className="relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/10 rounded-[2rem] hover:border-[#c2a336] hover:bg-white/5 transition-all cursor-pointer group mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={28} className="text-[#c2a336]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Drop files or click to browse</p>
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
              </label>

              {selectedFiles.length > 0 && (
                <div className="space-y-3 mb-8 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-[#c2a336]" />
                          <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Add a brief description for this record..." 
                        className="w-full bg-[#142d27] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c2a336]/50"
                        value={fileDescriptions[index]}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                disabled={selectedFiles.length === 0 || submitting}
                onClick={handleSubmit}
                className="w-full py-5 rounded-2xl bg-[#c2a336] text-[#1a3a32] text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-20 transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Submit {selectedFiles.length} Collected Exhibits
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-[#1a3a32]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-[#1a3a32] text-xl tracking-tighter">Full Evidence Archive</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Registry Record #{indicator._id.slice(-6)}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indicator.evidence?.map((file: any, idx: number) => (
                  <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] group hover:bg-white hover:border-[#c2a336]/20 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-2xl text-[#c2a336] shadow-sm group-hover:bg-[#1a3a32] group-hover:text-white transition-colors">
                        <FileCheck size={24} />
                      </div>
                      <button className="p-2 text-slate-300 hover:text-[#c2a336] transition-colors">
                        <Download size={18} />
                      </button>
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight mb-1 truncate">{file.fileName || `EXHIBIT_DATA_${idx + 1}`}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic mb-4">
                      "{file.description || "No description provided for this exhibit."}"
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                       <span className="text-[9px] font-black text-slate-300 uppercase">
                         {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Filed Registry'}
                       </span>
                       <span className="text-[9px] font-black text-[#c2a336] uppercase tracking-tighter">Index {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                All documents are encrypted and stored in the central judiciary registry.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon }: any) => (
  <div className="space-y-1 group">
    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#c2a336] transition-colors">
      {icon} {label}
    </div>
    <div className="text-sm font-black tracking-tight">{value}</div>
  </div>
);

export default UserIndicatorDetail;