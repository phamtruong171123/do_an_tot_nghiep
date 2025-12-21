import React from "react";
import styles from "./CustomerSearchSelect.module.scss";
import { searchCustomers } from "../../features/customer/api";

export default function CustomerSearchSelect({
  value,              // customerId (number | string | null)
  onChange,           // (customerId, customerObj) => void
  placeholder = "Search customer…",
  limit = 100,
  debounceMs = 300,
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);

  const timerRef = React.useRef(null);
  const containerRef = React.useRef(null);

  // Close dropdown when click outside
  React.useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = query.trim();
    if (!q) {
      setItems([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchCustomers(q, limit);
        // map to options 
        setItems(Array.isArray(res) ? res : []);
        setOpen(true);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, limit, debounceMs]);

  const selected = React.useMemo(() => {
    if (value == null) return null;
    // nếu list hiện tại có, show ngay label; không có thì vẫn show value rỗng
    return items.find((x) => String(x.id) === String(value)) || null;
  }, [value, items]);

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.control} onClick={() => setOpen(true)}>
        <input
          className={styles.input}
          value={open ? query : (selected?.name || query)}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        <div className={styles.right}>
          {loading ? <span className={styles.spinner}>…</span> : <span className={styles.chev}>▾</span>}
        </div>
      </div>

      {open && (
        <div className={styles.dropdown}>
          {query.trim() && items.length === 0 && !loading && (
            <div className={styles.empty}>No results</div>
          )}

          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              className={styles.option}
              onClick={() => {
                onChange && onChange(c.id, c);
                setOpen(false);
                setQuery(c.name || "");
              }}
            >
              <div className={styles.optTitle}>{c.name}</div>
              {!!c.phoneNumber && <div className={styles.optSub}>{c.phoneNumber}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
