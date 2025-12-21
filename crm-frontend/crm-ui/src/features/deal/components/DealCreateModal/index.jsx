import React from "react";
import styles from "./styles.module.scss";
import { createDeal } from "../../api";
import CustomerSearchSelect from "../../../../components/CustomerSearchSelect";
import { formatNumber, convertStringToNumber } from "../../../../core/helper/string";

export default function DealCreateModal({
  onClose,
  onCreated,
  pushToast,
  initialCustomerId,
}) {
  const [customerId, setCustomerId] = React.useState(
    initialCustomerId ? Number(initialCustomerId) : null
  );
  const [title, setTitle] = React.useState("");

  const [appointmentAt, setAppointmentAt] = React.useState(""); 

  const [quantity, setQuantity] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");
  const [paidAmount, setPaidAmount] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  const goodsAmountNum = React.useMemo(() => {
    const q = convertStringToNumber(quantity);
    const up = convertStringToNumber(unitPrice);
    if (q == null || up == null) return null;
    return q * up;
  }, [quantity, unitPrice]);

  const goodsAmountText =
    goodsAmountNum == null ? "" : formatNumber(String(goodsAmountNum));

  async function handleSubmit(e) {
    e.preventDefault();

    

    if (!customerId || !title.trim()) {
      pushToast && pushToast("Customer và Title là bắt buộc.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        title: title.trim(),

        // optional numeric fields
        quantity: convertStringToNumber(quantity) ?? undefined,
        unitPrice: convertStringToNumber(unitPrice) ?? undefined,
        paidAmount: convertStringToNumber(paidAmount) ?? undefined,

       appointmentAt: appointmentAt ? new Date(appointmentAt).toISOString() : undefined,
    
      };

      const newDeal = await createDeal(payload);

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
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Customer</span>
            <CustomerSearchSelect
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              placeholder="Search by name or phone number..."
            />
          </label>

          <div  className={styles.row2}>
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
              
            <span className={styles.label}>Appointment</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
            />
          </label>
          </div>


          <div className={styles.grid4}>
            <label className={styles.field}>
              <span className={styles.label}>Quantity</span>
              <input
                type="text"
                className={styles.input}
                value={quantity}
                onChange={(e) => setQuantity(formatNumber(e.target.value))}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Unit Price</span>
              <input
                type="text"
                className={styles.input}
                value={unitPrice}
                onChange={(e) => setUnitPrice(formatNumber(e.target.value))}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Goods Amount</span>
              <input
                type="text"
                className={styles.input}
                value={goodsAmountText}
                disabled
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Paid Amount</span>
              <input
                type="text"
                className={styles.input}
                value={paidAmount}
                onChange={(e) => setPaidAmount(formatNumber(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.textBtn}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
