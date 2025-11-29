import React from "react";
import { ChatUnreadContext } from "../../../contexts/ChatUnReadContext";
import { fetchUnreadCount } from "../api";

export default function ChatUnreadInitializer() {
  const { setTotal } = React.useContext(ChatUnreadContext);

  React.useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      try {
        const total = await fetchUnreadCount();
        if (!cancelled) {
          setTotal(total);
        }
      } catch (error) {
        console.error("Failed to load unread count", error);
      }
    }

    loadUnread();

    return () => {
      cancelled = true;
    };
  }, [setTotal]);

  // Không render gì ra UI
  return null;
}
