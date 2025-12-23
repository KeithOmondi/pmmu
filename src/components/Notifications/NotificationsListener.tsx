// src/components/Notifications/NotificationsListener.tsx
import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { addNotification } from "../../store/slices/notificationsSlice"; // create a slice to store notifications
import { getSocket } from "../../utils/socket";

const NotificationsListener = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = getSocket();

    socket.on("newNotification", (notif) => {
      // 1️⃣ Update Redux store
      dispatch(addNotification(notif));

      // 2️⃣ Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notif.title, {
          body: notif.message,
        });
      }

      // 3️⃣ Vibrate device (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      // 4️⃣ Optional: play a sound
      const audio = new Audio("/notification.mp3"); // add your mp3 in public folder
      audio.play().catch(() => {});
    });

    return () => {
      socket.off("newNotification");
    };
  }, [dispatch]);

  return null;
};

export default NotificationsListener;
