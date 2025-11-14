import React from "react";
import { NavLink } from "react-router-dom";
import classNames from "classnames/bind";
import { ChatUnreadContext } from "../../contexts/ChatUnReadContext"; 
import styles from "./Sidebar.module.scss";

const cx = classNames.bind(styles);

export default function Sidebar({ brand = "SaaS Kit", items = [] }) {
  const { total } = React.useContext(ChatUnreadContext);

  return (
    <aside className={cx("sidebar")}>
      <div className={cx("brand")}>{brand}</div>

      <nav className={cx("nav")}>
        {items.map((it) => {
          const isChat =
            it.to.startsWith("/app/agent/chat") ||
            it.to.startsWith("/app/admin/chat") ||
            it.label === "Chat";

          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => cx("navItem", { active: isActive })}
            >
              {it.iconClass ? (
                <i
                  className={`${cx("icon")} ${it.iconClass}`}
                  aria-hidden="true"
                />
              ) : (
                <span className={cx("icon")}>{it.icon || "•"}</span>
              )}

              <span className={cx("label")}>{it.label}</span>

              {isChat && total > 0 && (
                <span className={cx("badge")}>{total}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={cx("bottom")}>
        <NavLink
          to="settings"
          className={({ isActive }) => cx("navItem", { active: isActive })}
        >
          <i className={`${cx("icon")} fa-solid fa-gear`} aria-hidden="true" />
          <span className={cx("label")}>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
