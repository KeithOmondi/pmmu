import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  selectUserIndicators,
} from "../../store/slices/indicatorsSlice";
import { useNavigate } from "react-router-dom";

/* ============================================================
   STYLING CONSTANTS (Judiciary Palette)
============================================================ */
// Deep Emerald: #1E3A2B | Gold: #C69214 | Paper: #F9F4E8
const STATUS_COLORS: Record<string, string> = {
  upcoming: "#C69214", // Gold
  ongoing: "#1E3A2B", // Emerald
  submitted: "#4B5563",
  approved: "#15803d",
  rejected: "#991b1b",
  overdue: "#7f1d1d",
  completed: "#064e3b",
};

const STATUS_CLASSES: Record<string, string> = {
  upcoming: "bg-[#F9F4E8] text-[#C69214] border-[#E5D5B0]",
  ongoing: "bg-[#E7F3EC] text-[#1E3A2B] border-[#1E3A2B]/20",
  submitted: "bg-slate-50 text-slate-700 border-slate-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
  overdue: "bg-red-100 text-red-900 border-red-300",
  completed: "bg-[#1E3A2B] text-white border-[#1E3A2B]",
};

/* ============================================================
   CHART COMPONENTS
============================================================ */

const IndicatorStatusPieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const total = data.reduce((s, i) => s + i.value, 0);

  if (!total)
    return (
      <div className="flex items-center justify-center h-48 rounded-xl bg-[#F9F4E8]/50 text-xs text-slate-400 italic border border-dashed border-[#E5D5B0]">
        No data available
      </div>
    );

  return (
    <div className="relative h-48 flex justify-center items-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((e, i) => {
          let start = 0;
          for (let x = 0; x < i; x++) start += (data[x].value / total) * 360;
          const end = start + (e.value / total) * 360;
          const arc = end - start <= 180 ? 0 : 1;
          const sx = 50 + 40 * Math.cos((Math.PI * start) / 180);
          const sy = 50 + 40 * Math.sin((Math.PI * start) / 180);
          const ex = 50 + 40 * Math.cos((Math.PI * end) / 180);
          const ey = 50 + 40 * Math.sin((Math.PI * end) / 180);

          return (
            <path
              key={e.name}
              d={`M50,50 L${sx},${sy} A40,40 0 ${arc},1 ${ex},${ey} Z`}
              fill={e.color}
              className="transition-opacity duration-300 hover:opacity-90"
            />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="white" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-[#1E3A2B]">{total}</span>
        <span className="text-[10px] uppercase font-bold tracking-tighter text-[#C69214]">
          Total
        </span>
      </div>
    </div>
  );
};

const IndicatorProgressBarChart: React.FC<{
  data: { label: string; progress: number; color: string }[];
}> = ({ data }) => (
  <div className="space-y-4">
    {data.slice(0, 5).map((i, idx) => (
      <div key={idx}>
        <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-500">
          <span className="truncate pr-4">{i.label}</span>
          <span className="text-[#1E3A2B]">{i.progress}%</span>
        </div>
        <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${i.progress}%`, backgroundColor: i.color }}
          />
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   MAIN COMPONENT
============================================================ */

const UserDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectUserIndicators);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchUserIndicators());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [dispatch]);

  const getLiveStatus = (i: any, currentTime: number) => {
    const start = new Date(i.startDate).getTime();
    const due = new Date(i.dueDate).getTime();
    if (i.status === "submitted") return "submitted";
    if (i.status === "approved") return "approved";
    if (i.status === "rejected") return "rejected";
    if (i.progress >= 100 || i.status === "completed") return "completed";
    if (currentTime < start) return "upcoming";
    if (currentTime <= due) return "ongoing";
    return "overdue";
  };

  const stats = useMemo(() => {
    const c: Record<string, number> = {
      upcoming: 0,
      ongoing: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
      completed: 0,
    };
    indicators.forEach((i) => c[getLiveStatus(i, now)]++);
    return Object.entries(c).map(([key, value]) => ({
      key,
      label: key,
      value,
    }));
  }, [indicators, now]);

  const active = indicators.filter(
    (i) =>
      !["approved", "rejected", "completed"].includes(getLiveStatus(i, now)),
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-[#C69214] pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#1E3A2B] tracking-tight uppercase font-serif">
              The Judiciary of Kenya
            </h1>
            <p className="text-[#C69214] font-bold text-sm tracking-widest uppercase">
              Principal Registry • Performance Dashboard
            </p>
          </div>
          <div className="bg-[#1E3A2B] px-4 py-2 rounded border-l-4 border-[#C69214] shadow-md self-start">
            <span className="text-[10px] font-bold text-white/60 uppercase block leading-none mb-1">
              System Time
            </span>
            <span className="text-sm font-mono font-bold text-[#C69214]">
              {new Date(now).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* STATS GRID - 3 COLUMNS (Judiciary Colors Applied) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stats.slice(0, 6).map((s) => (
            <div
              key={s.key}
              className={`p-6 rounded-xl border-2 transition-all shadow-sm flex items-center justify-between ${STATUS_CLASSES[s.key]}`}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                  {s.label}
                </p>
                <p className="text-4xl font-black">{s.value}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <div
                  className="h-3 w-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: STATUS_COLORS[s.key] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MAIN APPLICATION LIST */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-[#E5D5B0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5D5B0] flex justify-between items-center bg-[#F9F4E8]">
              <h2 className="font-bold text-xs text-[#1E3A2B] uppercase tracking-widest">
                Active Judicial Indicators
              </h2>
              <span className="px-3 py-1 rounded bg-[#1E3A2B] text-[#C69214] text-[10px] font-black">
                {active.length} PENDING REVIEW
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {active.map((i) => {
                const s = getLiveStatus(i, now);
                return (
                  <div
                    key={i._id}
                    onClick={() => navigate(`/indicator/${i._id}`)}
                    className="p-5 hover:bg-[#F9F4E8]/30 cursor-pointer group transition-all flex items-center justify-between"
                  >
                    <div className="space-y-2">
                      <p className="font-bold text-[#1E3A2B] group-hover:text-[#C69214] transition-colors text-lg">
                        {i.indicatorTitle}
                      </p>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          Deadline:{" "}
                          {new Date(i.dueDate).toLocaleDateString("en-GB")}
                        </span>
                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full transition-all duration-1000 ease-in-out"
                            style={{
                              width: `${i.progress}%`,
                              backgroundColor: STATUS_COLORS[s],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black px-4 py-2 rounded border-2 shadow-sm tracking-tighter ${STATUS_CLASSES[s]}`}
                    >
                      {s.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR ANALYTICS */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-[#E5D5B0] p-6">
              <h3 className="text-[10px] font-black text-[#C69214] uppercase tracking-[0.2em] mb-6 border-b border-[#F9F4E8] pb-2">
                Judicial Summary
              </h3>
              <IndicatorStatusPieChart
                data={stats.map((s) => ({
                  name: s.label,
                  value: s.value,
                  color: STATUS_COLORS[s.key],
                }))}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md border border-[#E5D5B0] p-6">
              <h3 className="text-[10px] font-black text-[#C69214] uppercase tracking-[0.2em] mb-6 border-b border-[#F9F4E8] pb-2">
                Registry Scorecard
              </h3>
              <IndicatorProgressBarChart
                data={indicators.map((i) => ({
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
