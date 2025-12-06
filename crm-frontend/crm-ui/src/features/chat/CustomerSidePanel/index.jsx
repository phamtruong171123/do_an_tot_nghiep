import React from "react";
import styles from "./styles.module.scss";
import { updateCustomer } from "../../customer/api";

export default function CustomerSidePanel({ customer, onClose, pushToast }) {
  const [local, setLocal] = React.useState(customer);

  React.useEffect(() => {
    setLocal(customer);
  }, [customer]);

  if (!customer) return null;

  const handleChange = (name, value) => {
    setLocal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateCustomer(customer.id, {
        name: local.name,
        phoneNumber: local.phoneNumber,
        email: local.email,
        address: local.address,
        segment: local.segment,
      });
      pushToast && pushToast("Đã cập nhật thông tin khách hàng.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      pushToast && pushToast("Không thể cập nhật khách hàng.", "error");
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Customer profile</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              value={local.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <input
              value={local.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              value={local.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Address</span>
            <textarea
              value={local.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </label>
        </div>

        <div className={styles.footer}>
          <button className={styles.primaryBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
