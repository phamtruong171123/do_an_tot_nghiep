import React from "react";
import ChatLayout from "./ChatLayout";

import ThreadList from "./ThreadList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import EmptyState from "./EmptyState";

import { ChatUnreadContext } from "../../contexts/ChatUnReadContext";
import  {HeaderSearchContext}  from "../../contexts/HeaderSearchContext";
import { fetchThreads, fetchMessages, sendMessage, markConversationRead } from "./api";
import { getChatSocket } from "./socket";

export default function Chat() {

  const { text: searchText } = React.useContext(HeaderSearchContext); 
  const { setTotal } = React.useContext(ChatUnreadContext);
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

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || null;


  // mỗi lần threads thay đổi thì cập nhật tổng unread
  React.useEffect(() => {
    const total = threads.reduce((sum, t) => sum + (t.unread || 0), 0);
    setTotal(total);
  }, [threads, setTotal]);

  // ====== chọn thread: đồng thời reset unread ======
  const handleSelectThread = async (id) => {
    setActiveThreadId(id);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, unread: 0 } : t

      )
    );
    try {
      await markConversationRead(id);
    } catch (error) {
      
    }
  };

  // ====== SOCKET: join/leave phòng theo conversation ======
  React.useEffect(() => {
    const socket = getChatSocket();
    if (!activeThreadId) return;

    socket.emit("join", activeThreadId);

    return () => {
      socket.emit("leave", activeThreadId);
    };
  }, [activeThreadId]);

  // ====== SOCKET: lắng message:new và cập nhật UI ======
  React.useEffect(() => {
    const socket = getChatSocket();

    const handleNewMessage = ({ conversationId, message }) => {
      const ts = message.createdAt || new Date().toISOString();
      const text = message.text || "";

      // 1) Cập nhật ThreadList: lastMessageSnippet, updatedAt, unread + đưa lên đầu
      setThreads((prev) => {
        let list = [...prev];
        const idx = list.findIndex((t) => t.id === conversationId);

        if (idx >= 0) {
          const old = list[idx];
          const updated = {
            ...old,
            lastMessageSnippet: text || old.lastMessageSnippet,
            updatedAt: ts,
            unread:
              conversationId === activeThreadId
                ? old.unread || 0 // đang mở -> không tăng
                : (old.unread || 0) + 1, // thread khác -> +1
          };
          // đưa thread này lên đầu
          list.splice(idx, 1);
          list.unshift(updated);
        } else {
          // conversation mới hoàn toàn (phòng trường hợp tương lai)
          const title =
            message.senderName ||
            message.customerName ||
            "Khách hàng Facebook";
          const newThread = {
            id: conversationId,
            title,
            iconUrl: message.avatarUrl || null,
            participants: [
              {
                id: message.senderId || "unknown",
                name: title,
                avatarUrl: message.avatarUrl || null,
              },
            ],
            lastMessageSnippet: text,
            updatedAt: ts,
            unread: conversationId === activeThreadId ? 0 : 1,
          };
          list = [newThread, ...list];
        }

        return list;
      });

      // 2) Nếu đang xem conversation đó thì append message
      if (conversationId !== activeThreadId) return;

      const dir = String(message.direction || "").toUpperCase();
      const newMsg = {
        id: message.id,
        text: text,
        html: null,
        attachments: [],
        sentAt: ts,
        status: message.status || "",
        isMine: dir === "OUT",
      };

      setMessages((prev) => {
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

      // append message ngay
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );

      // cập nhật ThreadList (last message + đưa lên đầu, unread = 0 vì mình đang mở)
      setThreads((prev) => {
        let list = [...prev];
        const idx = list.findIndex((t) => t.id === activeThreadId);
        if (idx >= 0) {
          const old = list[idx];
          const updated = {
            ...old,
            lastMessageSnippet: msg.text || old.lastMessageSnippet,
            updatedAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
            unread: 0,
          };
          list.splice(idx, 1);
          list.unshift(updated);
        }
        return list;
      });
    } catch (e) {
      console.error(e);
      alert("Gửi tin nhắn thất bại");
    }
  };

// ====== Lọc threads theo search text từ Header ======
// chỉ lọc lại khi threads hoặc searchText thay đổi
  const filteredThreads = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const name = (t.title || "").toLowerCase();
      const snippet = (t.lastMessageSnippet || "").toLowerCase();
      return name.includes(q) || snippet.includes(q);
    });
  }, [threads, searchText]);


  return (
    <ChatLayout
      sidebar={
        loadingThreads ? (
          <div style={{ padding: 16 }}>Đang tải hội thoại…</div>
        ) : (
          <ThreadList
            items={filteredThreads}
            activeId={activeThreadId}
            onSelect={handleSelectThread}
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
