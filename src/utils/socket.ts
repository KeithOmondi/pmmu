import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("accessToken"); // your JWT
    socket = io(import.meta.env.VITE_API_BASE_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token, // send token for backend verification
      },
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
