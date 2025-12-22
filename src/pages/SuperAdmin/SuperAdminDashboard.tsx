// src/pages/SuperAdmin/SuperAdminDashboard.tsx
import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  fetchCategories,
  selectAllCategories,
} from "../../store/slices/categoriesSlice";
import {
  fetchUsers,
} from "../../store/slices/userSlice";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Timer,
  LayoutDashboard,
  ChevronRight
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";

const BRAND = {
  green: "#1a3a32",
  gold: "#c2a336",
  slate: "#8c94a4",
  lightGold: "#f4f0e6",
};

const STATUS_COLORS: Record<string, string> = {
  pending: BRAND.gold,
  approved: BRAND.green,
  rejected: "#ef4444",
  overdue: "#991b1b",
};

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);
  const categories = useAppSelector(selectAllCategories);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  const now = Date.now();

  const metrics = useMemo(() => {
    const upcoming = indicators.filter((i) => new Date(i.startDate).getTime() > now);
    const ongoing = indicators.filter(
      (i) => new Date(i.startDate).getTime() <= now && new Date(i.dueDate).getTime() >= now
    );
    const pending = indicators.filter((i) => i.status === "pending");
    const approved = indicators.filter((i) => i.status === "approved");
    const overdue = indicators.filter(
      (i) => i.status === "overdue" || (new Date(i.dueDate).getTime() < now && i.status !== "approved")
    );

    return { upcoming, ongoing, pending, approved, overdue };
  }, [indicators, now]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, overdue: 0 };
    indicators.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.keys(counts).map((key) => ({
      name: key.toUpperCase(),
      value: counts[key],
      color: STATUS_COLORS[key],
    }));
  }, [indicators]);

  const barData = useMemo(() => {
    return categories.map((cat) => ({
      name: cat.title.length > 10 ? cat.title.substring(0, 10) + ".." : cat.title,
      count: indicators.filter((i) => i.category?._id === cat._id).length,
    }));
  }, [categories, indicators]);

  if (indicatorsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-medium tracking-widest uppercase text-[10px]">Loading Judiciary Analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa] space-y-6 lg:space-y-8">
      {/* Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a3a32] tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-[#c2a336]" />
            Dashboard
          </h1>
          <p className="text-[#8c94a4] mt-1 font-medium text-xs sm:text-sm">High Court of Kenya | Analytics</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm self-start md:self-center">
          <p className="text-[10px] font-bold text-[#1a3a32] uppercase tracking-tighter opacity-60">Current Session</p>
          <p className="text-sm text-[#c2a336] font-semibold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Metric Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Upcoming" value={metrics.upcoming.length} icon={<Calendar size={18} />} color={BRAND.slate} />
        <StatCard title="Ongoing" value={metrics.ongoing.length} icon={<Timer size={18} />} color="#3b82f6" />
        <StatCard title="Pending" value={metrics.pending.length} icon={<Clock size={18} />} color={BRAND.gold} />
        <StatCard title="Approved" value={metrics.approved.length} icon={<CheckCircle2 size={18} />} color={BRAND.green} />
        <div className="col-span-2 lg:col-span-1">
            <StatCard title="Overdue" value={metrics.overdue.length} icon={<AlertCircle size={18} />} color="#991b1b" />
        </div>
      </div>

      {/* Analytics Charts - Stack on mobile, grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <h2 className="text-md sm:text-lg font-bold text-[#1a3a32] mb-6 border-l-4 border-[#c2a336] pl-3">Status</h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius="60%" outerRadius="80%" paddingAngle={5}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-md sm:text-lg font-bold text-[#1a3a32] mb-6 border-l-4 border-[#c2a336] pl-3">Category Volume</h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8c94a4', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8c94a4', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Bar dataKey="count" fill={BRAND.green} radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Timeline View - Table on Desktop, Cards on Mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-md sm:text-lg font-bold text-[#1a3a32]">Critical Timeline View</h2>
            <span className="text-[10px] bg-[#f4f0e6] text-[#c2a336] px-2 py-1 rounded-md font-bold uppercase">Live Tracking</span>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#fcfcfc] text-[#8c94a4] uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 text-left font-bold">Indicator</th>
                <th className="px-6 py-4 text-left font-bold">Category</th>
                <th className="px-6 py-4 text-left font-bold">Official</th>
                <th className="px-6 py-4 text-left font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...metrics.upcoming, ...metrics.ongoing].slice(0, 6).map((i) => (
                <tr key={i._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#1a3a32]">{i.indicatorTitle}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{i.category?.title ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-xs font-medium">
                      {i.assignedToType === "individual" ? "Official Assignment" : "Group Task"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border
                        ${i.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                          i.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                          'bg-red-50 border-red-200 text-red-700'}`}>
                        {i.status}
                      </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Card List */}
        <div className="md:hidden divide-y divide-gray-100">
            {[...metrics.upcoming, ...metrics.ongoing].slice(0, 5).map((i) => (
                <div key={i._id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-[#c2a336] uppercase tracking-tighter bg-[#f4f0e6] px-2 py-0.5 rounded">
                            {i.category?.title || "General"}
                        </span>
                        <span className={`text-[9px] font-black uppercase ${i.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {i.status}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#1a3a32] leading-tight">{i.indicatorTitle}</h3>
                    <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1 text-[#8c94a4]">
                            <Clock size={12} />
                            <span>Due: {new Date(i.dueDate).toLocaleDateString()}</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[#c2a336] transition-all gap-3">
    <div className="order-2 sm:order-1">
      <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-black text-[#1a3a32]">{value}</p>
    </div>
    <div className="order-1 sm:order-2 p-2.5 rounded-xl transition-colors self-end sm:self-center" style={{ backgroundColor: `${color}15`, color: color }}>
      {icon}
    </div>
  </div>
);

export default SuperAdminDashboard;