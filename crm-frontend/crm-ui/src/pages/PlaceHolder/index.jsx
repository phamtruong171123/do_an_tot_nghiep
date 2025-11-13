import React from "react";
import classNames from "classnames/bind";
import styles from "./Placeholder.module.scss";
const cx = classNames.bind(styles);

export default function Placeholder({children}) {
  return <div className={cx("wrap")}>{children}</div>;
}
