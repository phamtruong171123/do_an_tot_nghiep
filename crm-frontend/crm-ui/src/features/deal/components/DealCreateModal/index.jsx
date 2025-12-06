import React from "react";
import styles from "./styles.module.scss";
import { createDeal } from "../../api";

export default function DealCreateModal({
  onClose,
  onCreated,
  pushToast,
  initialCustomerId,
}) {
  const [customerId, setCustomerId] = React.useState(
    initialCustomerId ? String(initialCustomerId) : ""
  );
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [appointmentAt, setAppointmentAt] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerId || !title) return;

    setSaving(true);
    try {
      const newDeal = await createDeal({
        customerId: Number(customerId),
        title,
        amount: amount ? Number(amount) : undefined,
        appointmentAt,
      });

      pushToast && pushToast("Đã tạo deal mới.", "success");
      onCreated && onCreated(newDeal);
    } catch (err) {
      console.error("Failed to create deal", err);
      pushToast && pushToast("Không thể tạo deal mới.", "error");
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
