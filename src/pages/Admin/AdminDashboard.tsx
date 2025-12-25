import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ShieldCheck,
  Users,
  FileText,
  Gavel,
  Activity,
  ArrowUpRight,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

import {
  fetchAllIndicatorsForAdmin,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, type IUser } from "../../store/slices/userSlice";
import type { AppDispatch, RootState } from "../../store/store";

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const users = useSelector<RootState, IUser[]>((state) => state.users.users);
  const allIndicators = useSelector<RootState, IIndicator[]>(
    (state) => state.indicators.allIndicators
  );

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const pendingIndicators = allIndicators.filter(
    (i) => i.status === "pending"
  ).length;
  const systemAudits = allIndicators.filter(
    (i) => i.status === "approved"
  ).length;
  const registryUsers = users.length;
  const caseFiles = allIndicators.length;

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
              Overview of the General system
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Global Load
              </p>
              <p className="text-2xl font-black text-[#c2a336]">98.2%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Uptime
              </p>
              <p className="text-2xl font-black text-emerald-400">Stable</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Users"
          count={registryUsers}
          trend="+4 today"
          icon={<Users size={22} />}
          accent="emerald"
        />
        <MetricCard
          title="Pending Review"
          count={pendingIndicators}
          trend="Action Required"
          icon={<Clock size={22} />}
          accent="amber"
          isPriority
        />
        <MetricCard
          title="System Audits"
          count={systemAudits}
          trend="Certified"
          icon={<Activity size={22} />}
          accent="blue"
        />
        <MetricCard
          title="Case Files"
          count={caseFiles}
          trend="Total Volume"
          icon={<Gavel size={22} />}
          accent="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🛡 Recent Activity / Audit Log */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-[#1a3a32] tracking-tight">
                Live Audit Feed
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Real-time system interaction logs
              </p>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] hover:underline flex items-center gap-2">
              Full Archive <ExternalLink size={12} />
            </button>
          </div>
          <div className="p-0">
            {allIndicators.slice(0, 5).map((i, idx) => (
              <ActivityRow key={i._id} item={i} isLast={idx === 4} />
            ))}
          </div>
        </div>

        {/* 🛠 Quick Actions Panel */}
        <aside className="space-y-6">
          <div className="bg-[#1a3a32] rounded-[2rem] p-8 text-white shadow-xl relative group overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#c2a336]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#c2a336] mb-6">
              System Controls
            </h3>
            <div className="space-y-3">
              <QuickActionButton
                label="Generate Reports"
                icon={<FileText size={16} />}
              />
              <QuickActionButton
                label="User Management"
                icon={<Users size={16} />}
              />
              <QuickActionButton
                label="Global Settings"
                icon={<Activity size={16} />}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              Institutional Motto
            </h3>
            <blockquote className="border-l-4 border-[#c2a336] pl-4">
              <p className="text-lg font-bold text-[#1a3a32] italic leading-snug">
                "Justice be our shield and defender."
              </p>
              <footer className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-2">
                Judiciary System Registry
              </footer>
            </blockquote>
          </div>
        </aside>
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

const QuickActionButton = ({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) => (
  <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
    <div className="flex items-center gap-3">
      <div className="text-[#c2a336]">{icon}</div>
      <span className="text-xs font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
    <ChevronRight
      size={14}
      className="text-white/20 group-hover:text-[#c2a336] group-hover:translate-x-1 transition-all"
    />
  </button>
);

export default AdminDashboard;
