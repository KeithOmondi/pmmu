import React, { useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  FileTextIcon,
  BarChart,
  PieChart,
  CalendarDays,
  ListTodo,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  selectUserIndicators,
} from "../../store/slices/indicatorsSlice";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// Dummy Chart Components (replace with actual chart library components like Recharts, Chart.js)
const IndicatorStatusPieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0)
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 text-gray-400 rounded-lg italic">
        No data available for chart.
      </div>
    );
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {data.map((entry, index) => {
          let startAngle = 0;
          for (let i = 0; i < index; i++) {
            startAngle += (data[i].value / total) * 360;
          }
          const endAngle = startAngle + (entry.value / total) * 360;

          const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

          const startX = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
          const startY = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
          const endX = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
          const endY = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

          return (
            <path
              key={entry.name}
              d={`M50,50 L${startX},${startY} A40,40 0 ${largeArcFlag},1 ${endX},${endY} Z`}
              fill={entry.color}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1E3A2B]">
        {total}
      </div>
    </div>
  );
};

const IndicatorProgressBarChart: React.FC<{
  data: { label: string; progress: number; color: string }[];
}> = ({ data }) => (
  <div className="space-y-4">
    {data.map((item, idx) => (
      <div key={idx}>
        <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
          <span>{item.label}</span>
          <span>{item.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full"
            style={{ width: `${item.progress}%`, backgroundColor: item.color }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);

const STATUS_COLORS: Record<string, string> = {
  upcoming: "#FFC107", // Amber
  ongoing: "#2196F3", // Blue
  submitted: "#9C27B0", // Purple
  approved: "#4CAF50", // Emerald Green
  rejected: "#F44336", // Rose Red
  overdue: "#DC3545", // Darker Red
  completed: "#6C757D", // Gray
  pending: "#FFC107", // Default to Amber
};

const STATUS_BG_COLORS: Record<string, string> = {
  upcoming: "bg-amber-50 text-amber-800",
  ongoing: "bg-blue-50 text-blue-800",
  submitted: "bg-purple-50 text-purple-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  overdue: "bg-red-50 text-red-800",
  completed: "bg-gray-50 text-gray-800",
  pending: "bg-amber-50 text-amber-800",
};

const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);
  const seconds = Math.floor((abs / 1000) % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours && !minutes) parts.push(`${seconds}s`);

  return parts.join(" ");
};

const getLiveStatus = (indicator: any, now: number) => {
  const startTime = new Date(indicator.startDate).getTime();
  const dueTime = new Date(indicator.dueDate).getTime();

  if (indicator.status === "submitted") return "submitted";
  if (indicator.status === "approved") return "approved";
  if (indicator.status === "rejected") return "rejected";
  if (indicator.progress >= 100 || indicator.status === "completed")
    return "completed";

  if (now < startTime) return "upcoming";
  if (now >= startTime && now <= dueTime) return "ongoing";
  if (now > dueTime) return "overdue";

  return "pending";
};

const UserDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const userIndicators = useAppSelector(selectUserIndicators);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchUserIndicators());
  }, [dispatch]);

  const stats = useMemo(() => {
    const statusCounts: Record<string, number> = {
      upcoming: 0,
      ongoing: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
      completed: 0,
    };

    userIndicators.forEach((i) => {
      const status = getLiveStatus(i, now);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      {
        label: "Upcoming",
        value: statusCounts.upcoming,
        icon: <Clock size={20} />,
        color: STATUS_BG_COLORS.upcoming,
        chartColor: STATUS_COLORS.upcoming,
      },
      {
        label: "Ongoing",
        value: statusCounts.ongoing,
        icon: <ShieldCheck size={20} />,
        color: STATUS_BG_COLORS.ongoing,
        chartColor: STATUS_COLORS.ongoing,
      },
      {
        label: "Submitted",
        value: statusCounts.submitted,
        icon: <FileTextIcon size={20} />,
        color: STATUS_BG_COLORS.submitted,
        chartColor: STATUS_COLORS.submitted,
      },
      {
        label: "Approved",
        value: statusCounts.approved,
        icon: <CheckCircle2 size={20} />,
        color: STATUS_BG_COLORS.approved,
        chartColor: STATUS_COLORS.approved,
      },
      {
        label: "Rejected",
        value: statusCounts.rejected,
        icon: <AlertCircle size={20} />,
        color: STATUS_BG_COLORS.rejected,
        chartColor: STATUS_COLORS.rejected,
      },
      {
        label: "Overdue",
        value: statusCounts.overdue,
        icon: <Clock size={20} />,
        color: STATUS_BG_COLORS.overdue,
        chartColor: STATUS_COLORS.overdue,
      },
      {
        label: "Completed",
        value: statusCounts.completed,
        icon: <CheckCircle2 size={20} />,
        color: STATUS_BG_COLORS.completed,
        chartColor: STATUS_COLORS.completed,
      },
    ];
  }, [userIndicators, now]);

  const liveIndicators = useMemo(
    () =>
      userIndicators.filter(
        (i) =>
          !["approved", "rejected", "completed"].includes(getLiveStatus(i, now))
      ),
    [userIndicators, now]
  );

  const completedOrReviewedIndicators = useMemo(
    () =>
      userIndicators.filter((i) =>
        ["approved", "rejected", "completed"].includes(getLiveStatus(i, now))
      ),
    [userIndicators, now]
  );

  const indicatorProgressData = useMemo(
    () =>
      userIndicators.map((i) => ({
        label: i.indicatorTitle,
        progress: i.progress,
        color: STATUS_COLORS[getLiveStatus(i, now)] || "#6C757D",
      })),
    [userIndicators, now]
  );

  const pieChartData = useMemo(
    () =>
      stats
        .filter((s) => s.value > 0)
        .map((s) => ({
          name: s.label,
          value: s.value,
          color: s.chartColor,
        })),
    [stats]
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 lg:p-12 font-sans text-[#1E3A2B]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-[#C69214] text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Zap size={16} fill="currentColor" /> JUDICIARY PORTAL
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1E3A2B] tracking-tight font-serif">
            User Mandate Dashboard
          </h1>
          <p className="text-gray-500 text-lg mt-2">
            Overview of your assigned judicial indicators and progress.
          </p>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer`}
              // Optionally navigate to a filtered list of indicators
              onClick={() =>
                console.log(`Navigate to ${stat.label} indicators`)
              }
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color}`}
              >
                {React.cloneElement(stat.icon, { className: "text-white" })}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-extrabold text-[#1E3A2B]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid: Live Indicators & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Indicators Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1E3A2B] flex items-center gap-3">
                <ListTodo size={24} className="text-[#C69214]" />
                Active Mandates
              </h3>
              <button
                onClick={() => console.log("View all active mandates")}
                className="text-xs font-bold uppercase tracking-wider text-[#C69214] hover:text-[#1E3A2B] transition-colors flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {liveIndicators.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <FileTextIcon
                    size={48}
                    className="mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500 italic font-medium">
                    No active mandates at this time.
                  </p>
                </div>
              ) : (
                liveIndicators.map((item) => {
                  const status = getLiveStatus(item, now);
                  const startTime = new Date(item.startDate).getTime();
                  const dueTime = new Date(item.dueDate).getTime();
                  const timeUntilStart = startTime - now;
                  const timeUntilDue = dueTime - now;

                  let statusLabel = "";
                  if (status === "upcoming")
                    statusLabel = `Commences in ${formatDuration(
                      timeUntilStart
                    )}`;
                  else if (status === "ongoing")
                    statusLabel = `Due in ${formatDuration(timeUntilDue)}`;
                  else if (status === "submitted")
                    statusLabel = "Submitted - awaiting administrative review";
                  else if (status === "overdue")
                    statusLabel = `Overdue by ${formatDuration(-timeUntilDue)}`;
                  else
                    statusLabel = `Status: ${
                      status.charAt(0).toUpperCase() + status.slice(1)
                    }`;

                  return (
                    <div
                      key={item._id}
                      onClick={() => navigate(`/indicator/${item._id}`)} // Navigate on click
                      className={`bg-white p-6 rounded-xl border-l-4 ${
                        status === "overdue"
                          ? "border-red-600"
                          : "border-[#C69214]"
                      } shadow-sm hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-[#1E3A2B]">
                            {item.indicatorTitle}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                            <CalendarDays size={12} className="text-gray-400" />
                            Due:{" "}
                            {new Date(item.dueDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p
                            className={`text-sm font-semibold mt-2 ${
                              status === "overdue"
                                ? "text-red-700"
                                : "text-gray-700"
                            }`}
                          >
                            {statusLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_BG_COLORS[status]}`}
                          >
                            {status.toUpperCase()}
                          </div>
                          <ChevronRight
                            size={20}
                            className="text-gray-400 group-hover:text-[#1E3A2B]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-[#1E3A2B] mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-[#C69214]" />
                Status Distribution
              </h3>
              <IndicatorStatusPieChart data={pieChartData} />
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                {stats
                  .filter((s) => s.value > 0)
                  .map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.chartColor }}
                      ></span>
                      <span className="text-gray-600">
                        {s.label} ({s.value})
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-[#1E3A2B] mb-4 flex items-center gap-2">
                <BarChart size={20} className="text-[#C69214]" />
                Indicator Progress
              </h3>
              <IndicatorProgressBarChart data={indicatorProgressData} />
            </div>
          </div>
        </div>

        {/* Completed/Reviewed Mandates */}
        {completedOrReviewedIndicators.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1E3A2B] flex items-center gap-3">
                <CheckCircle2 size={24} className="text-green-600" />
                Reviewed Mandates
              </h3>
              <button
                onClick={() => console.log("View all reviewed mandates")}
                className="text-xs font-bold uppercase tracking-wider text-[#C69214] hover:text-[#1E3A2B] transition-colors flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedOrReviewedIndicators.map((item) => {
                const status = getLiveStatus(item, now);
                const isApproved = status === "approved";
                const isRejected = status === "rejected";
                const isCompleted = status === "completed";

                return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/indicator/${item._id}`)} // Navigate on click
                    className={`bg-white p-6 rounded-xl border-l-4 ${
                      isApproved
                        ? "border-green-600"
                        : isRejected
                        ? "border-red-600"
                        : "border-gray-400"
                    } shadow-sm hover:shadow-md transition-all opacity-80 hover:opacity-100 cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          isApproved
                            ? "bg-green-100"
                            : isRejected
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {isApproved && (
                          <CheckCircle2 size={20} className="text-green-700" />
                        )}
                        {isRejected && (
                          <AlertCircle size={20} className="text-red-700" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 size={20} className="text-gray-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-md text-[#1E3A2B]">
                          {item.indicatorTitle}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {isApproved
                            ? "Approved"
                            : isRejected
                            ? "Rejected"
                            : "Completed"}{" "}
                          on{" "}
                          {new Date(item.dueDate).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
