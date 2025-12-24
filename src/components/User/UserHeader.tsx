import { useEffect, useRef, useState } from "react";
import { Bell, UserCircle, Inbox, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { RootState } from "../../store/store";
import {
  fetchMyNotifications,
  markNotificationAsRead,
  selectNotifications,
  selectUnreadCount,
  addNotification,
} from "../../store/slices/notificationsSlice";
import type { Notification } from "../../store/slices/notificationsSlice";
import { getSocket } from "../../utils/socket"; // Ensure this is the updated singleton
import { formatDistanceToNow } from "date-fns";

const UserHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMyNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    // Use built-in room logic if your backend supports it, or manual join
    socket.emit("join", user._id);

    socket.on("newNotification", (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user?._id, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full bg-white px-6 py-4 shadow-sm border-b border-slate-100 mb-6">
      <div>
        <h1 className="text-lg font-black text-[#1a3a32] uppercase tracking-tight">
          Welcome back,{" "}
          <span className="text-[#c2a336]">
            {user?.name?.split(" ")[0] || "Officer"}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`relative p-2.5 rounded-xl transition-all duration-300 ${
              dropdownOpen
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

          {dropdownOpen && (
            <div className="absolute right-0 mt-4 w-[350px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-[#1a3a32] text-[10px] uppercase tracking-widest">
                  Your Inbox
                </h3>
                <span className="text-[9px] text-[#c2a336] font-bold uppercase">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <Inbox size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase">
                      Clear Skies
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() =>
                        !notif.read &&
                        dispatch(markNotificationAsRead(notif._id))
                      }
                      className={`p-4 border-b border-slate-50 transition cursor-pointer flex gap-3 ${
                        notif.read
                          ? "bg-white opacity-60"
                          : "bg-[#f4f7f6] border-l-4 border-l-[#c2a336]"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p
                            className={`text-xs ${
                              notif.read ? "font-semibold" : "font-black"
                            } text-[#1a3a32] uppercase`}
                          >
                            {notif.title}
                          </p>
                          <Clock size={10} className="text-slate-300" />
                        </div>
                        <p className="text-[11px] text-slate-600 mb-2">
                          {notif.message}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-[#1a3a32] uppercase tracking-wider group-hover:text-[#c2a336] transition-colors">
              {user?.name || "Guest"}
            </p>
            <p className="text-[9px] text-[#c2a336] font-bold uppercase tracking-widest">
              {user?.role || "User Account"}
            </p>
          </div>

          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover shadow-md border-2 border-slate-50 group-hover:scale-105 transition-all"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.name}&background=1a3a32&color=c2a336`;
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-[#1a3a32] rounded-xl flex items-center justify-center text-[#c2a336] shadow-lg group-hover:scale-105 transition-transform">
                <UserCircle size={24} />
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
