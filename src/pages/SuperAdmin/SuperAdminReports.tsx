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
  selectReportsError,
  selectLastReportHtml,
  selectLastPdfBlob,
  type ReportType,
  clearReportHtml,
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
} from "lucide-react";
import {
  format,
  isWithinInterval,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";

const SuperAdminReports: React.FC = () => {
  const dispatch = useAppDispatch();

  // --- Data selectors ---
  const indicators = useAppSelector(selectAllIndicators);
  const loadingIndicators = useAppSelector((state) => state.indicators.loading);
  const loadingReport = useAppSelector(selectReportsLoading);
  const reportError = useAppSelector(selectReportsError);
  const lastReportHtml = useAppSelector(selectLastReportHtml);
  const lastPdfBlob = useAppSelector(selectLastPdfBlob);

  // --- Local state ---
  const [reportType, setReportType] = useState<ReportType>("general");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(
    null
  );
  const [filteredIndicators, setFilteredIndicators] = useState<IIndicator[]>(
    []
  );

  // --- Fetch indicators ---
  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  // --- Filter indicators based on report type ---
  useEffect(() => {
    const now = new Date();
    let filtered: IIndicator[] = [...indicators];

    switch (reportType) {
      case "single":
        filtered = indicators.filter((i) => i._id === selectedIndicatorId);
        break;
      case "weekly":
        const startWeek = new Date(now);
        startWeek.setDate(now.getDate() - now.getDay());
        const endWeek = new Date(startWeek);
        endWeek.setDate(startWeek.getDate() + 6);
        filtered = indicators.filter((i) => {
          const d = new Date(i.createdAt);
          return d >= startWeek && d <= endWeek;
        });
        break;
      case "monthly":
        filtered = indicators.filter(
          (i) =>
            new Date(i.createdAt).getMonth() === now.getMonth() &&
            new Date(i.createdAt).getFullYear() === now.getFullYear()
        );
        break;
      case "quarterly":
        filtered = indicators.filter((i) =>
          isWithinInterval(new Date(i.createdAt), {
            start: startOfQuarter(now),
            end: endOfQuarter(now),
          })
        );
        break;
      case "group":
        filtered = indicators.filter((i) => i.assignedToType === "group");
        break;
      default:
        filtered = [...indicators];
    }

    setFilteredIndicators(filtered);
  }, [reportType, selectedIndicatorId, indicators]);

  // --- Compute stats ---
  const stats = useMemo(
    () => ({
      total: filteredIndicators.length,
      completed: filteredIndicators.filter((i) => i.progress === 100).length,
      pending: filteredIndicators.filter((i) => i.status === "pending").length,
    }),
    [filteredIndicators]
  );

  // --- Handlers ---
  const handleFetchHtmlReport = () => {
    dispatch(
      fetchReportHtml({
        type: reportType,
        id: reportType === "single" ? selectedIndicatorId! : undefined,
      })
    );
  };

  const handleDownloadPdfReport = () => {
    dispatch(
      downloadReportPdf({
        type: reportType,
        id: reportType === "single" ? selectedIndicatorId! : undefined,
      })
    );
  };

  // --- Trigger browser download for HTML ---
  useEffect(() => {
    if (!lastReportHtml) return;

    const blob = new Blob([lastReportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Strategic_Report_${reportType}_${format(
      new Date(),
      "yyyy-MM-dd"
    )}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(clearReportHtml());
  }, [lastReportHtml, dispatch, reportType]);

  // --- Trigger browser download for PDF ---
  useEffect(() => {
    if (!lastPdfBlob) return;

    const url = URL.createObjectURL(lastPdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Strategic_Report_${reportType}_${format(
      new Date(),
      "yyyy-MM-dd"
    )}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(clearPdf());
  }, [lastPdfBlob, dispatch, reportType]);

  if (loadingIndicators)
    return <LoadingScreen message="Fetching Registry..." />;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f4f7f6] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-10">
        <div>
          <div className="flex items-center gap-3 text-[#c2a336] mb-3 font-black uppercase tracking-[0.4em] text-[10px]">
            <BarChart3 size={14} /> Global Analytics Engine
          </div>
          <h1 className="text-5xl font-black text-[#1a3a32] tracking-tighter">
            Executive Ledger
          </h1>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleFetchHtmlReport}
            disabled={loadingReport}
            className="group flex items-center gap-3 bg-[#1a3a32] text-[#c2a336] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#244d42] transition-all shadow-2xl disabled:opacity-50"
          >
            {loadingReport ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Download HTML"
            )}
          </button>

          <button
            onClick={handleDownloadPdfReport}
            disabled={loadingReport}
            className="group flex items-center gap-3 bg-[#c2a336] text-[#1a3a32] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ffe066] transition-all shadow-2xl disabled:opacity-50"
          >
            {loadingReport ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Download PDF"
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          label="Scope Volume"
          value={stats.total}
          icon={<Briefcase size={22} />}
          color="text-blue-600"
        />
        <StatCard
          label="Compliance Rate"
          value={stats.completed}
          icon={<CheckCircle2 size={22} />}
          color="text-emerald-600"
        />
        <StatCard
          label="Active Latency"
          value={stats.pending}
          icon={<AlertCircle size={22} />}
          color="text-amber-600"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        reportType={reportType}
        setReportType={setReportType}
        indicators={indicators}
        selectedIndicatorId={selectedIndicatorId}
        setSelectedIndicatorId={setSelectedIndicatorId}
        reportError={reportError}
      />

      {/* Table Ledger */}
      <IndicatorsTable indicators={filteredIndicators} />
    </div>
  );
};

// --- Filter Bar Component ---
const FilterBar = ({
  reportType,
  setReportType,
  indicators,
  selectedIndicatorId,
  setSelectedIndicatorId,
  reportError,
}: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-wrap gap-10 items-center justify-between">
    <div className="flex flex-wrap gap-10">
      <FilterGroup label="Report Horizon">
        <div className="relative">
          <Calendar
            className="absolute left-3 top-3 text-[#c2a336]"
            size={16}
          />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="pl-10 pr-10 py-3 bg-gray-50 border-none rounded-xl text-sm font-black text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] appearance-none cursor-pointer"
          >
            <option value="general">General Registry</option>
            <option value="weekly">Weekly Pulse</option>
            <option value="monthly">Monthly Audit</option>
            <option value="quarterly">Quarterly Strategic</option>
            <option value="group">Departmental Group</option>
            <option value="single">Individual Indicator</option>
          </select>
        </div>
      </FilterGroup>

      {reportType === "single" && (
        <FilterGroup
          label="Target Record"
          className="animate-in slide-in-from-left-4"
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-[#c2a336]"
              size={16}
            />
            <select
              value={selectedIndicatorId || ""}
              onChange={(e) => setSelectedIndicatorId(e.target.value)}
              className="pl-10 pr-10 py-3 bg-gray-50 border-none rounded-xl text-sm font-black text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] appearance-none max-w-[320px]"
            >
              <option value="">Select Case...</option>
              {indicators.map((i: IIndicator) => (
                <option key={i._id} value={i._id}>
                  {i.indicatorTitle}
                </option>
              ))}
            </select>
          </div>
        </FilterGroup>
      )}
    </div>

    {reportError && (
      <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
        <AlertCircle size={14} /> {reportError}
      </div>
    )}
  </div>
);

// --- Indicators Table ---
const IndicatorsTable = ({ indicators }: { indicators: IIndicator[] }) => (
  <div className="bg-white rounded-[3rem] shadow-2xl shadow-black/5 border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-[#1a3a32] text-white/40 uppercase text-[10px] tracking-[0.25em]">
            <th className="px-8 py-6 text-left font-black">
              Performance Indicator
            </th>
            <th className="px-8 py-6 text-left font-black">Assignment Type</th>
            <th className="px-8 py-6 text-left font-black">Current Status</th>
            <th className="px-8 py-6 text-right font-black">Efficiency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {indicators.map((i) => (
            <tr
              key={i._id}
              className="hover:bg-gray-50/50 transition-colors group"
            >
              <td className="px-8 py-6">
                <div className="font-bold text-[#1a3a32] text-base group-hover:text-[#c2a336] transition-colors">
                  {i.indicatorTitle}
                </div>
                <div className="text-[10px] text-[#8c94a4] font-black uppercase mt-1 tracking-widest">
                  {i.category?.title ?? "General"}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f4f0e6] flex items-center justify-center text-[#c2a336]">
                    {i.assignedToType === "individual" ? (
                      <Users size={14} />
                    ) : (
                      <Briefcase size={14} />
                    )}
                  </div>
                  <span className="font-bold text-[#1a3a32] capitalize">
                    {i.assignedToType}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6">
                <span
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(
                    i.status
                  )}`}
                >
                  {i.status}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-black text-[#1a3a32] text-lg tabular-nums">
                    {i.progress}%
                  </span>
                  <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1a3a32] h-full rounded-full transition-all duration-1000"
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

// --- Sub-components ---
const FilterGroup = ({ label, children, className = "" }: any) => (
  <div className={`space-y-2 ${className}`}>
    <label className="block text-[10px] font-black text-[#8c94a4] uppercase tracking-widest ml-1">
      {label}
    </label>
    {children}
  </div>
);

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
    <Loader2 className="w-16 h-16 animate-spin text-[#1a3a32] mb-6 stroke-[1px]" />
    <p className="text-[#1a3a32] font-black uppercase tracking-[0.5em] text-xs font-serif animate-pulse">
      {message}
    </p>
  </div>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#c2a336] transition-all cursor-default hover:shadow-xl hover:shadow-[#c2a336]/5">
    <div>
      <p className="text-[11px] font-black text-[#8c94a4] uppercase tracking-widest mb-2 group-hover:text-[#c2a336] transition-colors">
        {label}
      </p>
      <p className="text-4xl font-black text-[#1a3a32] tracking-tighter tabular-nums">
        {value}
      </p>
    </div>
    <div
      className={`p-5 rounded-2xl bg-gray-50 ${color} group-hover:bg-[#1a3a32] group-hover:text-[#c2a336] transition-all`}
    >
      {icon}
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
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

export default SuperAdminReports;
