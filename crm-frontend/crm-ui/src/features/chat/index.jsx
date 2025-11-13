
import React from "react";
import ChatLayout from "./ChatLayout";

import ThreadList from "./ThreadList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import EmptyState from "./EmptyState";

import { fetchThreads, fetchMessages, sendMessage } from "./api"; 
import { getChatSocket } from "./socket";

export default function Chat() {
  const [threads, setThreads] = React.useState([]);
  const [activeThreadId, setActiveThreadId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);

  const [loadingThreads, setLoadingThreads] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);

  const [error, setError] = React.useState(null);

  // ====== FETCH backend  ======
  React.useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      setLoadingThreads(true);
      try {
        const data = await fetchThreads();
        if (cancelled) return;
        setThreads(data);
        if (!activeThreadId && data.length > 0) {
          setActiveThreadId(data[0].id);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Không tải được hội thoại");
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    loadThreads();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await fetchMessages(activeThreadId);
        if (!cancelled) setMessages(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Không tải được tin nhắn");
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // ====== SOCKET: join/leave phòng theo conversation ======
  React.useEffect(() => {
    const socket = getChatSocket();
    if (!activeThreadId) return;

    // join room
    socket.emit("join", activeThreadId);

    // cleanup khi rời conversation / unmount
    return () => {
      socket.emit("leave", activeThreadId);
    };
  }, [activeThreadId]);

  // ====== SOCKET: lắng message:new và cập nhật UI ======
  React.useEffect(() => {
    const socket = getChatSocket();

    const handleNewMessage = ({ conversationId, message }) => {
      // Cập nhật ThreadList: lastMessageSnippet, updatedAt, unread
      setThreads((prev) =>
        prev.map((t) =>
          t.id === conversationId
            ? {
                ...t,
                lastMessageSnippet: message.text || t.lastMessageSnippet,
                updatedAt: message.createdAt || t.updatedAt,
                // nếu đang mở thì không tăng unread, nếu đang ở thread khác thì +1
                unread:
                  conversationId === activeThreadId
                    ? t.unread
                    : (t.unread || 0) + 1,
              }
            : t
        )
      );

      // Nếu không xem conversation đó thì thôi
      if (conversationId !== activeThreadId) return;

      // Chuẩn hóa message sang shape UI cần
      const dir = String(message.direction || "").toUpperCase();
      const newMsg = {
        id: message.id,
        text: message.text || "",
        html: null,
        attachments: [],
        sentAt: message.createdAt,
        status: message.status || "",
        isMine: dir === "OUT",
      };

      setMessages((prev) => {
        // tránh trùng 
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [activeThreadId]);

  // ====== Gửi message (HTTP) ======
  const handleSend = async (text) => {
    if (!activeThreadId) return;
    try {
      const msg = await sendMessage(activeThreadId, text);
      // append ngay 
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (e) {
      console.error(e);
      alert("Gửi tin nhắn thất bại");
    }
  };

  return (
    <ChatLayout
      sidebar={
        loadingThreads ? (
          <div style={{ padding: 16 }}>Đang tải hội thoại…</div>
        ) : (
          <ThreadList
            items={threads}
            activeId={activeThreadId}
            onSelect={setActiveThreadId}
          />
        )
      }
      content={
        activeThread ? (
          <>
            <ChatHeader thread={activeThread} />
            {loadingMessages ? (
              <div style={{ padding: 16 }}>Đang tải tin nhắn…</div>
            ) : (
              <MessageList items={messages} />
            )}
            <Composer onSend={handleSend} />
          </>
        ) : (
          <EmptyState
            title="Select a conversation"
            subtitle="Choose a chat to start messaging"
          />
        )
      }
    />
  );
}
