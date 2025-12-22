// src/pages/Admin/AdminDashboard.tsx
import React from "react";
import {
  Gavel,
  Users,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  BellRing,
  Activity,
} from "lucide-react";

const AdminDashboard = () => {
  const BRAND = {
    green: "#1a3a32",
    gold: "#c2a336",
    slate: "#8c94a4",
    lightGold: "#f4f0e6",
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-6 lg:p-10 space-y-6 md:space-y-8">
      {/* Welcome & Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Subtle Decorative Geometric Shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c2a336]/5 -mr-10 -mt-10 rotate-45 hidden sm:block" />
        <div className="absolute bottom-0 right-20 w-16 h-16 bg-[#1a3a32]/5 rotate-12 hidden sm:block" />

        <div className="relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[#c2a336] font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2">
            <ShieldCheck size={16} />
            Secure Administrator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a32] tracking-tight leading-tight">
            Welcome, Administrator
          </h1>
          <p className="text-[#8c94a4] mt-2 max-w-md font-medium leading-relaxed text-sm sm:text-base mx-auto md:mx-0">
            Manage judicial indicators, oversee system users, and ensure
            institutional integrity.
          </p>
        </div>

        <div className="relative z-10 flex flex-row items-center justify-center md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
          <button className="p-3 bg-gray-50 text-[#1a3a32] rounded-xl hover:bg-gray-100 transition-colors relative">
            <BellRing size={20} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="h-10 w-[1px] bg-gray-200 hidden md:block" />
          <div className="text-left md:text-right">
            <p className="text-[9px] sm:text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest">
              Current Status
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#1a3a32] flex items-center justify-start md:justify-end gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              System Active
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Quick Statistics / Metric Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ActionCard
            title="Registry Users"
            count="1,240"
            trend="+12%"
            icon={<Users />}
            color={BRAND.green}
          />
          <ActionCard
            title="Pending Indicators"
            count="42"
            trend="Needs Review"
            icon={<FileText />}
            color={BRAND.gold}
          />
          <ActionCard
            title="System Audits"
            count="08"
            trend="Last 24h"
            icon={<Activity />}
            color="#3b82f6"
          />
          <ActionCard
            title="Case Files"
            count="856"
            trend="Stable"
            icon={<Gavel />}
            color={BRAND.slate}
          />
        </div>

        {/* Institutional Side Panel (Recent Activity) */}
        <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 h-fit">
          <h3 className="text-xs font-bold text-[#1a3a32] uppercase tracking-widest border-b border-gray-50 pb-4 mb-4">
            Security Logs
          </h3>
          <div className="space-y-6">
            <LogEntry
              time="10:24 AM"
              action="Indicator Approved"
              user="Hon. Eric Ogola"
            />
            <LogEntry
              time="09:15 AM"
              action="User Access Revoked"
              user="Registry System"
            />
            <LogEntry
              time="Yesterday"
              action="New Admin Created"
              user="Super Admin"
            />
          </div>
          <button className="w-full mt-8 py-3 text-[10px] sm:text-xs font-bold text-[#c2a336] uppercase tracking-[0.2em] border border-[#c2a336]/20 rounded-xl hover:bg-[#f4f0e6] transition-colors">
            View Full Audit Trail
          </button>
        </aside>
      </div>
    </div>
  );
};

/* --- Internal Components for Dashboard --- */

const ActionCard = ({ title, count, trend, icon, color }: any) => (
  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
    <div className="flex justify-between items-start mb-4">
      <div
        className="p-3 rounded-xl transition-colors"
        style={{ backgroundColor: `${color}10`, color: color }}
      >
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <ArrowUpRight
        className="text-gray-300 group-hover:text-[#c2a336] transition-colors"
        size={20}
      />
    </div>
    <p className="text-[10px] sm:text-xs font-bold text-[#8c94a4] uppercase tracking-widest">
      {title}
    </p>
    <div className="flex items-baseline flex-wrap gap-2 mt-1">
      <span className="text-2xl sm:text-3xl font-black text-[#1a3a32]">{count}</span>
      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
        {trend}
      </span>
    </div>
  </div>
);

const LogEntry = ({ time, action, user }: any) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-2 h-2 rounded-full bg-[#c2a336] mb-1"></div>
      <div className="w-[1px] flex-1 bg-gray-100"></div>
    </div>
    <div className="pb-2">
      <p className="text-[9px] sm:text-[10px] font-bold text-[#8c94a4] uppercase">{time}</p>
      <p className="text-sm font-bold text-[#1a3a32] leading-tight mb-1">{action}</p>
      <p className="text-xs text-gray-500 italic">By {user}</p>
    </div>
  </div>
);

export default AdminDashboard;