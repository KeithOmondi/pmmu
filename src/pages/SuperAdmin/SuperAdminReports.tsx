import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAllIndicatorsForAdmin, selectAllIndicators, type IIndicator } from "../../store/slices/indicatorsSlice";
import { fetchReportHtml, downloadReportPdf, clearPdf, selectReportsLoading, selectLastPdfBlob, selectLastReportHtml, type ReportType, type ReportRequestPayload } from "../../store/slices/reportsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import { Loader2, Search, Briefcase, CheckCircle2, AlertCircle, BarChart3, Download, Eye, X, FileText, Globe, Filter, User, ShieldCheck } from "lucide-react";
import { isWithinInterval, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, endOfWeek } from "date-fns";
import toast from "react-hot-toast";

const SuperAdminReports: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);
  const indicatorsLoading = useAppSelector((state) => state.indicators.loading);
  const reportsLoading = useAppSelector(selectReportsLoading);
  const previewHtml = useAppSelector(selectLastReportHtml);
  const pdfBlob = useAppSelector(selectLastPdfBlob);

  const [reportType, setReportType] = useState<ReportType | "user">("general");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Judiciary_Report_${reportType}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    dispatch(clearPdf());
    toast.success("PDF exported successfully");
  }, [pdfBlob, dispatch, reportType]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let data = [...indicators];

    if (searchQuery) {
      data = data.filter((i) => i.indicatorTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    switch (reportType) {
      case "single":
        return selectedTargetId ? data.filter((i) => i._id === selectedTargetId) : [];
      case "user":
        return selectedTargetId 
          ? data.filter((i) => i.assignedTo === selectedTargetId || (Array.isArray(i.assignedGroup) && i.assignedGroup.includes(selectedTargetId))) 
          : [];
      case "weekly": {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const sundayEnd = endOfWeek(now);
        return data.filter((i) => {
          const due = new Date(i.dueDate);
          return due >= sevenDaysAgo && due <= sundayEnd;
        });
      }
      case "monthly":
        return data.filter((i) => isWithinInterval(new Date(i.dueDate), { start: startOfMonth(now), end: endOfMonth(now) }));
      case "quarterly":
        return data.filter((i) => isWithinInterval(new Date(i.dueDate), { start: startOfQuarter(now), end: endOfQuarter(now) }));
      case "group":
        return data.filter((i) => i.assignedToType === "group");
      default:
        return data;
    }
  }, [indicators, reportType, selectedTargetId, searchQuery]);

  const reportStats = useMemo(() => {
    const total = filteredData.length;
    const completed = filteredData.filter((i) => ["completed", "approved"].includes(i.status)).length;
    const pending = filteredData.filter((i) => ["pending", "submitted"].includes(i.status)).length;
    const avgProgress = total ? Math.round(filteredData.reduce((sum, i) => sum + (i.progress || 0), 0) / total) : 0;
    return { total, completed, pending, avgProgress };
  }, [filteredData]);

  // CRITICAL UPDATE: Ensure we don't send "undefined" strings
  const preparePayload = (): ReportRequestPayload => {
    const isUserReport = reportType === "user";
    const isSingle = reportType === "single";
    const cleanId = selectedTargetId && selectedTargetId !== "" ? selectedTargetId : undefined;

    return {
      type: isUserReport ? "general" : (reportType as ReportType),
      isAdmin: true,
      id: isSingle ? cleanId : undefined,
      userId: isUserReport ? cleanId : undefined,
    };
  };

  const handlePreview = async () => {
    if ((reportType === "single" || reportType === "user") && !selectedTargetId) {
      return toast.error("Please select a target for this report");
    }
    try {
      await dispatch(fetchReportHtml(preparePayload())).unwrap();
      setPreviewOpen(true);
    } catch (err: any) {
      toast.error(err || "Failed to generate preview");
    }
  };

  const handleDownload = () => {
    if ((reportType === "single" || reportType === "user") && !selectedTargetId) {
      return toast.error("Please select a target for this report");
    }
    dispatch(downloadReportPdf(preparePayload()));
  };

  if (indicatorsLoading) return <LoadingScreen message="Accessing Judicial Archives..." />;

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-50 space-y-8 font-sans">
      <Header loading={reportsLoading} onPreview={handlePreview} onDownload={handleDownload} />
      <StatsGrid stats={reportStats} />
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Filters 
          reportType={reportType} 
          setReportType={(val: any) => { setReportType(val); setSelectedTargetId(""); }} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          indicators={indicators} 
          users={users} 
          selectedTargetId={selectedTargetId} 
          setSelectedTargetId={setSelectedTargetId} 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif font-bold text-xl text-[#1E3A2B]">Scope Preview</h2>
          <span className="text-xs font-bold text-[#C69214] bg-[#F9F4E8] px-3 py-1 rounded-full uppercase">
            {filteredData.length} Records Found
          </span>
        </div>
        <IndicatorsTable indicators={filteredData} />
      </div>

      {previewOpen && (
        <PreviewModal html={previewHtml} reportType={reportType} loading={reportsLoading} onClose={() => setPreviewOpen(false)} onDownload={handleDownload} />
      )}
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const Header = ({ onPreview, onDownload, loading }: any) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#1E3A2B] p-8 md:p-10 rounded-[2rem] shadow-xl relative overflow-hidden text-white">
    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Globe size={180} /></div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-[#C69214] text-xs font-bold uppercase tracking-[0.2em] mb-2"><ShieldCheck size={16} /> Secure Executive Portal</div>
      <h1 className="text-3xl md:text-4xl font-serif font-extrabold tracking-tight">Performance Reporting</h1>
    </div>
    <div className="flex flex-wrap gap-4 relative z-10 w-full md:w-auto">
      <button onClick={onPreview} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase transition-all backdrop-blur-sm border border-white/20">
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Eye size={18} />} Preview
      </button>
      <button onClick={onDownload} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#C69214] hover:bg-[#A87B10] text-white px-8 py-4 rounded-xl font-bold text-xs uppercase shadow-lg transition-all">
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={18} />} Export PDF
      </button>
    </div>
  </div>
);

const StatsGrid = ({ stats }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard label="Records in Scope" value={stats.total} icon={<Briefcase size={24} />} color="text-blue-600" bg="bg-blue-50" />
    <StatCard label="Verified" value={stats.completed} icon={<CheckCircle2 size={24} />} color="text-green-600" bg="bg-green-50" />
    <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={24} />} color="text-amber-600" bg="bg-amber-50" />
    <StatCard label="Avg. Progress" value={`${stats.avgProgress}%`} icon={<BarChart3 size={24} />} color="text-[#C69214]" bg="bg-[#F9F4E8]" />
  </div>
);

const StatCard = ({ label, value, icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02]">
    <div><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">{label}</p><p className="text-3xl font-serif font-black text-[#1E3A2B]">{value}</p></div>
    <div className={`${bg} ${color} p-4 rounded-xl`}>{icon}</div>
  </div>
);

const Filters = ({ reportType, setReportType, searchQuery, setSearchQuery, indicators, users, selectedTargetId, setSelectedTargetId }: any) => (
  <div className="flex flex-col xl:flex-row gap-6">
    <div className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title..." className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C69214] text-sm shadow-inner" />
    </div>
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
        <Filter size={16} className="text-[#C69214]" />
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="bg-transparent border-none font-bold text-xs uppercase text-[#1E3A2B] cursor-pointer focus:ring-0">
          <option value="general">General Overview</option>
          <option value="user">Individual Performance</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="group">Group Performance</option>
          <option value="single">Single Record</option>
        </select>
      </div>

      {(reportType === "single" || reportType === "user") && (
        <div className="flex items-center gap-2 bg-[#F9F4E8] px-4 rounded-xl border border-[#C69214]/20">
          {reportType === "user" ? <User size={16} className="text-[#C69214]" /> : <FileText size={16} className="text-[#C69214]" />}
          <select 
            value={selectedTargetId} 
            onChange={(e) => setSelectedTargetId(e.target.value)} 
            className="bg-transparent text-[#C69214] border-none font-bold text-xs py-3 min-w-[200px] focus:ring-0"
          >
            <option value="">{reportType === "user" ? "Select Officer" : "Select Record"}</option>
            {reportType === "user" 
              ? users.map((u: any) => <option key={u._id} value={u._id}>{u.name} (PJ: {u.pjNumber || "N/A"})</option>)
              : indicators.map((i: any) => <option key={i._id} value={i._id}>{i.indicatorTitle}</option>)
            }
          </select>
        </div>
      )}
    </div>
  </div>
);

const IndicatorsTable = ({ indicators }: { indicators: IIndicator[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
          <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Indicator Title</th>
          <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Type</th>
          <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Due Date</th>
          <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Progress</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {indicators.length === 0 ? (
          <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">No records found for selection.</td></tr>
        ) : (
          indicators.map((i) => (
            <tr key={i._id} className="hover:bg-[#F9F4E8]/30 transition-colors">
              <td className="px-6 py-5 font-bold text-sm text-[#1E3A2B]">{i.indicatorTitle}</td>
              <td className="px-6 py-5"><span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase bg-blue-50 text-blue-600">{i.assignedToType}</span></td>
              <td className="px-6 py-5 text-xs text-gray-500">{new Date(i.dueDate).toLocaleDateString()}</td>
              <td className="px-6 py-5 text-right font-mono font-bold text-[#1E3A2B]">{i.progress}%</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const PreviewModal = ({ html, loading, reportType, onClose, onDownload }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#1E3A2B]/95 backdrop-blur-md">
    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="bg-[#C69214] p-3 rounded-xl text-white shadow-lg"><FileText size={20} /></div>
          <div><h2 className="font-serif font-black text-lg text-[#1E3A2B] uppercase">Executive Audit: {reportType}</h2></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A2B] text-white rounded-xl text-xs font-bold hover:bg-[#2a523d]"><Download size={16} /> Export PDF</button>
          <button onClick={onClose} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8 md:p-12 bg-gray-200/30">
        {loading || !html ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4"><Loader2 className="animate-spin text-[#C69214]" size={48} /><p className="text-xs font-bold uppercase tracking-widest">Synthesizing Data...</p></div>
        ) : (
          <div className="bg-white p-12 shadow-sm min-h-full mx-auto max-w-4xl border border-gray-200 rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1E3A2B] text-white">
    <Loader2 className="animate-spin text-[#C69214]" size={64} />
    <p className="mt-8 text-xs uppercase font-bold tracking-[0.4em] text-[#C69214] animate-pulse">{message}</p>
  </div>
);

export default SuperAdminReports;