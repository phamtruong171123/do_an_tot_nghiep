import React from "react";
import { NavLink } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./Sidebar.module.scss";
const cx = classNames.bind(styles);

export default function Sidebar({ brand = "SaaS Kit", items = [] }) {
  return (
    <aside className={cx("sidebar")}>
      <div className={cx("brand")}>{brand}</div>

      <nav className={cx("nav")}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => cx("navItem", { active: isActive })}
          >
             {it.iconClass ? (
              <i className={`${cx("icon")} ${it.iconClass}`} aria-hidden="true" />
            ) : (
              <span className={cx("icon")}>{it.icon || "•"}</span>
            )}
            <span className={cx("label")}>{it.label}</span>
          </NavLink>
        ))}
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
