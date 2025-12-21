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
import CustomerPage from "../features/customer/CustomerPage";
import CustomerDetailPage from "../features/customer/CustomerDetailPage";
import FaqPage from "../features/faq/FaqPage";
import DealPage from '../features/deal/DealPage';
import DealDetailPage from '../features/deal/DealDetailPage';
import SettingsPage from "../features/settings";
import GptConfigPage from "../features/gpt-config/GptConfigPage";

function getMe() {
  try { return JSON.parse(localStorage.getItem("me") || "null"); }
  catch { return null; }
}

function getDefaultPath(me) {
  if (!me) return "/login";
  return me.role === "ADMIN"
    ? "/app/admin/dashboard"
    : "/app/agent/chat"; 
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

     

      {/* Trang gốc: theo role */}
      <Route
        path="/"
        element={
          me
            ? (me.role === "ADMIN"
                ? <Navigate to="/app/admin/dashboard" replace />
                : <Navigate to="/app/agent/chat" replace />)
            : <Navigate to="/login" replace />
        }
      />

      {/* Khu vực cần đăng nhập */}
      <Route element={<RequireAuthOutlet />}>
        {/* Trang đổi mật khẩu dùng chung */}
        <Route
          path="/app/account/change-password"
          element={<ChangePassword />}
        />

        {/* ADMIN  */}
        <Route
          path="/app/admin"
          element={
            me && me.role === "ADMIN"
              ? <AdminLayout me={me} />
              : <Navigate to={getDefaultPath(me)} replace />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<Placeholder title="Admin Dashboard" />}
          />
          <Route path="chat"      element={<Chat />} />
          <Route path="tickets"   element={<TicketPage />} />
          <Route path="contacts"  element={<CustomerPage />} />
          <Route path="deals" element={<DealPage />} />
          <Route path="deals/:id" element={<DealDetailPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="settings" element={<SettingsPage me={me} />} />
          <Route path="faq"       element={<FaqPage currentUser={me} />} />
          <Route path="settings/gpt-config" element={<GptConfigPage/>} />
          <Route path="users"     element={<UserManagement />} />
        </Route>

        {/*  AGENT  */}
        <Route
          path="/app/agent"
          element={
            me && me.role !== "ADMIN"  
              ? <AgentLayout me={me} />
              : <Navigate to={getDefaultPath(me)} replace />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<Placeholder title="Agent Dashboard" />}
          />
          <Route path="chat"      element={<Chat />} />
          <Route path="tickets"   element={<TicketPage />} />
          <Route path="contacts"  element={<CustomerPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="deals" element={<DealPage />} />
<Route path="settings" element={<SettingsPage me={me} />} />
          <Route path="/app/agent/settings" element={<SettingsPage />} />
          <Route path="faq" element={<FaqPage currentUser={me} />} />
        </Route>
      </Route>

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
