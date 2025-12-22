// src/pages/SuperAdmin/SuperAdminReports.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import { 
  Loader2, 
  Download, 
  FilePieChart, 
  Calendar, 
  Search, 
  Briefcase,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

const SuperAdminReports: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector((state) => state.indicators.loading);

  const [reportType, setReportType] = useState<
    "single" | "general" | "monthly" | "weekly" | "daily"
  >("general");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [filteredIndicators, setFilteredIndicators] = useState<IIndicator[]>([]);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  useEffect(() => {
    const now = new Date();
    let filtered: IIndicator[] = [...indicators];

    switch (reportType) {
      case "single":
        filtered = indicators.filter((i) => i._id === selectedIndicatorId);
        break;
      case "monthly":
        filtered = indicators.filter(
          (i) =>
            new Date(i.createdAt).getMonth() === now.getMonth() &&
            new Date(i.createdAt).getFullYear() === now.getFullYear()
        );
        break;
      case "weekly":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        filtered = indicators.filter((i) => {
          const created = new Date(i.createdAt);
          return created >= startOfWeek && created <= endOfWeek;
        });
        break;
      case "daily":
        filtered = indicators.filter(
          (i) =>
            format(new Date(i.createdAt), "yyyy-MM-dd") ===
            format(now, "yyyy-MM-dd")
        );
        break;
      case "general":
      default:
        filtered = [...indicators];
    }
    setFilteredIndicators(filtered);
  }, [reportType, selectedIndicatorId, indicators]);

  // Derived Analytics for the Header
  const stats = useMemo(() => {
    const total = filteredIndicators.length;
    const completed = filteredIndicators.filter(i => i.progress === 100).length;
    const pending = filteredIndicators.filter(i => i.status === 'pending').length;
    return { total, completed, pending };
  }, [filteredIndicators]);

  const downloadReport = () => {
    if (!filteredIndicators.length) return;
    const csvContent = [
      ["Indicator", "Category", "Subcategory", "Assigned To", "Status", "Progress", "Start Date", "Due Date"],
      ...filteredIndicators.map((i) => [
        i.indicatorTitle,
        i.category?.title || "-",
        i.level2Category?.title || "-",
        i.assignedToType === "individual" ? i.assignedTo || "-" : "Group Assignment",
        i.status,
        `${i.progress}%`,
        i.startDate,
        i.dueDate,
      ]),
    ].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Judiciary_Report_${reportType}_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-black uppercase tracking-widest text-xs font-serif">Compiling Strategic Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f4f7f6] space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-8">
        <div>
          <div className="flex items-center gap-3 text-[#c2a336] mb-2 font-black uppercase tracking-[0.3em] text-[10px]">
            <FilePieChart size={14} />
            Executive Oversight
          </div>
          <h1 className="text-4xl font-black text-[#1a3a32] tracking-tighter">
            Analytical Reports
          </h1>
        </div>
        
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-[#1a3a32] text-[#c2a336] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#244d42] transition-all shadow-lg active:scale-95"
        >
          <Download size={16} /> Export Dossier (CSV)
        </button>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Indicators" value={stats.total} icon={<Briefcase size={20}/>} color="text-blue-600" />
        <StatCard label="Fully Compliant" value={stats.completed} icon={<CheckCircle2 size={20}/>} color="text-emerald-600" />
        <StatCard label="Awaiting Action" value={stats.pending} icon={<AlertCircle size={20}/>} color="text-amber-600" />
      </div>

      {/* Filter Control Center */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-[#8c94a4] uppercase tracking-widest ml-1">Report Scope</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-[#c2a336]" size={16} />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] appearance-none"
            >
              <option value="general">General Registry</option>
              <option value="single">Specific Indicator</option>
              <option value="monthly">Current Month</option>
              <option value="weekly">This Week</option>
              <option value="daily">Daily Log</option>
            </select>
          </div>
        </div>

        {reportType === "single" && (
          <div className="space-y-1.5 animate-in slide-in-from-left-2">
            <label className="block text-[10px] font-black text-[#8c94a4] uppercase tracking-widest ml-1">Select Record</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#c2a336]" size={16} />
              <select
                value={selectedIndicatorId || ""}
                onChange={(e) => setSelectedIndicatorId(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] appearance-none max-w-[300px]"
              >
                <option value="">Choose Indicator...</option>
                {indicators.map((i) => (
                  <option key={i._id} value={i._id}>{i.indicatorTitle}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#1a3a32] text-white/50 uppercase text-[10px] tracking-[0.2em]">
                <th className="px-6 py-5 text-left font-black">Indicator Title</th>
                <th className="px-6 py-5 text-left font-black">Category</th>
                <th className="px-6 py-5 text-left font-black">Official Assigned</th>
                <th className="px-6 py-5 text-left font-black">Status</th>
                <th className="px-6 py-5 text-left font-black">Timeline</th>
                <th className="px-6 py-5 text-right font-black">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredIndicators.map((i) => (
                <tr key={i._id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-[#1a3a32] group-hover:text-[#c2a336] transition-colors">{i.indicatorTitle}</div>
                    <div className="text-[11px] text-[#8c94a4] font-medium uppercase mt-0.5">{i.level2Category?.title ?? "Standard"}</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600 font-medium italic">{i.category?.title ?? "-"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold text-[#1a3a32]">
                      <div className="w-6 h-6 rounded-full bg-[#f4f0e6] flex items-center justify-center text-[#c2a336] text-[10px]">
                        {i.assignedToType === "individual" ? "P" : "G"}
                      </div>
                      {i.assignedToType === "individual" ? i.assignedTo || "Unassigned" : "Group Body"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyles(i.status)}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[11px] font-bold text-[#8c94a4] tracking-tight whitespace-nowrap">
                       {new Date(i.startDate).toLocaleDateString()} &mdash; {new Date(i.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div 
                                className="bg-[#1a3a32] h-full rounded-full" 
                                style={{ width: `${i.progress}%` }}
                            />
                        </div>
                        <span className="font-black text-[#1a3a32] text-xs tabular-nums">{i.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- Internal Helpers --- */

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#c2a336] transition-all cursor-default">
    <div>
      <p className="text-[10px] font-black text-[#8c94a4] uppercase tracking-widest mb-1 group-hover:text-[#c2a336] transition-colors">{label}</p>
      <p className="text-3xl font-black text-[#1a3a32] tracking-tighter tabular-nums">{value}</p>
    </div>
    <div className={`p-4 rounded-2xl bg-gray-50 ${color} group-hover:bg-[#1a3a32] group-hover:text-[#c2a336] transition-all`}>
      {icon}
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending": return "bg-amber-50 text-amber-700 border-amber-100";
    case "rejected": return "bg-rose-50 text-rose-700 border-rose-100";
    default: return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

export default SuperAdminReports;