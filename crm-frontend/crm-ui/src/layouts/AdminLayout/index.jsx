import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import classNames from "classnames/bind";
import styles from "./AdminLayout.module.scss";
import { useNavigate } from "react-router-dom";
import usePresenceHeartbeat from "../../hooks/usePresenceHeartbeat";
import   { HeaderSearchProvider }  from "../../contexts/HeaderSearchContext";
const cx = classNames.bind(styles);

export default function AdminLayout({me}) {
    usePresenceHeartbeat(100000); // Send heartbeat every 100 seconds
    const navigate = useNavigate();
    const onChangePassword = () => navigate("/app/account/change-password");
    const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("me");
    navigate("/login", { replace: true });
  };
  
  const items = [
    { to: "/app/admin/dashboard", label: "Dashboard", iconClass: "fa-solid fa-gauge" },
    { to: "/app/admin/chat",      label: "Chat",      iconClass: "fa-solid fa-comments" },
    { to: "/app/admin/users",     label: "Users",     iconClass: "fa-solid fa-user-gear" },
    { to: "/app/admin/tasks",     label: "Tasks",     iconClass: "fa-solid fa-list-check" },
    { to: "/app/admin/contacts",  label: "Contacts",  iconClass: "fa-solid fa-address-book" },
    
  ];

  return (
    <HeaderSearchProvider>
      <div className={cx("layout")}>
        <Sidebar items={items} />
        <main className={cx("main")}>
          <AppHeader user={me} onChangePassword={onChangePassword} onLogout={onLogout} />
          <div className={cx("content")}>
            <Outlet />
          </div>
        </main>
      </div>
    </HeaderSearchProvider>
  );
}
