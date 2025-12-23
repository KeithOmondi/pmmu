import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
      // Using a standard function declaration for the callback
      // to avoid any "unused renaming" or "type annotation" confusion
      auth: (cb: (data: { token: string | null }) => void) => {
        const currentToken = localStorage.getItem("accessToken");
        cb({ token: currentToken });
      },
    });

    socket.on("connect", () => {
      console.log("🚀 Socket connected successfully");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });

    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
