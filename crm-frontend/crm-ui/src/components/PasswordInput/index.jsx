import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./PasswordInput.module.scss";
const cx = classNames.bind(styles);

export default function PasswordInput({ label, className, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <label className={cx("field", className)}>
      {label && <span className={cx("label")}>{label}</span>}
      <div className={cx("box")}>
        <input className={cx("input")} type={show ? "text" : "password"} {...rest} />
        <button type="button" className={cx("toggle")} onClick={() => setShow(s => !s)}>
          {show ? "🙈 Hide" : "👁️ Hide"}
        </button>
      </div>
    </label>
  );
}
