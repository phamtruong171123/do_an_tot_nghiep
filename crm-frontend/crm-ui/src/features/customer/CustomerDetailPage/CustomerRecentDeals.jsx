import React from "react";
import styles from "./styles.module.scss";
import { fetchRecentDealsForCustomer } from "../../deal/api";
import { useNavigate } from "react-router-dom";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleDateString();
}

export default function CustomerRecentDeals({ customerId }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const deals = await fetchRecentDealsForCustomer(customerId, 5);
        if (!cancelled) setItems(deals);
      } catch (e) {
        console.error("Failed to load recent deals", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Deals</h3>
      </div>
      <div className={styles.body}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>No deals found.</div>
        ) : (
          <ul className={styles.list}>
            {items.map((d) => (
              <li
                key={d.id}
                className={styles.item}
                onClick={() =>
                  navigate(`/app/admin/deals/${d.id}`)
                }
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemTitle}>{d.title}</span>
                  {d.amount != null && (
                    <span className={styles.itemAmount}>
                      {d.amount.toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
                <div className={styles.itemBottom}>
                  <span
                    className={`${styles.pill} ${
                      styles["pill_" + d.stage.toLowerCase()]
                    }`}
                  >
                    {d.stage}
                  </span>
                  <span className={styles.date}>
                    {formatDate(d.appointmentAt || d.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
