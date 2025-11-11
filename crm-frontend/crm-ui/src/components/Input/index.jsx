import classNames from "classnames/bind";
import styles from "./Input.module.scss";
const cx = classNames.bind(styles);

export default function Input({ label, className, ...rest }) {
  return (
    <label className={cx("field", className)}>
      {label && <span className={cx("label")}>{label}</span>}
      <input className={cx("input")} {...rest} />
    </label>
  );
}
