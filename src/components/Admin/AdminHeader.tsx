// src/components/Admin/AdminHeader.tsx
import { useEffect, useRef, useState } from "react";
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  markNotificationAsRead,
  selectNotifications,
  selectUnreadCount,
} from "../../store/slices/notificationsSlice";
import type { Notification } from "../../store/slices/notificationsSlice";

const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();

  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     REDUX STATE
  ========================================================= */
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  /* =========================================================
     CLICK OUTSIDE DROPDOWN
  ========================================================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================================================
     MARK AS READ
  ========================================================= */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    setNotifOpen(false);
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* 🔍 Search */}
      <div className="hidden md:flex items-center relative w-96">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search records, users, or indicators..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c2a336]/20"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto relative">
        {/* 🔔 Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 border-b last:border-b-0 cursor-pointer transition ${
                      n.read ? "bg-white hover:bg-slate-50" : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>

                    {/* Show submitter name if available */}
                    {n.submittedBy && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Submitted by: {n.submittedBy.name}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 👤 Profile */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-[#1a3a32] uppercase">Super Admin</p>
            <p className="text-[10px] text-[#c2a336] font-bold">Registry Department</p>
          </div>

          <div className="relative">
            <div className="w-10 h-10 bg-[#1a3a32] rounded-xl flex items-center justify-center text-[#c2a336]">
              <User size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
