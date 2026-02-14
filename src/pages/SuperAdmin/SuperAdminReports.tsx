import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  fetchReportHtml,
  downloadReportPdf,
  clearPdf,
  selectReportsLoading,
  selectLastPdfBlob,
  selectLastReportHtml,
  type ReportType,
  type ReportRequestPayload,
} from "../../store/slices/reportsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import {
  Loader2,
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Download,
  Eye,
  X,
  FileText,
  Globe,
  Filter,
  User,
  ShieldCheck,
  Calendar,
  Users,
} from "lucide-react";
import {
  isWithinInterval,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  endOfWeek,
} from "date-fns";
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
    link.download = `Executive_Report_${reportType}_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(clearPdf());
    toast.success("Registry Exported Successfully");
  }, [pdfBlob, dispatch, reportType]);

  // --- LOGIC: RESOLVE IDS TO ACTUAL NAMES ---
  const getUserNames = useCallback((row: IIndicator): string => {
    if (row.assignedToType === "group" && Array.isArray(row.assignedGroup)) {
      const groupNames = row.assignedGroup
        .map(id => {
          const userId = typeof id === 'object' ? (id as any)._id : id;
          return users.find(u => u._id === userId)?.name;
        })
        .filter(Boolean);
      return groupNames.length > 0 ? groupNames.join(", ") : "Empty Group";
    }

    const individualId = typeof row.assignedTo === 'object' 
      ? (row.assignedTo as any)._id 
      : row.assignedTo;
      
    return users.find(u => u._id === individualId)?.name || "Unassigned";
  }, [users]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let data = [...indicators];

    if (searchQuery) {
      data = data.filter((i) =>
        i.indicatorTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (reportType) {
      case "single":
        return selectedTargetId ? data.filter((i) => i._id === selectedTargetId) : [];
      case "user":
        return selectedTargetId 
          ? data.filter((i) => {
              const assignedId = typeof i.assignedTo === 'object' ? (i.assignedTo as any)._id : i.assignedTo;
              return assignedId === selectedTargetId || (Array.isArray(i.assignedGroup) && i.assignedGroup.includes(selectedTargetId));
            })
          : [];
      case "weekly": {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        return data.filter((i) => isWithinInterval(new Date(i.dueDate), { start, end: endOfWeek(now) }));
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

  const preparePayload = useCallback((): ReportRequestPayload => ({
    type: reportType === "user" ? "general" : (reportType as ReportType),
    isAdmin: true,
    id: reportType === "single" ? (selectedTargetId || undefined) : undefined,
    userId: reportType === "user" ? (selectedTargetId || undefined) : undefined,
  }), [reportType, selectedTargetId]);

  const handleAction = async (action: 'preview' | 'download') => {
    if ((reportType === "single" || reportType === "user") && !selectedTargetId) {
      return toast.error(`Selection Required: Please select a target ${reportType}`);
    }
    if (action === 'preview') {
      try {
        await dispatch(fetchReportHtml(preparePayload())).unwrap();
        setPreviewOpen(true);
      } catch (err: any) {
        toast.error(err || "Synthesis failed");
      }
    } else {
      dispatch(downloadReportPdf(preparePayload()));
    }
  };

  if (indicatorsLoading) return <LoadingScreen message="Accessing Judicial Archives..." />;

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#F8FAFC] space-y-10 font-sans">
      <Header loading={reportsLoading} onPreview={() => handleAction('preview')} onDownload={() => handleAction('download')} />
      
      <StatsGrid stats={reportStats} />

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
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

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-[#C69214] rounded-full" />
             <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Scope Preview</h2>
          </div>
          <span className="text-[10px] font-black text-[#C69214] bg-[#F9F4E8] px-4 py-1.5 rounded-full uppercase tracking-tighter border border-[#C69214]/20">
            {filteredData.length} Records In Scope
          </span>
        </div>
        <IndicatorsTable indicators={filteredData} getUserNames={getUserNames} />
      </div>

      {previewOpen && (
        <PreviewModal
          html={previewHtml}
          reportType={reportType}
          loading={reportsLoading}
          onClose={() => setPreviewOpen(false)}
          onDownload={() => handleAction('download')}
        />
      )}
    </div>
  );
};

/* --- REFINED SUBCOMPONENTS --- */

const Header = ({ onPreview, onDownload, loading }: any) => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[#1E3A2B] p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden text-white">
    <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
      <Globe size={320} />
    </div>
    <div className="relative z-10 space-y-3">
      <div className="flex items-center gap-2 text-[#EFBF04] text-[10px] font-black uppercase tracking-[0.3em]">
        <ShieldCheck size={16} strokeWidth={3} /> Intelligence & Oversight
      </div>
      <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
        Performance <span className="text-[#EFBF04]">Analytics</span>
      </h1>
      <p className="text-slate-400 text-sm font-medium max-w-md">Generate verified institutional reports and personnel audits.</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
      <button onClick={onPreview} disabled={loading} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-md border border-white/10">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />} Preview
      </button>
      <button onClick={onDownload} disabled={loading} className="flex items-center justify-center gap-3 bg-[#C69214] hover:bg-[#EFBF04] hover:text-[#1E3A2B] text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all border border-[#EFBF04]/20">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Export PDF
      </button>
    </div>
  </div>
);

const StatsGrid = ({ stats }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard label="Scope Total" value={stats.total} icon={<Briefcase size={22} />} color="text-blue-600" bg="bg-blue-50" />
    <StatCard label="Verified" value={stats.completed} icon={<CheckCircle2 size={22} />} color="text-emerald-600" bg="bg-emerald-50" />
    <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={22} />} color="text-amber-600" bg="bg-amber-50" />
    <StatCard label="Aggregated" value={`${stats.avgProgress}%`} icon={<BarChart3 size={22} />} color="text-[#C69214]" bg="bg-[#F9F4E8]" />
  </div>
);

const StatCard = ({ label, value, icon, color, bg }: any) => (
  <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
    <div>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-[#1E3A2B] tracking-tighter">{value}</p>
    </div>
    <div className={`${bg} ${color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>{icon}</div>
  </div>
);

const Filters = ({ reportType, setReportType, searchQuery, setSearchQuery, indicators, users, selectedTargetId, setSelectedTargetId }: any) => (
  <div className="flex flex-col xl:flex-row gap-6">
    <div className="flex-1 relative group">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#C69214] transition-colors" size={20} />
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter by metric title..." className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#C69214]/20 focus:bg-white focus:ring-0 text-sm font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-300" />
    </div>
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border-2 border-slate-100">
        <Filter size={18} className="text-[#C69214]" />
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="bg-transparent border-none font-black text-[10px] uppercase text-slate-700 cursor-pointer focus:ring-0 py-3">
          <option value="general">Global Registry</option>
          <option value="user">Officer Performance</option>
          <option value="weekly">Weekly Audit</option>
          <option value="monthly">Monthly Cycle</option>
          <option value="quarterly">Quarterly Review</option>
          <option value="group">Unit Performance</option>
          <option value="single">Isolated Record</option>
        </select>
      </div>
      {(reportType === "single" || reportType === "user") && (
        <div className="flex items-center gap-3 bg-[#F9F4E8] px-5 rounded-2xl border-2 border-[#C69214]/20 animate-in fade-in zoom-in duration-300">
          {reportType === "user" ? <User size={18} className="text-[#C69214]" /> : <FileText size={18} className="text-[#C69214]" />}
          <select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} className="bg-transparent text-[#C69214] border-none font-black text-[10px] uppercase py-4 min-w-[220px] focus:ring-0">
            <option value="">{reportType === "user" ? "Select Officer" : "Select Specific Record"}</option>
            {reportType === "user" ? users.map((u: any) => <option key={u._id} value={u._id}>{u.name} (PJ: {u.pjNumber || "N/A"})</option>) : indicators.map((i: any) => <option key={i._id} value={i._id}>{i.indicatorTitle}</option>)}
          </select>
        </div>
      )}
    </div>
  </div>
);

const IndicatorsTable = ({ indicators, getUserNames }: { indicators: IIndicator[], getUserNames: (i: IIndicator) => string }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-100">
          <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Indicator Metric</th>
          <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Personnel</th>
          <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Maturity Date</th>
          <th className="px-8 py-5 text-right text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Yield</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {indicators.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-8 py-24 text-center opacity-20"><FileText size={48} className="mx-auto" /><p className="text-[10px] font-black uppercase tracking-widest mt-2">No matching archival data found</p></td>
          </tr>
        ) : (
          indicators.map((i) => (
            <tr key={i._id} className="hover:bg-slate-50/80 transition-all group">
              <td className="px-8 py-6">
                <p className="font-bold text-sm text-slate-900 group-hover:text-[#1E3A2B]">{i.indicatorTitle}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black mt-1">Ref: {i._id.slice(-8)}</p>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${i.assignedToType === 'group' ? 'bg-[#EFBF04]/10 text-[#C69214]' : 'bg-blue-50 text-blue-600'}`}>
                    {i.assignedToType === 'group' ? <Users size={14} /> : <User size={14} />}
                  </div>
                  <p className="text-xs font-bold text-slate-600 truncate max-w-[250px]" title={getUserNames(i)}>
                    {getUserNames(i)}
                  </p>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Calendar size={14} className="text-slate-300" />{new Date(i.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="inline-flex items-center gap-2">
                   <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#C69214]" style={{ width: `${i.progress}%` }} /></div>
                   <span className="font-mono font-black text-sm text-[#1E3A2B] w-10">{i.progress}%</span>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const PreviewModal = ({ html, loading, reportType, onClose, onDownload }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#0F172A]/90 backdrop-blur-sm">
    <div className="bg-[#F1F5F9] w-full max-w-6xl h-[92vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
      <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-5">
          <div className="bg-[#1E3A2B] p-4 rounded-2xl text-[#EFBF04] shadow-xl"><ShieldCheck size={24} strokeWidth={2.5} /></div>
          <div>
            <h2 className="font-black text-xl text-slate-900 uppercase tracking-tight leading-none">Intelligence Brief</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Classification: {reportType} Audit</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onDownload} className="flex items-center gap-3 px-8 py-3.5 bg-[#1E3A2B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a523d] transition-all shadow-lg"><Download size={16} /> Export Final PDF</button>
          <button onClick={onClose} className="p-3.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl transition-colors border border-rose-100"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-10 md:p-16">
        {loading || !html ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6"><Loader2 className="animate-spin text-[#C69214]" size={64} strokeWidth={3} /><p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Synthesizing Registry Data...</p></div>
        ) : (
          <div className="bg-white p-16 shadow-2xl min-h-full mx-auto max-w-4xl border border-slate-200 rounded-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#C69214]" />
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1E3A2B] text-white">
    <Loader2 className="animate-spin text-[#EFBF04]" size={80} strokeWidth={1} />
    <p className="mt-10 text-[10px] uppercase font-black tracking-[0.5em] text-[#EFBF04] animate-pulse">{message}</p>
  </div>
);

export default SuperAdminReports;