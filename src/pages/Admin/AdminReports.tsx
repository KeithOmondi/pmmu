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
  clearPdf,
} from "../../store/slices/reportsSlice";
import {
  Loader2,
  Calendar,
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
} from "lucide-react";
import { isWithinInterval, startOfQuarter, endOfQuarter } from "date-fns";
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
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // CRITICAL: Fetch ALL indicators for administrative oversight
  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  // --- PDF Blob Handler ---
  useEffect(() => {
    if (lastPdfBlob) {
      const url = window.URL.createObjectURL(lastPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Admin_Global_Report_${reportType}_${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      dispatch(clearPdf());
      toast.success("Full Organizational Report Downloaded");
    }
  }, [lastPdfBlob, dispatch, reportType]);

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
        return selectedIndicatorId
          ? base.filter((i) => i._id === selectedIndicatorId)
          : base;
      case "weekly":
        const startWeek = new Date(now);
        startWeek.setDate(now.getDate() - 7);
        return base.filter((i) => new Date(i.createdAt) >= startWeek);
      case "quarterly":
        return base.filter((i) =>
          isWithinInterval(new Date(i.createdAt), {
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

  const stats = useMemo(
    () => ({
      total: filteredIndicators.length,
      completed: filteredIndicators.filter((i) => i.progress === 100).length,
      pending: filteredIndicators.filter((i) => i.status === "pending").length,
      avgProgress: filteredIndicators.length
        ? Math.round(
            filteredIndicators.reduce((a, b) => a + (b.progress || 0), 0) /
              filteredIndicators.length
          )
        : 0,
    }),
    [filteredIndicators]
  );

  // --- Global Reporting Handlers ---
  const handlePreview = async () => {
    try {
      // id: undefined tells the backend to pull global data for Admins
      await dispatch(
        fetchReportHtml({
          type: reportType,
          id: reportType === "single" ? selectedIndicatorId! : undefined,
        })
      ).unwrap();
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error(
        "Global compilation failed. Ensure your account has Admin clearance."
      );
    }
  };

  const handleDownload = () => {
    dispatch(
      downloadReportPdf({
        type: reportType,
        id: reportType === "single" ? selectedIndicatorId! : undefined,
      })
    );
  };

  if (loadingIndicators)
    return <LoadingScreen message="Unlocking Global Registry..." />;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8fafc] space-y-8 animate-in fade-in duration-700">
      {/* Visual Accent */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-[#1a3a32]/5 blur-[120px] -z-10 rounded-full" />

      {/* Admin Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-white">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] mb-2 font-bold uppercase tracking-[0.3em] text-[10px]">
            <ShieldCheck size={14} className="animate-pulse" /> Administrative
            Access Enabled
          </div>
          <h1 className="text-4xl font-black text-[#1a3a32] tracking-tight">
            Admin Reports <span className="text-[#c2a336]">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Global monitoring and cross-departmental performance verification.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            onClick={handlePreview}
            icon={<Eye size={18} />}
            label="Full Preview"
            variant="secondary"
            loading={loadingReport}
          />
          <ActionButton
            onClick={handleDownload}
            icon={<Download size={18} />}
            label="Export Global PDF"
            variant="primary"
            loading={loadingReport}
          />
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Global Volume"
          value={stats.total}
          icon={<Globe />}
          color="blue"
        />
        <StatCard
          label="Org. Efficiency"
          value={`${stats.avgProgress}%`}
          icon={<BarChart3 />}
          color="emerald"
        />
        <StatCard
          label="Total Approved"
          value={stats.completed}
          icon={<CheckCircle2 />}
          color="amber"
        />
        <StatCard
          label="Total Pending"
          value={stats.pending}
          icon={<AlertCircle />}
          color="rose"
        />
      </div>

      {/* Search & Broad Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center">
        <div className="xl:col-span-2 flex flex-wrap gap-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search across all users and groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#c2a336]/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar size={16} className="text-[#c2a336]" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="bg-transparent border-none text-sm font-bold text-[#1a3a32] focus:ring-0 cursor-pointer py-3"
            >
              <option value="general">Global Summary</option>
              <option value="weekly">Global Weekly</option>
              <option value="quarterly">Global Quarterly</option>
              <option value="group">Departmental Units</option>
              <option value="single">Isolated Record</option>
            </select>
          </div>
        </div>

        {reportType === "single" && (
          <div className="animate-in slide-in-from-right-4">
            <select
              value={selectedIndicatorId || ""}
              onChange={(e) => setSelectedIndicatorId(e.target.value)}
              className="w-full p-4 bg-white border border-[#c2a336]/30 rounded-2xl text-sm font-bold text-[#1a3a32] shadow-lg shadow-[#c2a336]/5"
            >
              <option value="">Choose specific indicator...</option>
              {indicators.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.indicatorTitle}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <IndicatorsTable indicators={filteredIndicators} />

      {/* Global Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 overflow-hidden">
          <div
            className="absolute inset-0 bg-[#1a3a32]/90 backdrop-blur-md"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative bg-white w-full max-w-6xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-[#c2a336]">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-[#1a3a32] text-xl tracking-tighter uppercase">
                    Organizational Master Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Unrestricted Admin View
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a5a4d] transition-all"
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6 lg:p-12">
              <div className="bg-white mx-auto max-w-5xl shadow-2xl min-h-full rounded-2xl p-4 md:p-16 border border-slate-200">
                {previewHtml ? (
                  <div
                    className="report-preview-container prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-[#c2a336] mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Aggregating Global Data...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const ActionButton = ({ onClick, icon, label, variant, loading }: any) => {
  const styles =
    variant === "primary"
      ? "bg-[#c2a336] text-[#1a3a32] hover:bg-[#d4b54a]"
      : "bg-[#1a3a32] text-[#c2a336] hover:bg-[#244d42]";
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${styles} flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <>
          {icon} {label}
        </>
      )}
    </button>
  );
};

const StatCard = ({ label, value, icon, color }: any) => {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-[#1a3a32] tracking-tighter tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={`p-4 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}
        >
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
    </div>
  );
};

const IndicatorsTable = ({ indicators }: { indicators: IIndicator[] }) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#1a3a32] text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
            <th className="px-8 py-5">Global Indicator</th>
            <th className="px-8 py-5">Assignment Scope</th>
            <th className="px-8 py-5 text-center">Status</th>
            <th className="px-8 py-5 text-right">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {indicators.map((i) => (
            <tr
              key={i._id}
              className="hover:bg-slate-50/80 transition-all group"
            >
              <td className="px-8 py-6">
                <div className="font-bold text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors">
                  {i.indicatorTitle}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                  <ChevronRight size={10} className="text-[#c2a336]" />{" "}
                  {i.category?.title || "Org. Registry"}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      i.assignedToType === "individual"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {i.assignedToType === "individual" ? (
                      <Users size={14} />
                    ) : (
                      <Briefcase size={14} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-600 capitalize">
                    {i.assignedToType}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusStyles(
                    i.status
                  )}`}
                >
                  {i.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-black text-[#1a3a32]">
                    {i.progress}%
                  </span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a3a32] rounded-full transition-all duration-700"
                      style={{ width: `${i.progress}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-slate-50 text-slate-500 border-slate-100";
  }
};

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8fafc]">
    <Loader2 className="w-16 h-16 animate-spin text-[#1a3a32] stroke-[1px]" />
    <p className="text-[#1a3a32] font-black uppercase tracking-[0.4em] text-[10px] mt-8">
      {message}
    </p>
  </div>
);

export default AdminReports;
