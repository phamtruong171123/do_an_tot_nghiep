import React from "react";
import styles from "./styles.module.scss";
import { fetchDeals, createDeal } from "../api";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function DealPage() {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 20;

  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  React.useEffect(() => {
    loadData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData({ page: nextPage = 1 } = {}) {
    setLoading(true);
    try {
      const offset = (nextPage - 1) * PAGE_SIZE;
      const { items, total } = await fetchDeals({
        limit: PAGE_SIZE,
        offset,
      });
      setItems(items);
      setTotal(total);
      setPage(nextPage);
    } catch (e) {
      console.error("Failed to load deals", e);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Deals</h1>
          <div className={styles.subtitle}>Total: {total} deals</div>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => setShowCreate(true)}
        >
          + Add New Deal
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>No deals found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Deal</th>
                <th>Customer</th>
                <th>Appointment</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr
                  key={d.id}
                  className={styles.row}
                  onClick={() =>
                    window.open(`/app/admin/deals/${d.id}`, "_self")
                  }
                >
                  <td className={styles.cellTitle}>{d.title}</td>
                  <td>{d.customerName || "-"}</td>
                  <td>{formatDate(d.appointmentAt)}</td>
                  <td className={styles.cellAmount}>
                    {d.amount != null
                      ? d.amount.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`${styles.pill} ${
                        styles["pill_" + d.stage.toLowerCase()]
                      }`}
                    >
                      {d.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.textBtn}
              disabled={page <= 1}
              onClick={() => loadData({ page: page - 1 })}
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              className={styles.textBtn}
              disabled={page >= totalPages}
              onClick={() => loadData({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <DealCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData({ page: 1 });
          }}
        />
      )}
    </div>
  );
}

function DealCreateModal({ onClose, onCreated }) {
  const [customerId, setCustomerId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [appointmentAt, setAppointmentAt] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerId || !title) return;

    setSaving(true);
    try {
      await createDeal({
        customerId: Number(customerId),
        title,
        amount: amount ? Number(amount) : undefined,
        appointmentAt,
      });
      onCreated();
    } catch (err) {
      console.error("Failed to create deal", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Deal</h2>
          <button className={styles.iconBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Customer ID</span>
            <input
              type="number"
              className={styles.input}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Amount</span>
            <input
              type="number"
              className={styles.input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Appointment</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
            />
          </label>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.textBtn}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
