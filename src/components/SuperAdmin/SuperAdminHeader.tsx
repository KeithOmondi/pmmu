import React from "react";
import { Bell, UserCircle, Search, ShieldCheck } from "lucide-react";
import { useAppSelector } from "../../store/hooks"; // adjust path to your hooks

const SuperAdminHeader: React.FC = () => {
  // Assuming you have access to the user state
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full bg-white/80 backdrop-blur-md px-8 py-4 border-b border-gray-100 shadow-sm">
      {/* Left Section: Context Title */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#1a3a32]/5 rounded-full border border-[#1a3a32]/10">
          <ShieldCheck size={14} className="text-[#c2a336]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1a3a32]">
            System Oversight
          </span>
        </div>
      </div>

      {/* Center Section: Search Bar (Optional Visual Element) */}
      <div className="hidden lg:flex items-center relative w-96">
        <Search className="absolute left-3 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Global system search..."
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#c2a336]/20 focus:bg-white transition-all"
        />
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#1a3a32] transition-all group">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:animate-ping"></span>
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-[#1a3a32] uppercase tracking-tighter leading-none">
              {user?.name || "System Master"}
            </p>
            <p className="text-[9px] font-bold text-[#c2a336] uppercase tracking-widest mt-1">
              Super Admin
            </p>
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1a3a32] text-[#c2a336] shadow-lg shadow-[#1a3a32]/20 hover:scale-105 active:scale-95 transition-all">
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
