import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns the socket instance.
 * If not connected, it initializes the connection.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_BASE_URL, {
      autoConnect: false, // we manually connect
      transports: ["websocket"],
    });
    socket.connect();
  }
  return socket;
};

/**
 * Disconnects the socket (optional, e.g., on logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
