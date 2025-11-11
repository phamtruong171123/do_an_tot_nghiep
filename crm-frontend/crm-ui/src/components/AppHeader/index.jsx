import React from "react";
import classNames from "classnames/bind";
import styles from "./AppHeader.module.scss";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
const cx = classNames.bind(styles);

export default function AppHeader({ title = "", user , onChangePassword, onLogout}) {
    const Menu = (
    <div className={cx("menu")}>
      <button className={cx("menuItem")} onClick={onChangePassword}>
        <i className={`fa-solid fa-key ${cx("menuIcon")}`} aria-hidden="true"></i>
        <span>Đổi mật khẩu</span>
      </button>
      <button className={cx("menuItem", "danger")} onClick={onLogout}>
        <i className={`fa-solid fa-right-from-bracket ${cx("menuIcon")}`} aria-hidden="true"></i>
        <span>Đăng xuất</span>
      </button>
    </div>
  );
  return (
    <header className={cx("header")}>
      <div className={cx("left")}>
       
        <div className={cx("searchWrap")}>
  <i className={`fa-solid fa-magnifying-glass ${cx("searchIcon")}`} aria-hidden="true"></i>
  <input
    className={cx("search")}
    type="text"
    placeholder="Global search"
  />
</div>

      </div>
      <div className={cx("center")}>{title}</div>
      <div className={cx("right")}>
        <button className={cx("iconBtn")} title="Notifications">
            <i className="fa-solid fa-bell" aria-hidden="true"></i>
        </button>
        <div className={cx("user")}>
          <Tippy content={Menu} interactive  placement="bottom-end" theme="light">
          <div className={cx("user")} role="button" tabIndex={0}>
            <div className={cx("avatar")}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className={cx("meta")}>
              <div className={cx("name")}>{user?.username || "User"}</div>
              <div className={cx("role")}>{user?.role || "Agent"}</div>
            </div>
           
          </div>
        </Tippy>
          
        </div>
      </div>
    </header>
  );
}
