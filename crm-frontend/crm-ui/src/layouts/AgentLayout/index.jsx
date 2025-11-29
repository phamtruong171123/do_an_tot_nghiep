import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import classNames from "classnames/bind";
import styles from "./AgentLayout.module.scss";
import { useNavigate } from "react-router-dom";
import ChatUnreadSocketBridge from "../../features/chat/UnreadConversation/ChatUnreadSocketBrige";
import ChatUnreadInitializer from "../../features/chat/UnreadConversation/ChatUnReadInitializer";
import   { HeaderSearchProvider }  from "../../contexts/HeaderSearchContext";
import usePresenceHeartbeat from "../../hooks/usePresenceHeartbeat";
const cx = classNames.bind(styles);

export default function AgentLayout({me}) {
    usePresenceHeartbeat(100000); // Send heartbeat every 100 seconds
    const navigate = useNavigate();
    const onChangePassword = () => navigate("/app/account/change-password");
    const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("me");
    navigate("/login", { replace: true });
  };

 const items = [
    { to: "/app/agent/dashboard", label: "Dashboard", iconClass: "fa-solid fa-gauge" },
    { to: "/app/agent/chat",      label: "Chat",      iconClass: "fa-solid fa-comments" },
    { to: "/app/agent/tickets",     label: "Tickets",     iconClass: "fa-solid fa-list-check" },
    { to: "/app/agent/contacts",  label: "Contacts",  iconClass: "fa-solid fa-address-book" },
    { to: "/app/agent/faq", label: "FAQ", iconClass: "fa-regular fa-circle-question" },

  ];

  return (
    <HeaderSearchProvider>
      <ChatUnreadInitializer />
      {/* Lắng socket để cập nhật realtime */}
      <ChatUnreadSocketBridge />
      <div className={cx("layout")}>
        <div className={cx("sidebar-wrap")}><Sidebar items={items} /></div>
        <main className={cx("main")}>
          <div className={cx("header-wrap")}><AppHeader user={me} onChangePassword={onChangePassword} onLogout={onLogout} /></div>
          <div className={cx("content")}>
            <Outlet />
          </div>
        </main>
      </div>
    </HeaderSearchProvider>
  );
}
