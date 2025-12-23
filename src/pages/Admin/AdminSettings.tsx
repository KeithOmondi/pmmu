import React, { useState } from "react";
import {
  Settings,
  Users,
  ShieldCheck,
  Bell,
  Palette,
  Globe,
  Database,
  Save,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "general" | "security" | "notifications" | "registry"
  >("general");

  const handleSave = () => {
    toast.success("System configurations updated globally.");
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8fafc] space-y-8 animate-in fade-in duration-700">
      {/* Visual Accent */}
      <div className="fixed top-0 right-0 w-1/4 h-1/4 bg-[#c2a336]/5 blur-[120px] -z-10 rounded-full" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[#1a3a32] p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
          <Settings size={300} strokeWidth={1} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#c2a336] mb-3 font-bold uppercase tracking-[0.3em] text-[10px]">
            <ShieldCheck size={16} /> Root Administrator Access
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            System Control <span className="text-[#c2a336]">.</span>
          </h1>
          <p className="text-white/60 text-sm font-medium mt-2 max-w-md">
            Configure global parameters, security protocols
          </p>
        </div>

        <button
          onClick={handleSave}
          className="relative z-10 flex items-center gap-3 px-8 py-4 bg-[#c2a336] text-[#1a3a32] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d4b54a] transition-all shadow-xl active:scale-95"
        >
          <Save size={18} /> Deploy Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 space-y-2">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<Globe size={18} />}
            label="General Config"
          />
          <TabButton
            active={activeTab === "registry"}
            onClick={() => setActiveTab("registry")}
            icon={<Database size={18} />}
            label="Registry & Categories"
          />
          <TabButton
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={<Lock size={18} />}
            label="Security & Roles"
          />
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={<Bell size={18} />}
            label="Alert Protocols"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-slate-100 p-8 lg:p-12 min-h-[600px]">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "registry" && <RegistrySettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "notifications" && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
};

// --- Tab Sections ---

const GeneralSettings = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <SectionHeader
      title="Institutional Profile"
      subtitle="Public-facing organization details and branding."
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <InputGroup
        label="Organization Name"
        placeholder="e.g. Strategic Management Unit"
      />
      <InputGroup
        label="System Language"
        type="select"
        options={["English (Global)", "French", "Spanish"]}
      />
      <InputGroup
        label="Timezone"
        type="select"
        options={["UTC+0 (GMT)", "UTC+1 (WAT)", "UTC+3 (EAT)"]}
      />
      <InputGroup
        label="Report Frequency"
        type="select"
        options={["Weekly", "Bi-Weekly", "Monthly"]}
      />
    </div>

    <hr className="border-slate-100" />

    <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300">
          <Palette size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-[#1a3a32] uppercase">
            System Branding
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            Upload organization logo (PNG/SVG, max 2MB)
          </p>
        </div>
        <button className="ml-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#1a3a32] hover:bg-slate-50 transition-all">
          Upload New
        </button>
      </div>
    </div>
  </div>
);

const RegistrySettings = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <div className="flex justify-between items-end">
      <SectionHeader
        title="Category Registry"
        subtitle="Manage the classification system for indicators."
      />
      <button className="flex items-center gap-2 px-4 py-2 bg-[#1a3a32] text-[#c2a336] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#244d42] transition-all">
        <Plus size={16} /> Add Category
      </button>
    </div>

    <div className="space-y-3">
      {[
        "Infrastructure",
        "Financial Audit",
        "Human Capital",
        "Strategic Growth",
      ].map((cat) => (
        <div
          key={cat}
          className="group flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#c2a336]/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#c2a336]" />
            <span className="font-bold text-[#1a3a32] text-sm">{cat}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button className="p-2 text-slate-400 hover:text-[#1a3a32]">
              <Settings size={16} />
            </button>
            <button className="p-2 text-slate-400 hover:text-rose-500">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <SectionHeader
      title="Access Protocols"
      subtitle="Define authorization levels and MFA requirements."
    />

    <div className="space-y-6">
      <ToggleItem
        title="Two-Factor Authentication (MFA)"
        desc="Enforce MFA for all SuperAdmin and Admin accounts."
        defaultChecked
      />
      <ToggleItem
        title="Session Persistence"
        desc="Allow users to stay logged in for up to 30 days."
      />
      <ToggleItem
        title="External API Access"
        desc="Allow report synchronization with external BI tools."
        defaultChecked
      />
    </div>

    <div className="mt-10 p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex gap-4">
      <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 h-fit">
        <Info size={24} />
      </div>
      <div>
        <h4 className="text-sm font-black text-rose-900 uppercase">
          Emergency Override
        </h4>
        <p className="text-xs text-rose-700 font-medium mt-1 leading-relaxed">
          Activating override mode will suspend all automated reporting alerts
          and lock the registry to Read-Only for standard users.
        </p>
        <button className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">
          Initialize Override
        </button>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <SectionHeader
      title="Global Alerts"
      subtitle="Configure automated SMTP and system notifications."
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
        <h4 className="font-bold text-[#1a3a32] mb-4 flex items-center gap-2">
          <Bell size={18} className="text-[#c2a336]" /> Delivery Channels
        </h4>
        <div className="space-y-4">
          <CheckboxItem label="Email Reports (Daily PDF)" defaultChecked />
          <CheckboxItem label="System Toast Messages" defaultChecked />
          <CheckboxItem label="Slack Integration" />
        </div>
      </div>
      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
        <h4 className="font-bold text-[#1a3a32] mb-4 flex items-center gap-2">
          <Users size={18} className="text-[#c2a336]" /> Target Audience
        </h4>
        <div className="space-y-4">
          <CheckboxItem label="Notify Individual Owners" defaultChecked />
          <CheckboxItem label="Notify Group Heads" defaultChecked />
          <CheckboxItem label="Notify Board Members" />
        </div>
      </div>
    </div>
  </div>
);

// --- UI Components ---

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
      active
        ? "bg-[#1a3a32] text-[#c2a336] shadow-lg shadow-[#1a3a32]/20 translate-x-2"
        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
    }`}
  >
    {icon} {label}
    <ChevronRight
      size={16}
      className={`ml-auto transition-all ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  </button>
);

const SectionHeader = ({ title, subtitle }: any) => (
  <div>
    <h3 className="text-xl font-black text-[#1a3a32] tracking-tight uppercase">
      {title}
    </h3>
    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
      {subtitle}
    </p>
  </div>
);

const InputGroup = ({
  label,
  placeholder,
  type = "text",
  options = [],
}: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    {type === "text" ? (
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#c2a336]/20 transition-all placeholder:text-slate-300"
      />
    ) : (
      <select className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#c2a336]/20 transition-all cursor-pointer">
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )}
  </div>
);

const ToggleItem = ({ title, desc, defaultChecked }: any) => (
  <div className="flex items-center justify-between p-2">
    <div>
      <h4 className="text-sm font-bold text-[#1a3a32]">{title}</h4>
      <p className="text-xs text-slate-400 font-medium">{desc}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c2a336]"></div>
    </label>
  </div>
);

const CheckboxItem = ({ label, defaultChecked }: any) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="w-4 h-4 rounded border-slate-300 text-[#c2a336] focus:ring-[#c2a336]/20"
    />
    <span className="text-xs font-bold text-slate-500 group-hover:text-[#1a3a32] transition-colors">
      {label}
    </span>
  </label>
);

export default AdminSettings;
