import { Server } from "socket.io";

let io: Server | null = null;

export function initChatSocket(server: any) {
  io = new Server(server, { path: "/ws/chat", cors: { origin: "*" } });
  io.on("connection", (socket) => {
    socket.on("join", (conversationId: string) => socket.join(`conv:${conversationId}`));
    socket.on("leave", (conversationId: string) => socket.leave(`conv:${conversationId}`));
  });
}

export function broadcastMessage(conversationId: string, message: any) {
  if (!io) return;
  io.to(`conv:${conversationId}`).emit("message:new", { conversationId, message });
}
