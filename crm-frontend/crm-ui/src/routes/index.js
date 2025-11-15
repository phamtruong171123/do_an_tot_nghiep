import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import AgentLayout from "../layouts/AgentLayout";
import Placeholder from "../pages/PlaceHolder";
import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import UserManagement from "../pages/UserManagement"; 
import Chat from "../features/chat";
import TicketPage from "../features/ticket";

function getMe() {
  try { return JSON.parse(localStorage.getItem("me") || "null"); }
  catch { return null; }
}


function RequireAuthOutlet() {
  const me = getMe();
  if (!me) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function AppRoutes() {
  const me = getMe();

  return (
    <Routes>
      {/* Trang login */}
      <Route path="/login" element={<Login />} />
      <Route path="/users" element={<UserManagement />} />
      {/* Trang gốc: theo role */}
      <Route
        path="/"
        element={
          me
            ? (me.role === "ADMIN"
                ? <Navigate to="/app/admin/dashboard" replace />
                : <Navigate to="/app/agent/dashboard" replace />)
            : <Navigate to="/login" replace />
        }
      />

      {/* Khu vực cần đăng nhập */}
      <Route element={<RequireAuthOutlet />}>
        {/* Trang đổi mật khẩu dùng chung */}
        <Route path="/app/account/change-password" element={<ChangePassword />} />

        {/* ADMIN */}
        <Route path="/app/admin" element={<AdminLayout me={me} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Placeholder title="Admin Dashboard" />} />
          <Route path="chat"      element={<Chat/>} />
          <Route path="users"     element={<UserManagement />} />
          <Route path="tickets"     element={<TicketPage/>} />
          <Route path="contacts"  element={<Placeholder title="Contacts" />} />
          
        </Route>

        {/* AGENT */}
        <Route path="/app/agent" element={<AgentLayout me={me} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Placeholder title="Agent Dashboard" />} />
          <Route path="chat"      element={<Chat/>} />
          <Route path="tickets"     element={<TicketPage/>} />
          <Route path="contacts"  element={<Placeholder title="Contacts" />} />
          
        </Route>
      </Route>

      {/* Bắt mọi thứ còn lại */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
