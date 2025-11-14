import { Server } from "socket.io";

let io: Server | null = null;

export function initChatSocket(server: any) {
  io = new Server(server, {
    path: "/ws/chat",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("[chat] socket connected", socket.id);

    socket.on("join", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leave", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });
  });
}

export function broadcastMessage(conversationId: string, message: any) {
  if (!io) return;

  const payload = { conversationId, message };

  //  Gửi cho TẤT CẢ client – để ThreadList & unread cập nhật, kể cả khi không mở thread đó
  io.emit("message:new", payload);

  // Nếu sau này bạn vẫn muốn sử dụng room để optimize streaming message,
  // có thể giữ thêm dòng này (không bắt buộc):
  // io.to(`conv:${conversationId}`).emit("message:new", payload);
}
