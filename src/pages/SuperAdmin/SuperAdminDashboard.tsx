import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  User,
  ChevronRight,
  FileSearch,
  MousePointer2,
  FilterX,
  TrendingUp,
  Activity,
  Users,
  Target,
  BellRing,
  ShieldCheck,
  MailWarning,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  fetchCategories,
  selectAllCategories,
} from "../../store/slices/categoriesSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";

// AUDIT ACTIONS
import {
  nudgeOverdueAssignees,
  resetAuditStatus,
} from "../../store/slices/auditSlice";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  submitted: {
    label: "Under Review",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  approved: {
    label: "Awaiting Seal",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Certified",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Returned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // REDUX SELECTORS
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const categories = useAppSelector(selectAllCategories);
  const users = useAppSelector(selectAllUsers);
  const {
    isNudging,
    error: auditError,
    successMessage,
  } = useAppSelector((state) => state.audit);

  // 1. CLOCK TICK
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. DATA FETCHING
  const loadData = useCallback(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    loadData();
    const heartbeat = setInterval(loadData, 30000);
    return () => clearInterval(heartbeat);
  }, [loadData]);

  // 3. AUDIT FEEDBACK
  useEffect(() => {
    if (auditError) {
      toast.error(`Broadcast Failed: ${auditError}`);
      dispatch(resetAuditStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(resetAuditStatus());
    }
  }, [auditError, successMessage, dispatch]);

  // 4. OVERDUE LOGIC
  const isOverdue = useCallback(
    (row: IIndicator) => {
      if (row.status === "completed") return false;
      if (!row.dueDate) return false;
      const parsedDate = new Date(row.dueDate).getTime();
      if (isNaN(parsedDate)) return false;
      return parsedDate < now;
    },
    [now]
  );

  // 5. NUDGE HANDLERS
  const handleBroadcastNudge = () => {
    const overdueCount = indicators.filter((i) => isOverdue(i)).length;
    if (overdueCount === 0) {
      return toast("System Compliant: No overdue tasks found.", { icon: "🛡️" });
    }
    if (window.confirm(`BROADCAST ALERT: Send urgent email reminders to all personnel assigned to the ${overdueCount} overdue indicators?`)) {
      dispatch(nudgeOverdueAssignees());
    }
  };

  const handleIndividualNudge = (indicatorId: string) => {
    if (window.confirm("Send a priority email nudge to the personnel assigned to this task?")) {
      // Assuming nudgeOverdueAssignees thunk accepts an optional indicatorId
      dispatch(nudgeOverdueAssignees(indicatorId as any));
    }
  };

  // 6. METRICS CALCULATION
  const globalStats = useMemo(() => {
    const total = indicators.length;
    const completed = indicators.filter((i) => i.status === "completed").length;
    const late = indicators.filter((i) => isOverdue(i)).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const healthScore = total ? Math.round(((total - late) / total) * 100) : 0;
    return { total, completed, late, completionRate, healthScore };
  }, [indicators, isOverdue]);

  const metrics = useMemo(
    () => ({
      inProgress: indicators.filter((i) => i.status === "pending").length,
      submitted: indicators.filter((i) => i.status === "submitted").length,
      returned: indicators.filter((i) => i.status === "rejected").length,
      readyForSeal: indicators.filter((i) => i.status === "approved").length,
      late: globalStats.late,
      finalized: globalStats.completed,
    }),
    [indicators, globalStats]
  );

  const groupedIndicators = useMemo(() => {
    if (!filter) return {};
    const filtered = indicators.filter((i) => {
      if (filter === "late") return isOverdue(i);
      if (filter === "inProgress") return i.status === "pending";
      if (filter === "returned") return i.status === "rejected";
      if (filter === "readyForSeal") return i.status === "approved";
      if (filter === "finalized") return i.status === "completed";
      return i.status === filter;
    });

    const mapping: Record<string, { category: any; indicators: IIndicator[] }> = {};
    filtered.forEach((ind) => {
      const catRef = ind.category;
      const catId = typeof catRef === "string" ? catRef : catRef?._id || "uncat";
      if (!mapping[catId]) {
        const globalCat = categories.find((c) => c._id === catId);
        mapping[catId] = {
          category: globalCat || (typeof catRef === "object" ? catRef : null) || {
            _id: "uncat",
            title: "General Registry",
            code: "GR",
          },
          indicators: [],
        };
      }
      mapping[catId].indicators.push(ind);
    });
    return mapping;
  }, [indicators, categories, filter, isOverdue]);

  const getUserNames = useCallback(
    (row: IIndicator): string => {
      if (row.assignedToType === "group" && Array.isArray(row.assignedGroup)) {
        return (
          row.assignedGroup
            .map((id) => {
              const userId = typeof id === "object" ? (id as any)._id : id;
              return users.find((u) => u._id === userId)?.name;
            })
            .filter(Boolean)
            .join(", ") || "Empty Group"
        );
      }
      const individualId = typeof row.assignedTo === "object" ? (row.assignedTo as any)._id : row.assignedTo;
      return users.find((u) => u._id === individualId)?.name || "Unassigned";
    },
    [users]
  );

  if (loading && indicators.length === 0)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#355E3B]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Executive Command <ShieldCheck className="text-[#355E3B]" size={28} />
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Real-time Institutional Performance Oversight
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBroadcastNudge}
              disabled={isNudging}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border-2 
                ${isNudging ? "bg-slate-100 text-slate-400 border-slate-200" : globalStats.late > 0 ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50" : "bg-white text-slate-300 border-slate-100 opacity-60 hover:opacity-100"}`}
            >
              {isNudging ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} className={globalStats.late > 0 ? "animate-bounce" : ""} />}
              {isNudging ? "Sending Alerts..." : globalStats.late > 0 ? `Nudge ${globalStats.late} Overdue Personnel` : "Audit Nudge"}
            </button>

            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#355E3B] transition-all shadow-lg"
              >
                <FilterX size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* STAT HEROES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatHero icon={<TrendingUp size={32} />} label="Completion Rate" value={`${globalStats.completionRate}%`} color="text-emerald-600" bg="bg-emerald-50">
            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${globalStats.completionRate}%` }} />
            </div>
          </StatHero>
          <StatHero icon={<Activity size={32} />} label="Institutional Health" value={`${globalStats.healthScore}%`} color="text-blue-600" bg="bg-blue-50">
            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Inverse of Overdue Tasks</p>
          </StatHero>
          <div className="bg-[#1E3A2B] p-6 rounded-[2.5rem] shadow-xl flex items-center gap-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10"><Target size={120} /></div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-[#EFBF04]"><Users size={32} /></div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">Active Personnel</p>
              <h2 className="text-3xl font-black">{users.length}</h2>
              <p className="text-[8px] font-bold text-[#EFBF04] mt-1 uppercase">Across {categories.length} Units</p>
            </div>
          </div>
        </div>

        {/* METRIC SELECTORS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatBox label="In Progress" value={metrics.inProgress} theme="border-[#355E3B] text-[#355E3B]" selected={filter === "inProgress"} onClick={() => setFilter("inProgress")} />
          <StatBox label="Review" value={metrics.submitted} theme="border-blue-600 text-blue-600" selected={filter === "submitted"} onClick={() => setFilter("submitted")} />
          <StatBox label="Returned" value={metrics.returned} theme="border-rose-600 text-rose-600" selected={filter === "returned"} onClick={() => setFilter("returned")} />
          <StatBox label="Approved" value={metrics.readyForSeal} theme="border-[#EFBF04] text-[#EFBF04]" selected={filter === "readyForSeal"} onClick={() => setFilter("readyForSeal")} />
          <StatBox label="Overdue" value={metrics.late} theme="border-red-600 text-red-600" selected={filter === "late"} onClick={() => setFilter("late")} />
          <StatBox label="Finalized" value={metrics.finalized} theme="border-emerald-600 text-emerald-600" selected={filter === "finalized"} onClick={() => setFilter("finalized")} />
        </div>

        {/* DATA LIST AREA */}
        <div className="space-y-8 min-h-[400px]">
          {!filter ? (
            <DashboardPlaceholder />
          ) : Object.values(groupedIndicators).length === 0 ? (
            <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-200">
              <FileSearch className="mx-auto text-slate-100 mb-6" size={64} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No {filter} records found</p>
            </div>
          ) : (
            Object.values(groupedIndicators).map((group) => (
              <div key={group.category._id || Math.random()} className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="px-10 py-8 border-b flex items-center gap-5 bg-slate-50/30">
                  <div className="w-12 h-12 bg-[#1E3A2B] rounded-2xl flex items-center justify-center text-[#EFBF04] font-black shadow-lg">
                    {group.category.code || "REG"}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 uppercase text-sm tracking-[0.1em]">{group.category.title}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{group.indicators.length} Active Records</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                        <th className="px-10 py-5">Metric Description</th>
                        <th className="px-10 py-5">Personnel</th>
                        <th className="px-10 py-5 text-center">Status</th>
                        <th className="px-10 py-5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.indicators.map((ind) => {
                        const s = STATUS_CONFIG[ind.status] || STATUS_CONFIG.pending;
                        const overdue = isOverdue(ind);
                        return (
                          <tr key={ind._id} className="group hover:bg-slate-50/80 transition-all">
                            <td className="px-10 py-6">
                              <p className="text-sm font-bold text-slate-900">{ind.indicatorTitle}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-black mt-1">UOM: {ind.unitOfMeasure}</p>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                <p className="text-xs font-bold text-slate-600 truncate max-w-[180px]">{getUserNames(ind)}</p>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${s.bg} ${s.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                  <span className="text-[9px] font-black uppercase">{s.label}</span>
                                </div>
                                {overdue && (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <span className="text-[8px] text-red-600 font-black uppercase animate-pulse">Overdue</span>
                                    {/* INDIVIDUAL NUDGE BUTTON */}
                                    <button
                                      onClick={() => handleIndividualNudge(ind._id)}
                                      disabled={isNudging}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tight hover:bg-rose-700 transition-all shadow-md disabled:opacity-50"
                                    >
                                      <MailWarning size={10} /> Send Nudge
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <Link to={`/superadmin/indicators/${ind._id}`} className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase border-2 border-slate-100 shadow-sm hover:bg-[#1E3A2B] hover:text-white transition-all">
                                Audit <ChevronRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* HELPER COMPONENTS */
const StatHero: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; bg: string; children?: React.ReactNode }> = ({ icon, label, value, color, bg, children }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <h2 className="text-3xl font-black text-slate-900">{value}</h2>
      {children}
    </div>
  </div>
);

const StatBox: React.FC<{ label: string; value: number; theme: string; selected: boolean; onClick: () => void }> = ({ label, value, theme, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-7 rounded-[2.5rem] border-b-[6px] transition-all flex flex-col items-start bg-white group shadow-sm ${theme} ${selected ? "ring-4 ring-[#EFBF04]/20 -translate-y-3 shadow-2xl border-current" : "border-slate-100 hover:border-slate-300 hover:-translate-y-1 opacity-70 hover:opacity-100"}`}
  >
    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-4 ${selected ? "text-current" : "text-slate-400"}`}>{label}</p>
    <h3 className="text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</h3>
  </button>
);

const DashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6"><MousePointer2 size={40} strokeWidth={1} /></div>
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Command Overview</h2>
    <p className="text-slate-400 text-xs font-bold mt-2 max-w-xs text-center leading-relaxed">Aggregated statistics are displayed above. Please select a metric segment to inspect granular archival data.</p>
  </div>
);

export default SuperAdminDashboard;