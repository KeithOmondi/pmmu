import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  selectAllNotifications,
  selectUnreadCount,
  addNotification,
  markNotificationAsRead,
} from "../../store/slices/notificationsSlice";
import { getSocket } from "../../utils/socket";

const AdminHeader = () => {
  const dispatch = useAppDispatch();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = useAppSelector(selectAllNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all notifications on mount
  useEffect(() => {
    // replace with your thunk for fetching notifications
    // e.g., dispatch(fetchAllNotifications());
  }, [dispatch]);

  // Connect socket and listen for new notifications
  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => console.log("Socket connected:", socket.id));

    socket.on("newNotification", (notif: any) => {
      dispatch(addNotification(notif));
    });

    socket.on("indicator:event", (notif: any) => {
      dispatch(addNotification(notif));
    });

    return () => {
      socket.off("newNotification");
      socket.off("indicator:event");
    };
  }, [dispatch]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notification as read when clicked
  const handleNotificationClick = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search bar */}
      <div className="hidden md:flex items-center relative w-96">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search records, files, or users..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c2a336]/20 focus:border-[#c2a336] transition-all"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4 ml-auto relative">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative p-2.5 text-slate-500 hover:bg-slate-50 hover:text-[#1a3a32] rounded-xl transition-all"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n._id)}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50 ${
                      !n.read ? "bg-slate-100" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.message}</p>
                    {n.submittedBy && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Submitted by: {n.submittedBy.name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-[#1a3a32] uppercase tracking-tight">
              System Admin
            </p>
            <p className="text-[10px] text-[#c2a336] font-bold">
              Registry Dept.
            </p>
          </div>

          <div className="relative">
            <div className="w-10 h-10 bg-[#1a3a32] rounded-xl flex items-center justify-center text-[#c2a336] shadow-md group-hover:scale-105 transition-transform">
              <User size={20} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>

          <ChevronDown
            size={14}
            className="text-slate-400 group-hover:text-[#1a3a32] transition-colors"
          />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
