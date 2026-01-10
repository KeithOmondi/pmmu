import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  fetchReportHtml,
  downloadReportPdf,
  selectReportsLoading,
  selectLastReportHtml,
  selectLastPdfBlob,
  type ReportType,
  type ReportRequestPayload,
  clearPdf,
} from "../../store/slices/reportsSlice";
import {
  Loader2,
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  Download,
  Eye,
  ChevronRight,
  ShieldCheck,
  X,
  FileText,
  Globe,
  Filter,
} from "lucide-react";
import {
  isWithinInterval,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import toast from "react-hot-toast";

const AdminReports: React.FC = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const indicators = useAppSelector(selectAllIndicators);
  const loadingIndicators = useAppSelector((state) => state.indicators.loading);
  const loadingReport = useAppSelector(selectReportsLoading);
  const previewHtml = useAppSelector(selectLastReportHtml);
  const lastPdfBlob = useAppSelector(selectLastPdfBlob);

  // --- Local State ---
  const [reportType, setReportType] = useState<ReportType>("general");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  // --- PDF Blob Handler ---
  useEffect(() => {
    if (lastPdfBlob) {
      const url = window.URL.createObjectURL(lastPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Judiciary_Performance_Report_${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      dispatch(clearPdf());
      toast.success("Executive PDF Exported Successfully");
    }
  }, [lastPdfBlob, dispatch]);

  // --- Unified Payload Helper ---
  const preparePayload = (): ReportRequestPayload => ({
    type: reportType,
    isAdmin: true,
    id: reportType === "single" && selectedIndicatorId ? selectedIndicatorId : undefined,
  });

  // --- Administrative Filter Logic ---
  const filteredIndicators = useMemo(() => {
    const now = new Date();
    let base = [...indicators];

    if (searchQuery) {
      base = base.filter((i) =>
        i.indicatorTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (reportType) {
      case "single":
        return selectedIndicatorId ? base.filter((i) => i._id === selectedIndicatorId) : [];
      case "weekly": {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return base.filter((i) => new Date(i.dueDate) >= sevenDaysAgo);
      }
      case "monthly":
        return base.filter((i) =>
          isWithinInterval(new Date(i.dueDate), {
            start: startOfMonth(now),
            end: endOfMonth(now),
          })
        );
      case "quarterly":
        return base.filter((i) =>
          isWithinInterval(new Date(i.dueDate), {
            start: startOfQuarter(now),
            end: endOfQuarter(now),
          })
        );
      case "group":
        return base.filter((i) => i.assignedToType === "group");
      default:
        return base;
    }
  }, [reportType, selectedIndicatorId, indicators, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredIndicators.length;
    const completed = filteredIndicators.filter((i) => ["completed", "approved"].includes(i.status)).length;
    const pending = filteredIndicators.filter((i) => i.status === "pending").length;
    const avgProgress = total ? Math.round(filteredIndicators.reduce((a, b) => a + (b.progress || 0), 0) / total) : 0;
    return { total, completed, pending, avgProgress };
  }, [filteredIndicators]);

  // --- Handlers ---
  const handlePreview = async () => {
    if (reportType === "single" && !selectedIndicatorId) {
      return toast.error("Please select a specific record for preview");
    }
    try {
      await dispatch(fetchReportHtml(preparePayload())).unwrap();
      setIsPreviewOpen(true);
    } catch (err: any) {
      toast.error("Compilation failed. Please try again.");
    }
  };

  const handleDownload = () => {
    if (reportType === "single" && !selectedIndicatorId) {
      return toast.error("Please select a specific record to export");
    }
    dispatch(downloadReportPdf(preparePayload()));
  };

  if (loadingIndicators) return <LoadingScreen message="Accessing Administrative Registry..." />;

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-[#f8fafc] space-y-8 animate-in fade-in duration-700">
      
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[#1a3a32] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Globe size={240} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#c2a336] mb-2 font-bold uppercase tracking-[0.3em] text-[10px]">
            <ShieldCheck size={14} className="animate-pulse" /> Authorized Personnel Access
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            Audit Reporting <span className="text-[#c2a336]">.</span>
          </h1>
          <p className="text-white/60 text-sm font-medium mt-1">
            Performance verification and departmental record auditing.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 w-full lg:w-auto">
          <button 
            onClick={handlePreview} 
            disabled={loadingReport}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-md border border-white/10"
          >
            {loadingReport ? <Loader2 className="animate-spin" size={16} /> : <Eye size={18} />} Preview
          </button>
          <button 
            onClick={handleDownload}
            disabled={loadingReport}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-[#c2a336] text-[#1a3a32] hover:bg-[#d4b54a] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            {loadingReport ? <Loader2 className="animate-spin" size={16} /> : <Download size={18} />} Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Records" value={stats.total} icon={<Globe />} color="blue" />
        <StatCard label="Avg. Efficiency" value={`${stats.avgProgress}%`} icon={<BarChart3 />} color="emerald" />
        <StatCard label="Verified" value={stats.completed} icon={<CheckCircle2 />} color="amber" />
        <StatCard label="Awaiting Action" value={stats.pending} icon={<AlertCircle />} color="rose" />
      </div>

      {/* Professional Filtering Controls */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search indicators by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#c2a336]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 px-5 bg-slate-50 rounded-2xl border border-slate-100">
            <Filter size={16} className="text-[#c2a336]" />
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as ReportType);
                setSelectedIndicatorId("");
              }}
              className="bg-transparent border-none text-[10px] font-black uppercase text-[#1a3a32] focus:ring-0 cursor-pointer py-4"
            >
              <option value="general">Comprehensive Summary</option>
              <option value="weekly">Weekly Overview</option>
              <option value="monthly">Monthly Overview</option>
              <option value="quarterly">Quarterly Overview</option>
              <option value="group">Departmental Units</option>
              <option value="single">Specific Case Record</option>
            </select>
          </div>

          {reportType === "single" && (
            <div className="flex items-center gap-3 bg-white px-5 rounded-2xl border border-[#c2a336]/30 shadow-lg shadow-[#c2a336]/5 animate-in slide-in-from-right-4">
              <FileText size={16} className="text-[#c2a336]" />
              <select
                value={selectedIndicatorId}
                onChange={(e) => setSelectedIndicatorId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-[#1a3a32] focus:ring-0 cursor-pointer py-4 min-w-[200px]"
              >
                <option value="">Select Specific Indicator...</option>
                {indicators.map((i) => (
                  <option key={i._id} value={i._id}>{i.indicatorTitle}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-black text-[#1a3a32] text-xl tracking-tight uppercase flex items-center gap-3">
            <BarChart3 className="text-[#c2a336]" size={20} /> Registry Preview
          </h2>
          <span className="text-[10px] font-black text-[#c2a336] bg-[#c2a336]/5 px-4 py-2 rounded-full uppercase tracking-widest">
            {filteredIndicators.length} Results Found
          </span>
        </div>
        <IndicatorsTable indicators={filteredIndicators} />
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <PreviewModal
          html={previewHtml}
          loading={loadingReport}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS (With Improved Styling) --- */

const StatCard = ({ label, value, icon, color }: any) => {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };
  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#1a3a32] tracking-tighter tabular-nums">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${colorMap[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

const IndicatorsTable = ({ indicators }: { indicators: IIndicator[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-[#1a3a32] text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
          <th className="px-8 py-5">Audit Indicator</th>
          <th className="px-8 py-5">Assignment Scope</th>
          <th className="px-8 py-5">Due Date</th>
          <th className="px-8 py-5 text-right">Progress</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {indicators.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">No records found.</td>
          </tr>
        ) : (
          indicators.map((i) => (
            <tr key={i._id} className="hover:bg-slate-50 transition-all group">
              <td className="px-8 py-6">
                <div className="font-bold text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors">{i.indicatorTitle}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                  <ChevronRight size={10} className="text-[#c2a336]" /> {i.category?.title || "Judiciary Registry"}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${i.assignedToType === "individual" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                    {i.assignedToType === "individual" ? <Users size={14} /> : <Briefcase size={14} />}
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                    {i.assignedToType}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6 text-xs font-bold text-slate-500">
                {new Date(i.dueDate).toLocaleDateString()}
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-black text-[#1a3a32]">{i.progress}%</span>
                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a3a32] transition-all duration-700" style={{ width: `${i.progress}%` }} />
                  </div>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const PreviewModal = ({ html, loading, onClose, onDownload }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
    <div className="absolute inset-0 bg-[#1a3a32]/95 backdrop-blur-md" onClick={onClose} />
    <div className="relative bg-white w-full max-w-6xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-2xl text-[#c2a336]">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-black text-[#1a3a32] text-xl tracking-tighter uppercase">Audit Preview</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confidential Reporting Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onDownload} className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a5a4d] transition-all">
            <Download size={14} /> Download PDF
          </button>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-12">
        <div className="bg-white mx-auto max-w-5xl shadow-2xl min-h-full rounded-2xl p-8 md:p-16 border border-slate-200">
          {loading || !html ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#c2a336] mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synthesizing Audit Records...</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  </div>
);

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8fafc]">
    <Loader2 className="w-16 h-16 animate-spin text-[#1a3a32] stroke-[1px]" />
    <p className="text-[#1a3a32] font-black uppercase tracking-[0.4em] text-[10px] mt-8">{message}</p>
  </div>
);

export default AdminReports;