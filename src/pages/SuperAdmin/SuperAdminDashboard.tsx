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
import { fetchUsers } from "../../store/slices/userSlice";
import {
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  LayoutDashboard,
  CheckCheck,
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
  completed: "#16a34a",
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

  // --- Metrics Logic ---
  const metrics = useMemo(() => {
    const upcoming = indicators.filter(
      (i) => new Date(i.startDate).getTime() > now
    );

    const ongoing = indicators.filter(
      (i) =>
        new Date(i.startDate).getTime() <= now &&
        new Date(i.dueDate).getTime() >= now &&
        !["completed", "approved", "rejected"].includes(i.status)
    );

    const pending = indicators.filter((i) => i.status === "pending");
    const approved = indicators.filter((i) => i.status === "approved");
    const completed = indicators.filter((i) => i.status === "completed");

    const overdue = indicators.filter(
      (i) =>
        !["approved", "completed", "rejected"].includes(i.status) &&
        new Date(i.dueDate).getTime() < now
    );

    return { upcoming, ongoing, pending, approved, completed, overdue };
  }, [indicators, now]);

  // --- Pie Chart Data ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      overdue: 0,
    };

    indicators.forEach((i) => {
      if (["approved", "completed", "rejected"].includes(i.status)) {
        counts[i.status] = (counts[i.status] || 0) + 1;
      } else {
        const isOverdue = new Date(i.dueDate).getTime() < now;
        if (isOverdue) counts.overdue += 1;
        else counts[i.status] = (counts[i.status] || 0) + 1;
      }
    });

    return Object.keys(counts).map((key) => ({
      name: key.toUpperCase(),
      value: counts[key],
      color: STATUS_COLORS[key],
    }));
  }, [indicators, now]);

  // --- Bar Chart Data ---
  const barData = useMemo(() => {
    return categories.map((cat) => ({
      name:
        cat.title.length > 10 ? cat.title.substring(0, 10) + ".." : cat.title,
      count: indicators.filter((i) => i.category?._id === cat._id).length,
    }));
  }, [categories, indicators]);

  if (indicatorsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-medium tracking-widest uppercase text-[10px]">
          Loading Judiciary Analytics
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa] space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a3a32] tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-[#c2a336]" />
            Dashboard
          </h1>
          <p className="text-[#8c94a4] mt-1 font-medium text-xs sm:text-sm">
            High Court of Kenya | Analytics
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm self-start md:self-center">
          <p className="text-[10px] font-bold text-[#1a3a32] uppercase tracking-tighter opacity-60">
            Current Session
          </p>
          <p className="text-sm text-[#c2a336] font-semibold">
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Upcoming"
          value={metrics.upcoming.length}
          icon={<Calendar size={18} />}
          color={BRAND.slate}
        />
        <StatCard
          title="Ongoing"
          value={metrics.ongoing.length}
          icon={<Timer size={18} />}
          color="#3b82f6"
        />
        <StatCard
          title="Pending"
          value={metrics.pending.length}
          icon={<Clock size={18} />}
          color={BRAND.gold}
        />
        <StatCard
          title="Approved"
          value={metrics.approved.length}
          icon={<CheckCircle2 size={18} />}
          color={BRAND.green}
        />
        <StatCard
          title="Completed"
          value={metrics.completed.length}
          icon={<CheckCheck size={18} />}
          color="#16a34a"
        />
        <StatCard
          title="Overdue"
          value={metrics.overdue.length}
          icon={<AlertCircle size={18} />}
          color="#991b1b"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <h2 className="text-md sm:text-lg font-bold text-[#1a3a32] mb-6 border-l-4 border-[#c2a336] pl-3">
            Status
          </h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Volume Bar Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-md sm:text-lg font-bold text-[#1a3a32] mb-6 border-l-4 border-[#c2a336] pl-3">
            Category Volume
          </h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8c94a4", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8c94a4", fontSize: 10 }}
                />
                <Tooltip cursor={{ fill: "#f8f9fa" }} />
                <Bar
                  dataKey="count"
                  fill={BRAND.green}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Timeline Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-md sm:text-lg font-bold text-[#1a3a32]">
            Critical Timeline View
          </h2>
          <span className="text-[10px] bg-[#f4f0e6] text-[#c2a336] px-2 py-1 rounded-md font-bold uppercase">
            Live Tracking
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#fcfcfc] text-[#8c94a4] uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 text-left font-bold">Indicator</th>
                <th className="px-6 py-4 text-left font-bold">Category</th>
                <th className="px-6 py-4 text-left font-bold">Official</th>
                <th className="px-6 py-4 text-left font-bold text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...metrics.upcoming, ...metrics.ongoing]
                .slice(0, 6)
                .map((i) => (
                  <tr
                    key={i._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1a3a32]">
                      {i.indicatorTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {i.category?.title ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 text-xs font-medium">
                        {i.assignedToType === "individual"
                          ? "Official Assignment"
                          : "Group Task"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border`}
                        style={{
                          backgroundColor: STATUS_COLORS[i.status] + "15",
                          borderColor: STATUS_COLORS[i.status],
                          color: STATUS_COLORS[i.status],
                        }}
                      >
                        {i.status.toUpperCase()}
                      </span>
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

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[#c2a336] transition-all gap-3">
    <div className="order-2 sm:order-1">
      <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-xl sm:text-2xl font-black text-[#1a3a32]">{value}</p>
    </div>
    <div
      className="order-1 sm:order-2 p-2.5 rounded-xl transition-colors self-end sm:self-center"
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      {icon}
    </div>
  </div>
);

export default SuperAdminDashboard;
