import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Search,
  User,
  ChevronDown,
  Inbox,
  CheckCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchMyNotifications,
  markNotificationAsRead,
  addNotification,
  selectNotifications,
  selectUnreadCount,
  type Notification,
} from "../../store/slices/notificationsSlice";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "../../utils/socket";

const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redux State
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  /* =========================================================
      INITIAL FETCH & REAL-TIME SOCKET LISTENER
  ========================================================= */
  useEffect(() => {
    // 1. Fetch existing notifications from DB on mount
    dispatch(fetchMyNotifications());

    // 2. Setup Socket listener for incoming alerts (Evidence submissions, etc.)
    const socket = getSocket();

    // The backend should emit "notification" whenever an indicator is submitted
    socket.on("notification", (newNotif: Notification) => {
      dispatch(addNotification(newNotif));
    });

    return () => {
      socket.off("notification");
    };
  }, [dispatch]);

  /* =========================================================
      CLICK OUTSIDE LOGIC
  ========================================================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    // Logic to navigate to the specific indicator could be added here
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* 🔍 Strategic Search */}
      <div className="hidden md:flex items-center relative w-96">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search records or indicators..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c2a336]/20 transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-auto relative">
        {/* 🔔 Notifications Engine */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={`relative p-2.5 rounded-xl transition-all duration-300 ${
              notifOpen
                ? "bg-[#f4f0e6] text-[#c2a336]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border-2 border-white"></span>
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-4 w-[400px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-black text-[#1a3a32] text-[11px] uppercase tracking-[0.2em]">
                    Intelligence Feed
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {unreadCount} unread alerts
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button className="text-[10px] font-black text-[#c2a336] uppercase hover:underline flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <Inbox size={40} className="mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      No new updates
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b border-slate-50 last:border-b-0 cursor-pointer transition-all flex gap-4 ${
                        n.read
                          ? "bg-white opacity-60 hover:opacity-100"
                          : "bg-[#f4f7f6] hover:bg-[#ebefee]"
                      }`}
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          n.read ? "bg-slate-200" : "bg-[#c2a336]"
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p
                            className={`text-sm leading-none ${
                              n.read ? "font-semibold" : "font-black"
                            } text-[#1a3a32]`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {n.message}
                        </p>

                        {/* Evidence Submission Tag */}
                        {n.title === "Task Submitted" && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-tighter">
                            New Evidence
                          </span>
                        )}

                        {n.submittedBy && (
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-[#c2a336]">
                            <User size={10} />
                            <span>
                              SOURCE: {n.submittedBy.name.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <button className="p-4 text-center text-[10px] font-black uppercase tracking-[0.25em] text-[#1a3a32] bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-200">
                View All Intelligence
              </button>
            </div>
          )}
        </div>

        {/* 👤 Professional Profile */}
        <div className="flex items-center gap-4 pl-4 border-l border-slate-100 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-[#1a3a32] uppercase tracking-wider group-hover:text-[#c2a336] transition-colors">
              Strategic Admin
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              General Registry
            </p>
          </div>

          <div className="relative">
            <div className="w-11 h-11 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-[#c2a336] shadow-lg shadow-[#1a3a32]/20 group-hover:scale-105 transition-transform">
              <User size={22} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
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
