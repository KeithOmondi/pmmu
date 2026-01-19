import React, { useEffect, useState, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  selectUserIndicators,
} from "../../store/slices/indicatorsSlice";
import { useNavigate } from "react-router-dom";

/* ============================================================
   CHART COMPONENTS (UNCHANGED)
============================================================ */

const IndicatorStatusPieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0)
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500 border border-gray-300 text-xs">
        No data available
      </div>
    );

  return (
    <div className="relative w-full h-40 flex items-center justify-center">
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
      <div className="absolute text-sm font-bold text-gray-800">
        {total}
      </div>
    </div>
  );
};

const IndicatorProgressBarChart: React.FC<{
  data: { label: string; progress: number; color: string }[];
}> = ({ data }) => (
  <div className="space-y-3">
    {data.map((item, idx) => (
      <div key={idx}>
        <div className="flex justify-between text-xs text-gray-700 mb-1">
          <span>{item.label}</span>
          <span>{item.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 h-2">
          <div
            className="h-2"
            style={{ width: `${item.progress}%`, backgroundColor: item.color }}
          />
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   CONSTANTS (UNCHANGED)
============================================================ */

const STATUS_COLORS: Record<string, string> = {
  upcoming: "#f2c200",
  ongoing: "#0066cc",
  submitted: "#6b7280",
  approved: "#2e7d32",
  rejected: "#c62828",
  overdue: "#b71c1c",
  completed: "#616161",
};

const STATUS_BG_COLORS: Record<string, string> = {
  upcoming: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ongoing: "bg-blue-100 text-blue-800 border-blue-300",
  submitted: "bg-gray-100 text-gray-800 border-gray-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-gray-100 text-gray-800 border-gray-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

/* ============================================================
   HELPERS (UNCHANGED)
============================================================ */



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

/* ============================================================
   COMPONENT
============================================================ */

const UserDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const userIndicators = useAppSelector(selectUserIndicators);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchUserIndicators());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      upcoming: 0,
      ongoing: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
      completed: 0,
    };

    userIndicators.forEach((i) => {
      counts[getLiveStatus(i, now)]++;
    });

    return [
      { label: "Upcoming", key: "upcoming" },
      { label: "Ongoing", key: "ongoing" },
      { label: "Submitted", key: "submitted" },
      { label: "Approved", key: "approved" },
      { label: "Rejected", key: "rejected" },
      { label: "Overdue", key: "overdue" },
      { label: "Completed", key: "completed" },
    ].map((s) => ({ ...s, value: counts[s.key] }));
  }, [userIndicators, now]);

  const liveIndicators = userIndicators.filter(
    (i) =>
      !["approved", "rejected", "completed"].includes(
        getLiveStatus(i, now)
      )
  );

  

  return (
    <div className="min-h-screen bg-[#f5f6f7] p-4 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-lg font-extrabold uppercase text-[#1a3a32]">Principal Registry</h1>
          <p className="text-sm text-gray-600">
            ORHC User Dashboard
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.key}
              className="bg-white border border-gray-300 p-4"
            >
              <p className="text-4xl font-bold text-[#f2c200]">
                {s.value}
              </p>
              <p className="text-xs text-gray-700">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ACTIVE + CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ACTIVE */}
          <div className="lg:col-span-2 bg-white border border-gray-300">
            <div className="border-b border-gray-300 px-4 py-2 font-bold text-sm">
              FORM 30 APPLICATIONS
            </div>
            <div className="divide-y">
              {liveIndicators.map((item) => {
                const status = getLiveStatus(item, now);
                return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/indicator/${item._id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {item.indicatorTitle}
                      </p>
                      <p className="text-xs text-gray-600">
                        Due:{" "}
                        {new Date(item.dueDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 border ${STATUS_BG_COLORS[status]}`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHARTS */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 p-4">
              <h3 className="text-sm font-bold mb-2">
                Status Distribution
              </h3>
              <IndicatorStatusPieChart
                data={stats.map((s) => ({
                  name: s.label,
                  value: s.value,
                  color: STATUS_COLORS[s.key],
                }))}
              />
            </div>

            <div className="bg-white border border-gray-300 p-4">
              <h3 className="text-sm font-bold mb-2">
                Indicator Progress
              </h3>
              <IndicatorProgressBarChart
                data={userIndicators.map((i) => ({
                  label: i.indicatorTitle,
                  progress: i.progress,
                  color: STATUS_COLORS[getLiveStatus(i, now)],
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
