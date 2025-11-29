import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";

const cx = classNames.bind(styles);

/**
 * Props:
 * - customer: { id, name, email, phoneNumber, address, ... }
 * - onSaveInfo: (patch) => Promise<void> | void
 */
export default function CustomerInfoForm({ customer, onSaveInfo }) {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // sync form khi customer thay đổi
  React.useEffect(() => {
    if (!customer) return;
    const next = {
      name: customer.name || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      address: customer.address || "",
    };
    setForm(next);
    setDirty(false);
    setSaving(false);
  }, [customer?.id]);

  if (!customer) return null;

  const base = {
    name: customer.name || "",
    email: customer.email || "",
    phoneNumber: customer.phoneNumber || "",
    address: customer.address || "",
  };

  const recomputeDirty = (nextForm) => {
    return (
      nextForm.name !== base.name ||
      nextForm.email !== base.email ||
      nextForm.phoneNumber !== base.phoneNumber ||
      nextForm.address !== base.address
    );
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setDirty(recomputeDirty(next));
      return next;
    });
  };

  const handleReset = () => {
    setForm(base);
    setDirty(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty || !onSaveInfo || !customer) return;

    try {
      setSaving(true);
      // gửi patch lên trên
      await onSaveInfo({
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        address: form.address,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cx("infoCard")}>
      <form className={cx("formGrid")} onSubmit={handleSubmit}>
        <div className={cx("fieldGroup", "fullWidth")}>
          <label className={cx("label")}>Name</label>
          <input
            className={cx("input")}
            type="text"
            value={form.name}
            onChange={handleChange("name")}
          />
        </div>

        <div className={cx("fieldGroup")}>
          <label className={cx("label")}>Email</label>
          <input
            className={cx("input")}
            type="email"
            value={form.email}
            onChange={handleChange("email")}
          />
        </div>

        <div className={cx("fieldGroup")}>
          <label className={cx("label")}>Phone</label>
          <input
            className={cx("input")}
            type="text"
            value={form.phoneNumber}
            onChange={handleChange("phoneNumber")}
          />
        </div>

        <div className={cx("fieldGroup", "fullWidth")}>
          <label className={cx("label")}>Address</label>
          <input
            className={cx("input")}
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={handleChange("address")}
          />
        </div>

        {/* Hàng nút Save/Cancel chỉ hiện khi có thay đổi */}
        {dirty && (
          <div className={cx("formActions", "fullWidth")}>
            <button
              type="button"
              className={cx("cancelBtn")}
              onClick={handleReset}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cx("saveBtn")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
