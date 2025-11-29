import React from "react";
import { ChatUnreadContext } from "../../../contexts/ChatUnReadContext";
import { getChatSocket } from "../socket";
import { fetchUnreadCount } from "../api";

const ChatUnreadSocketBridge = () => {
  const { setTotal } = React.useContext(ChatUnreadContext);

  React.useEffect(() => {
    const socket = getChatSocket();

    const handleNewMessage = async (payload) => {
      // payload chứa message mới, nhưng để đơn giản ta chỉ
      // gọi lại API unread-count, backend quyết định logic
      try {
        const total = await fetchUnreadCount();
        setTotal(total);
      } catch (error) {
        console.error("Failed to refresh unread count", error);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [setTotal]);

  // Không render gì
  return null;
};

export default ChatUnreadSocketBridge;
