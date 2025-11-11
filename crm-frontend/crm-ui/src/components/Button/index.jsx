import classNames from "classnames/bind";
import styles from "./Button.module.scss";
const cx = classNames.bind(styles);

export default function Button({ children, loading, disabled, className, ...rest }) {
  return (
    <button
      className={cx("btn", className, { loading })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
