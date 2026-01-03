import React from "react";
import ChatLayout from "./ChatLayout";
import styles from "./ChatLayout/ChatLayout.module.scss";
import ThreadList from "./ThreadList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import EmptyState from "./EmptyState";

import { ChatUnreadContext } from "../../contexts/ChatUnReadContext";
import { HeaderSearchContext } from "../../contexts/HeaderSearchContext";
import {
  fetchThreads,
  fetchMessages,
  sendMessage,
  markConversationRead,
  normalizeMessage,
} from "./api";
import { getChatSocket } from "./socket";
import { fetchConversationCustomer } from "./api";

export default function Chat() {
  const { text: searchText } = React.useContext(HeaderSearchContext);
  const { setTotal } = React.useContext(ChatUnreadContext);
  const [threads, setThreads] = React.useState([]);
  const [activeThreadId, setActiveThreadId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [headerLastActivityAt, setHeaderLastActivityAt] = React.useState(null);

  const [loadingThreads, setLoadingThreads] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);

  const [error, setError] = React.useState(null);
  const [metaByThreadId, setMetaByThreadId] = React.useState({});

  React.useEffect(() => {
    setHeaderLastActivityAt(null);
  }, [activeThreadId]);

  const upsertMeta = React.useCallback((conversationId, customer) => {
    if (!conversationId || !customer) return;
    setMetaByThreadId((prev) => ({
      ...prev,
      [conversationId]: {
        ...(prev[conversationId] || {}),
        customerId: customer.id,
        segment: customer.segment,
        customerName: customer.name,
      },
    }));
  }, []);

  async function prefetchMeta(threads) {
    const ids = threads.map((t) => t.id);
    for (let i = 0; i < ids.length; i += 5) {
      const chunk = ids.slice(i, i + 5);
      const results = await Promise.all(
        chunk.map(async (id) => {
          try {
            const { customer } = await fetchConversationCustomer(id);
            return { id, customer };
          } catch {
            return null;
          }
        })
      );
      results.filter(Boolean).forEach((r) => upsertMeta(r.id, r.customer));
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      setLoadingThreads(true);

      try {
        const data = await fetchThreads();
        if (cancelled) return;
        setThreads(data);
        prefetchMeta(data);
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

  // mỗi lần threads thay đổi thì cập nhật tổng unread
  React.useEffect(() => {
    const total = threads.reduce((sum, t) => sum + (t.unread > 0 ? 1 : 0), 0);

    setTotal(total);
  }, [threads, setTotal]);

  // ====== chọn thread: đồng thời reset unread ======
  const handleSelectThread = async (id) => {
    setActiveThreadId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    try {
      await markConversationRead(id);
    } catch (error) {}
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

    const handleNewMessage = ({ conversationId, message, customerLastActivityAt }) => {
      if (conversationId === activeThreadId && customerLastActivityAt) {
        setHeaderLastActivityAt(customerLastActivityAt);
      }
      const m = normalizeMessage(message);

      // 1) Cập nhật ThreadList
      setThreads((prev) => {
        let list = [...prev];
        const idx = list.findIndex((t) => t.id === conversationId);

        if (idx >= 0) {
          const old = list[idx];
          const updated = {
            ...old,
            lastMessageSnippet: m.text || old.lastMessageSnippet,
            updatedAt: m.sentAt || old.updatedAt,
            lastMessageSentBy: m.sentBy || old.lastMessageSentBy,
            unread: conversationId === activeThreadId ? old.unread || 0 : (old.unread || 0) + 1,
          };

          list.splice(idx, 1);
          list.unshift(updated);
        } else {
          // conversation mới
          const newThread = {
            id: conversationId,
            title: "Khách hàng Facebook",
            iconUrl: null,
            participants: [],
            lastMessageSnippet: m.text,
            updatedAt: m.sentAt,
            lastMessageSentBy: m.sentBy,
            unread: conversationId === activeThreadId ? 0 : 1,
          };
          list = [newThread, ...list];
        }

        return list;
      });

      // 2) Nếu đang mở → append message vào MessageList
      if (conversationId !== activeThreadId) return;

      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, m];
      });
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [activeThreadId]);

  // ====== Gửi message (HTTP) ======
  const handleSend = async (text) => {
    if (!activeThreadId) return;
    try {
      const msg = await sendMessage(activeThreadId, text);

      // append message ngay
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

      // cập nhật ThreadList (last message + đưa lên đầu, unread = 0 vì mình đang mở)
      setThreads((prev) => {
        let list = [...prev];
        const idx = list.findIndex((t) => t.id === activeThreadId);
        if (idx >= 0) {
          const old = list[idx];
          const updated = {
            ...old,
            lastMessageSnippet: msg.text || old.lastMessageSnippet,
            lastMessageSentBy: msg.sentBy || old.lastMessageSentBy,
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
    <div className={styles.chatPageRoot}>
      <ChatLayout
        sidebar={
          loadingThreads ? (
            <div style={{ padding: 16 }}>Đang tải hội thoại…</div>
          ) : (
            <ThreadList
              items={filteredThreads}
              activeId={activeThreadId}
              onSelect={handleSelectThread}
              metaById={metaByThreadId}
            />
          )
        }
        content={
          activeThread ? (
            <>
              <ChatHeader thread={activeThread} injectedLastActivityAt={headerLastActivityAt} />
              {loadingMessages ? (
                <div style={{ padding: 16 }}>Đang tải tin nhắn…</div>
              ) : (
                <MessageList items={messages} />
              )}
              <Composer onSend={handleSend} />
            </>
          ) : (
            <EmptyState title="Select a conversation" subtitle="Choose a chat to start messaging" />
          )
        }
      />
    </div>
  );
}
