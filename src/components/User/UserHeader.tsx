import React, { useEffect, useState, useRef } from "react";
import { Bell, UserCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import {
  fetchMyNotifications,
  markNotificationAsRead,
  selectAllNotifications,
  selectUnreadCount,
  addNotification,
} from "../../store/slices/notificationsSlice";
import { getSocket } from "../../utils/socket";

const UserHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const notifications = useAppSelector(selectAllNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMyNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    socket.emit("join", user._id);

    // Listen for the specific event emitted by the frontend
    socket.on("notification:new", (newNotif) => {
      dispatch(addNotification(newNotif));
    });

    // Listen for the general event usually emitted by backends
    socket.on("notification", (newNotif) => {
      dispatch(addNotification(newNotif));
    });

    return () => {
      socket.off("notification:new");
      socket.off("notification");
    };
  }, [dispatch, user?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full bg-white p-4 shadow-md rounded-xl mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-800">
          Welcome,{" "}
          <span className="text-[#c2a336]">{user?.name || "Guest"}</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <div className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-all"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 max-h-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto z-50 custom-scrollbar">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Notifications
                </h3>
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-gray-500 text-xs italic text-center">
                  No notifications
                </div>
              ) : (
                [...notifications].reverse().map((notif) => (
                  <button
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif._id)}
                    className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-all flex flex-col gap-1 ${
                      notif.read
                        ? "opacity-50"
                        : "bg-white border-l-4 border-l-[#c2a336]"
                    }`}
                  >
                    <span className="font-bold text-xs text-gray-800 uppercase leading-tight">
                      {notif.title}
                    </span>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      {notif.message}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 font-bold uppercase">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 p-1.5 pr-4 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserCircle size={26} className="text-gray-400" />
          )}
          <span className="hidden sm:inline text-xs font-black text-gray-700 uppercase tracking-widest">
            {user?.name || "Guest"}
          </span>
        </button>
      </div>
    </header>
  );
};

export default UserHeader;
