
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

let socket = null;

export function getChatSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/ws/chat",
    
    });

    socket.on("connect", () => {
      console.log("[chat socket] connected", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[chat socket] disconnected", reason);
    });
  }
  return socket;
}
