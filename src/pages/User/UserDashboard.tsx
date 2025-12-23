// src/pages/User/UserDashboard.tsx
import React, { useEffect } from "react";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  fetchUserIndicators,
  type IIndicator,
  selectUserIndicators,
} from "../../store/slices/indicatorsSlice";

const UserDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userIndicators = useSelector<RootState, IIndicator[]>(
    selectUserIndicators
  );

  useEffect(() => {
    dispatch(fetchUserIndicators());
  }, [dispatch]);

  // Compute stats dynamically
  const activeMandates = userIndicators.filter(
    (i) => i.status === "approved"
  ).length;
  const pendingReview = userIndicators.filter(
    (i) => i.status === "pending"
  ).length;
  const ratified = userIndicators.filter((i) => i.status === "approved").length; // example, adjust logic if needed
  const urgentAction = userIndicators.filter(
    (i) => i.status === "overdue"
  ).length;

  const stats = [
    {
      label: "Active Task(s)",
      value: activeMandates,
      icon: <ShieldCheck size={20} />,
      color: "bg-[#1a3a32] text-[#c2a336]",
    },
    {
      label: "Pending Review",
      value: pendingReview,
      icon: <Clock size={20} />,
      color: "bg-[#f4f0e6] text-[#c2a336]",
    },
    {
      label: "Approved",
      value: ratified,
      icon: <CheckCircle2 size={20} />,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Urgent Action",
      value: urgentAction,
      icon: <AlertCircle size={20} />,
      color: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex items-center gap-2 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Zap size={14} fill="currentColor" />
            Operational Overview
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1a3a32] tracking-tighter">
            User Dashboard
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Welcome back
          </p>
        </header>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color}`}
              >
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-[#1a3a32]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Priority Mandates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1a3a32] uppercase tracking-tight">
                Priority Mandates
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] hover:text-[#1a3a32] transition-colors flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {userIndicators.slice(0, 2).map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-6 rounded-[2rem] border-l-4 border-l-[#c2a336] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-black text-[#1a3a32] text-md">
                      {item.indicatorTitle}
                    </h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight mt-1">
                      Due {new Date(item.dueDate).toLocaleDateString()} •
                      Section B-12
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Progress
                      </p>
                      <p className="text-sm font-black text-[#1a3a32]">
                        {item.progress}%
                      </p>
                    </div>
                    <button className="bg-[#1a3a32] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-colors shadow-lg shadow-[#1a3a32]/10">
                      Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency Overview */}
          <div className="bg-[#1a3a32] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12" />

            <h3 className="text-lg font-black uppercase tracking-widest mb-8 text-[#c2a336]">
              Efficiency Score
            </h3>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="#c2a336"
                    strokeWidth="8"
                    strokeDasharray="440"
                    strokeDashoffset="88"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">82%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Tier 1
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-white/60 font-medium mt-8 leading-relaxed">
                Your performance is{" "}
                <span className="text-white font-bold">12% higher</span> than
                the departmental average this month.
              </p>
            </div>

            <button className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
              Download Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
