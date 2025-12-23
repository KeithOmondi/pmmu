import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Database,
  UserPlus,
  History,
  Cpu,
  HardDrive,
  RefreshCw,
  Server,
  Download,
  Trash2,
  CheckCircle,
  Lock,
} from "lucide-react";

const SuperAdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "health" | "admins" | "backups" | "audit"
  >("health");

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#0f172a] text-slate-200 space-y-8 animate-in fade-in duration-700">
      {/* SuperAdmin Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 translate-x-1/4 -translate-y-1/4">
          <ShieldAlert size={400} strokeWidth={1} className="text-[#c2a336]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#c2a336] mb-3 font-bold uppercase tracking-[0.4em] text-[10px]">
            <Lock size={16} /> Restricted: SuperUser Level
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Infrastructure <span className="text-[#c2a336]">.</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-2 max-w-md">
            Monitor system architecture, manage regional admins, and execute
            disaster recovery.
          </p>
        </div>

        <div className="flex gap-4 relative z-10">
          <button className="flex items-center gap-2 px-6 py-3 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
            <Activity size={14} /> Kill All Sessions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <SuperTab
            active={activeTab === "health"}
            onClick={() => setActiveTab("health")}
            icon={<Cpu />}
            label="System Health"
          />
          <SuperTab
            active={activeTab === "admins"}
            onClick={() => setActiveTab("admins")}
            icon={<UserPlus />}
            label="Admin Management"
          />
          <SuperTab
            active={activeTab === "backups"}
            onClick={() => setActiveTab("backups")}
            icon={<Database />}
            label="Backups & Data"
          />
          <SuperTab
            active={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
            icon={<History />}
            label="Global Audit Log"
          />
        </div>

        {/* Content Window */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === "health" && <SystemHealth />}
          {activeTab === "admins" && <AdminUserList />}
          {activeTab === "backups" && <BackupControls />}
          {activeTab === "audit" && <AuditLogs />}
        </div>
      </div>
    </div>
  );
};

// --- Sub-sections ---

const SystemHealth = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4">
    <HealthCard label="CPU Usage" value="12%" status="Normal" icon={<Cpu />} />
    <HealthCard
      label="RAM Latency"
      value="1.2gb"
      status="Optimal"
      icon={<HardDrive />}
    />
    <HealthCard
      label="API Uptime"
      value="99.98%"
      status="Stable"
      icon={<Server />}
    />

    <div className="md:col-span-3 bg-slate-900 border border-slate-800 p-8 rounded-[2rem]">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
        <Activity className="text-[#c2a336]" /> Live Traffic Monitor
      </h3>
      <div className="h-48 flex items-end gap-2 px-4">
        {[40, 70, 45, 90, 65, 80, 30, 95, 50, 75, 85, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-[#c2a336]/20 rounded-t-lg transition-all hover:bg-[#c2a336]/50 group relative"
            style={{ height: `${h}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {h}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AdminUserList = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-4">
    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
      <h3 className="font-bold text-xl">Regional Administrators</h3>
      <button className="bg-[#c2a336] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
        Promote User
      </button>
    </div>
    <table className="w-full text-left">
      <thead className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-widest">
        <tr>
          <th className="px-8 py-4">Administrator</th>
          <th className="px-8 py-4">Access Level</th>
          <th className="px-8 py-4">Last Active</th>
          <th className="px-8 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800">
        {[
          {
            name: "John Doe",
            email: "john@org.com",
            role: "Financial Admin",
            active: "2 mins ago",
          },
          {
            name: "Sarah Smith",
            email: "sarah@org.com",
            role: "HR Super",
            active: "1 hour ago",
          },
        ].map((user, i) => (
          <tr key={i} className="hover:bg-slate-800/30 transition-colors">
            <td className="px-8 py-5">
              <div className="font-bold">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </td>
            <td className="px-8 py-5 text-xs font-mono text-[#c2a336]">
              {user.role}
            </td>
            <td className="px-8 py-5 text-xs text-slate-400">{user.active}</td>
            <td className="px-8 py-5 text-right">
              <button className="text-rose-500 hover:text-rose-400 p-2">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BackupControls = () => (
  <div className="space-y-6 animate-in slide-in-from-right-4">
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-between">
      <div>
        <h3 className="font-bold text-xl">Manual Database Snapshot</h3>
        <p className="text-sm text-slate-400">
          Export a compressed JSON dump of all system clusters.
        </p>
      </div>
      <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#c2a336] transition-all">
        <Download size={18} /> Initiate Backup
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
        <h4 className="font-bold text-slate-400 text-xs uppercase mb-4">
          Auto-Retention Policy
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Keep last 30 snapshots</span>
          <RefreshCw size={18} className="text-emerald-500" />
        </div>
      </div>
      <div className="p-6 bg-rose-950/20 border border-rose-900/30 rounded-3xl">
        <h4 className="font-bold text-rose-400 text-xs uppercase mb-4">
          Danger Zone
        </h4>
        <button className="text-rose-500 text-xs font-black underline hover:text-rose-400">
          Purge Obsolete Records
        </button>
      </div>
    </div>
  </div>
);

// --- Helpers ---

const SuperTab = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold text-sm transition-all ${
      active
        ? "bg-[#c2a336] text-black shadow-xl translate-x-2"
        : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
    }`}
  >
    {React.cloneElement(icon, { size: 20 })} {label}
  </button>
);

const HealthCard = ({ label, value, status, icon }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-800 text-[#c2a336] rounded-xl">{icon}</div>
      <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
        <CheckCircle size={10} /> {status}
      </span>
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
      {label}
    </p>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const AuditLogs = () => (
  <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] animate-in slide-in-from-right-4">
    <SectionHeader
      title="System Audit Trace"
      subtitle="Immutable logs of every administrative action."
    />
    <div className="mt-8 space-y-4">
      {[
        { action: "DB_BACKUP_INITIATED", user: "SuperAdmin", time: "10:45 AM" },
        {
          action: "USER_ROLE_PROMOTED",
          user: "SuperAdmin",
          target: "John Doe",
          time: "Yesterday",
        },
        {
          action: "SECURITY_PROTOCOL_CHANGE",
          user: "System",
          time: "2 days ago",
        },
      ].map((log, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border-l-2 border-[#c2a336]"
        >
          <div className="text-[10px] font-mono text-slate-500">{log.time}</div>
          <div className="text-xs font-black text-white">{log.action}</div>
          <div className="text-xs text-slate-400 ml-auto">By: {log.user}</div>
        </div>
      ))}
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: any) => (
  <div>
    <h3 className="text-xl font-black text-white tracking-tight uppercase">
      {title}
    </h3>
    <p className="text-xs text-[#c2a336] font-bold uppercase tracking-widest mt-1">
      {subtitle}
    </p>
  </div>
);

export default SuperAdminSettings;
