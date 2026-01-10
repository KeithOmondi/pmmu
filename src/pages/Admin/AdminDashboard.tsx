// src/pages/Admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { getSocket } from "../../utils/socket";

import {
  fetchAllIndicatorsForAdmin,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import type { AppDispatch, RootState } from "../../store/store";

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const allIndicators = useSelector<RootState, IIndicator[]>(
    (state) => state.indicators.allIndicators
  );
  const [indicators, setIndicators] = useState<IIndicator[]>([]);

  // Initialize dashboard data and listen for real-time updates
  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());

    // Socket setup
    const socket = getSocket();
    socket.on("indicator:update", (updated: IIndicator) => {
      setIndicators((prev) => {
        const exists = prev.find((i) => i._id === updated._id);
        if (exists) {
          return prev.map((i) => (i._id === updated._id ? updated : i));
        } else {
          return [updated, ...prev];
        }
      });
    });

    return () => {
      socket.off("indicator:update");
    };
  }, [dispatch]);

  // Sync Redux store initially
  useEffect(() => {
    setIndicators(allIndicators);
  }, [allIndicators]);

  // Metrics breakdown
  const metrics = [
    { label: "Upcoming", status: "upcoming", accent: "amber", icon: <Clock size={22} /> },
    { label: "Ongoing", status: "ongoing", accent: "blue", icon: <FileText size={22} /> },
    { label: "Submitted", status: "submitted", accent: "slate", icon: <FileText size={22} /> },
    { label: "Pending", status: "pending", accent: "amber", icon: <Clock size={22} /> },
    { label: "Approved", status: "approved", accent: "emerald", icon: <CheckCircle size={22} /> },
    { label: "Rejected", status: "rejected", accent: "red", icon: <XCircle size={22} /> },
    { label: "Completed", status: "completed", accent: "emerald", icon: <CheckCircle size={22} /> },
  ];

  const getCount = (status: string) =>
    indicators.filter((i) => i.status === status).length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛 Top Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#1a3a32] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#c2a336]/10 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c2a336]/20 border border-[#c2a336]/30 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em]">
              <ShieldCheck size={14} />
              System Oversight Active
            </div>
            <h1 className="text-3xl md:text-3xl font-black tracking-tight">
              Admin <span className="text-[#c2a336]">Dashboard</span>
            </h1>
            <p className="text-slate-400 max-w-lg font-medium leading-relaxed">
              Overview of all indicator tasks
            </p>
          </div>
        </div>
      </section>

      {/* 📊 Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            title={m.label}
            count={getCount(m.status)}
            trend={m.label}
            icon={m.icon}
            accent={m.accent}
            isPriority={m.status === "overdue" || m.status === "rejected"}
          />
        ))}
      </div>

      {/* 🛡 Recent Activity / Audit Log */}
      <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-[#1a3a32] tracking-tight">
              Live Audit Feed
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Real-time system indicator logs
            </p>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] hover:underline flex items-center gap-2">
            Full Archive <ExternalLink size={12} />
          </button>
        </div>
        <div className="p-0">
          {indicators.slice(0, 5).map((i, idx) => (
            <ActivityRow key={i._id} item={i} isLast={idx === 4} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- Sub-Components --- */
const MetricCard = ({ title, count, trend, icon, accent, isPriority }: any) => {
  const accents: any = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    slate: "text-slate-600 bg-slate-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <div
      className={`group bg-white p-7 rounded-[2rem] border-2 transition-all duration-300 hover:shadow-xl ${
        isPriority
          ? "border-[#c2a336]/30 shadow-lg shadow-[#c2a336]/5"
          : "border-slate-50 hover:border-[#c2a336]/20"
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-4 rounded-2xl ${accents[accent]} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <ArrowUpRight
          className="text-slate-200 group-hover:text-[#c2a336] transition-colors"
          size={20}
        />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-3">
          <h4 className="text-4xl font-black text-[#1a3a32]">{count}</h4>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${accents[accent]}`}
          >
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
};

const ActivityRow = ({
  item,
  isLast,
}: {
  item: IIndicator;
  isLast: boolean;
}) => {
  const userName =
    typeof item.createdBy === "string"
      ? item.createdBy
      : (item.createdBy as any)?.name || "System";

  return (
    <div
      className={`flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors ${
        !isLast ? "border-b border-slate-50" : ""
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <FileText size={20} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1a3a32] truncate uppercase tracking-tight">
          {item.indicatorTitle}
        </p>
        <p className="text-xs text-slate-500 italic">Initiated by {userName}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {new Date(item.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#c2a336] bg-[#c2a336]/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
          <div className="w-1 h-1 rounded-full bg-[#c2a336]" />
          Registry Entry
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
