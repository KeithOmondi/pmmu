import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  selectUserIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import { useNavigate } from "react-router-dom";
import { Loader2, Gavel, CheckCircle2, AlertTriangle, Clock, XCircle, Send, Scale } from "lucide-react";

/* ============================================================
   JUDICIARY COLOR PALETTE & COMPACT THEMES
============================================================ */
const STATUS_CONFIG: Record<string, { color: string; theme: string; icon: any; label: string }> = {
  ongoing: { 
    label: "In Progress",
    color: "#1E3A2B", 
    theme: "bg-[#F0FDF4] border-[#1E3A2B] text-[#1E3A2B]",
    icon: Clock 
  },
  submitted: { 
    label: "Submitted",
    color: "#4B5563", 
    theme: "bg-[#F9FAFB] border-[#4B5563] text-[#4B5563]",
    icon: Send 
  },
  approved: { 
    label: "Approved",
    color: "#C69214", 
    theme: "bg-[#FFFBEB] border-[#C69214] text-[#C69214]",
    icon: Gavel 
  },
  completed: { 
    label: "Completed",
    color: "#059669", 
    theme: "bg-[#ECFDF5] border-[#059669] text-[#059669]",
    icon: CheckCircle2 
  },
  rejected: { 
    label: "Rejected",
    color: "#991B1B", 
    theme: "bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]",
    icon: XCircle 
  },
  overdue: { 
    label: "Overdue",
    color: "#7f1d1d", 
    theme: "bg-red-50 border-red-800 text-red-900",
    icon: AlertTriangle 
  },
};

const UserDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const indicators = useAppSelector(selectUserIndicators);
  const isLoading = useAppSelector(selectIndicatorsLoading);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    dispatch(fetchUserIndicators());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [dispatch]);

  const getLiveStatus = (i: any, currentTime: number) => {
    if (i.status === "completed") return "completed";
    if (i.status === "approved") return "approved";
    if (i.status === "rejected") return "rejected";
    if (i.status === "submitted") return "submitted";
    
    const due = new Date(i.dueDate).getTime();
    if (currentTime > due) return "overdue";
    return "ongoing";
  };

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      ongoing: 0, submitted: 0, approved: 0, completed: 0, rejected: 0, overdue: 0
    };
    indicators.forEach((i) => counts[getLiveStatus(i, now)]++);
    return Object.entries(counts).map(([key, value]) => ({ key, value }));
  }, [indicators, now]);

  if (isLoading && indicators.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#C69214] mb-2" size={32} />
        <p className="text-[10px] font-black text-[#1E3A2B] uppercase tracking-widest">Registry Sync...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* COMPACT HEADER */}
        <div className="border-b-2 border-[#C69214] pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Scale className="text-[#1E3A2B]" size={24} />
            <div>
                <h1 className="text-xl font-black text-[#1E3A2B] uppercase tracking-tight">Principal Registry</h1>
                <p className="text-[#C69214] font-bold text-[9px] uppercase tracking-[0.2em]">User Oversight</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Live Update</p>
            <p className="font-mono text-xs font-bold text-[#1E3A2B]">{new Date(now).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* 6-BOX COMPACT GRID (3x2) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map(({ key, value }) => {
            const Config = STATUS_CONFIG[key];
            const Icon = Config.icon;
            return (
              <div 
                key={key} 
                className={`p-4 rounded-xl border-l-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${Config.theme}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Icon size={16} strokeWidth={2.5} />
                  <span className="text-[8px] font-black uppercase opacity-50">Status</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black leading-none">{value}</p>
                  <p className="text-[9px] font-bold uppercase truncate">{Config.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FILINGS LIST */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-[10px] font-black text-[#1E3A2B] uppercase tracking-widest flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#C69214]" />
                 Recent Filings
               </h2>
            </div>
            
            <div className="bg-white rounded-2xl border border-[#E5D5B0] overflow-hidden shadow-sm">
              {indicators.map((i) => {
                const statusKey = getLiveStatus(i, now);
                const Config = STATUS_CONFIG[statusKey];
                return (
                  <div 
                    key={i._id} 
                    onClick={() => navigate(`/user/indicators/${i._id}`)}
                    className="group border-b border-gray-50 p-4 flex items-center justify-between hover:bg-[#F9F4E8]/40 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-sm text-[#1E3A2B] group-hover:text-[#C69214] transition-colors truncate">
                        {i.indicatorTitle}
                      </h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                        Due: {new Date(i.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black border uppercase ${Config.theme}`}>
                      {statusKey}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR ANALYTICS */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5D5B0] p-6 shadow-sm text-center">
                <h3 className="text-[9px] font-black text-[#C69214] uppercase tracking-widest mb-6">Distribution</h3>
                <IndicatorStatusPieChart data={stats} />
            </div>

            <div className="p-5 bg-[#1E3A2B] rounded-2xl border-l-4 border-[#C69214] shadow-lg relative overflow-hidden group">
                <p className="text-[9px] font-black text-[#C69214] uppercase mb-1">Process Note</p>
                <p className="text-[10px] text-white/80 leading-tight">
                  Admin 'Approved' items require Super-Admin seal to move to 'Completed'.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   REDUCED PIE CHART
============================================================ */
const IndicatorStatusPieChart: React.FC<{ data: { key: string; value: number }[] }> = ({ data }) => {
  const total = data.reduce((s, i) => s + i.value, 0);
  if (!total) return <div className="text-[10px] text-gray-300 py-10 italic">Registry Empty</div>;

  return (
    <div className="relative flex justify-center items-center">
      <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
        {data.map((e, i) => {
          let start = 0;
          for (let x = 0; x < i; x++) start += (data[x].value / total) * 360;
          const end = start + (e.value / total) * 360;
          if (start === end) return null;
          const arc = end - start <= 180 ? 0 : 1;
          const sx = 50 + 40 * Math.cos((Math.PI * start) / 180);
          const sy = 50 + 40 * Math.sin((Math.PI * start) / 180);
          const ex = 50 + 40 * Math.cos((Math.PI * end) / 180);
          const ey = 50 + 40 * Math.sin((Math.PI * end) / 180);
          return (
            <path
              key={e.key}
              d={`M50,50 L${sx},${sy} A40,40 0 ${arc},1 ${ex},${ey} Z`}
              fill={STATUS_CONFIG[e.key].color}
              className="hover:opacity-80 transition-opacity cursor-pointer stroke-white stroke-[1px]"
            />
          );
        })}
        <circle cx="50" cy="50" r="32" fill="white" />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-black text-[#1E3A2B]">{total}</p>
        <p className="text-[7px] font-black text-[#C69214] uppercase">Total</p>
      </div>
    </div>
  );
};

export default UserDashboard;