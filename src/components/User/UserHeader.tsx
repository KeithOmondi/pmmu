import { useEffect, useRef, useState } from "react";
import { Bell, UserCircle } from "lucide-react";
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
import { getSocket } from "../../utils/socket";

const UserHeader: React.FC = () => {
  const dispatch = useAppDispatch();

  /* =========================================================
     REDUX STATE
  ========================================================= */
  const user = useAppSelector((state: RootState) => state.auth.user);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     INITIAL FETCH (USER INBOX)
  ========================================================= */
  useEffect(() => {
    dispatch(fetchMyNotifications());
  }, [dispatch]);

  /* =========================================================
     SOCKET.IO – USER ROOM
  ========================================================= */
  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    // Join personal room
    socket.emit("join", user._id);

    // Unified event (recommended)
    socket.on("newNotification", (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    return () => {
      socket.off("newNotification");
    };
  }, [dispatch, user?._id]);

  /* =========================================================
     CLICK OUTSIDE DROPDOWN
  ========================================================= */
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================================================
     MARK AS READ
  ========================================================= */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    setDropdownOpen(false);
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full bg-white p-4 shadow-md rounded-xl mb-6">
      {/* Welcome */}
      <h1 className="text-lg font-bold text-gray-800">
        Welcome,{" "}
        <span className="text-[#c2a336]">
          {user?.name || "Guest"}
        </span>
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {/* 🔔 Notifications */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 max-h-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto z-50">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Notifications
                </h3>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-gray-500 text-xs italic text-center">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-4 border-b last:border-b-0 transition flex flex-col gap-1 ${
                      notif.read
                        ? "bg-white opacity-60 hover:bg-gray-50"
                        : "bg-gray-50 border-l-4 border-l-[#c2a336] hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-bold text-xs text-gray-800 uppercase">
                      {notif.title}
                    </span>

                    <span className="text-xs text-gray-600 leading-relaxed">
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

        {/* 👤 Profile */}
        <button className="flex items-center gap-2 p-1.5 pr-4 rounded-full hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
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
