// src/features/ticket/TicketLayout/index.jsx
import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketLayout.module.scss";

const cx = classNames.bind(styles);

function TicketLayout({ children }) {
  return (
    <div className={cx("page")}>
      <div className={cx("card")}>{children}</div>
    </div>
  );
}

// Cho phép dùng <TicketLayout.Footer> như ChatLayout
function Footer({ children }) {
  return <div className={cx("footer")}>{children}</div>;
}

TicketLayout.Footer = Footer;


export default TicketLayout;
