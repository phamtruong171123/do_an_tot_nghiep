import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import classNames from "classnames/bind";
import styles from "./Toast.module.scss";

const cx = classNames.bind(styles);

const ToastContext = createContext({
  pushToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, type = "success", ttl = 3000) => {
      if (!message) return;
      const id = Date.now() + Math.random();
      setToasts((ts) => [...ts, { id, type, message }]);

      if (ttl > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, ttl);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        className={cx("toasts")}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div key={t.id} className={cx("toast", t.type)}>
            <span className={cx("toastMsg")}>{t.message}</span>
            <button
              type="button"
              className={cx("toastClose")}
              onClick={() => dismissToast(t.id)}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
