import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  UserCircle,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  fetchAllNotifications,
  selectNotifications,
  selectUnreadCount,
} from "../../store/slices/notificationsSlice";
import { formatDistanceToNow, format } from "date-fns";
import SuperAdminCalenderModal  from "./SuperAdminCalendarModal"

const SuperAdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Data Selectors
  const user = useAppSelector((state) => state.auth.user);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  // UI State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAllNotifications());
  }, [dispatch]);

  // Handle outside clicks for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderRecipientName = (recipient: any) => {
    if (!recipient) return "Broadcast";
    if (typeof recipient === "object") return recipient.name || recipient.email || "Unknown User";
    return recipient;
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full bg-white/80 backdrop-blur-md px-8 py-4 border-b border-gray-100 shadow-sm">
      
      {/* --- LEFT: Status & Calendar Trigger --- */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#1a3a32]/5 rounded-full border border-[#1a3a32]/10">
          <ShieldCheck size={14} className="text-[#c2a336]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1a3a32]">System Oversight</span>
        </div>

        {/* Calendar Trigger */}
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="group flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 hover:border-[#c2a336]/40 hover:bg-white transition-all active:scale-95 shadow-sm"
        >
          <CalendarIcon size={14} className="text-[#c2a336] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {format(new Date(), "MMM d, yyyy")}
          </span>
        </button>
      </div>

      {/* --- CENTER: Global Search --- */}
      <div className="hidden lg:flex items-center relative w-96">
        <Search className="absolute left-3 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#c2a336]/20 transition-all"
        />
      </div>

      {/* --- RIGHT: Notifications & Profile --- */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#1a3a32] transition-all group"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#c2a336] text-[10px] font-bold text-[#1a3a32] border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-[#1a3a32] p-4">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest">Global Dispatch Logs</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">No history available</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="p-4 border-b border-slate-50 flex gap-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                            <User size={10} className="text-slate-500" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">To: {renderRecipientName(n.user)}</span>
                          </div>
                          <CheckCircle2 size={14} className={n.read ? "text-emerald-500" : "text-slate-300"} />
                        </div>
                        <p className="text-[11px] font-bold text-[#1a3a32] leading-tight">{n.title}</p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                          <Clock size={10} /> {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-[#1a3a32] uppercase leading-none">{user?.name || "Admin"}</p>
            <p className="text-[9px] font-bold text-[#c2a336] uppercase mt-1">Super Admin</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-[#1a3a32] text-[#c2a336] flex items-center justify-center shadow-lg shadow-[#1a3a32]/20">
            <UserCircle size={24} />
          </button>
        </div>
      </div>

      {/* --- INTEGRATED CALENDAR MODAL --- */}
      <SuperAdminCalenderModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
      
    </header>
  );
};

export default SuperAdminHeader;