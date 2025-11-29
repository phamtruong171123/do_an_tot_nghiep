import React from "react";
import classNames from "classnames/bind";
import styles from "./CreateCustomerForm.module.scss";

import { useToast } from "../../../components/Toast"
import { createCustomer } from "../api"

const cx = classNames.bind(styles);

const SEGMENT_OPTIONS = [
  "POTENTIAL",
  "NEW",
  "ACTIVE",
  "VIP",
  "DROPPED",
  "SPAM",
];

export default function CreateCustomerForm({ open, onClose, onCreated }) {
  const { pushToast } = useToast?.() || { pushToast: () => {} };

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    segment: "POTENTIAL",
    note: "",
  });

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      // reset form mỗi lần mở
      setForm({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
        segment: "POTENTIAL",
        note: "",
      });
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      pushToast && pushToast("Tên khách hàng không được để trống.", "error");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        address: form.address.trim() || null,
        segment: form.segment,
        note: form.note.trim() || null,
      };

      const created = await createCustomer(payload);

      pushToast && pushToast("Tạo khách hàng thành công.", "success");
      onCreated && onCreated(created);
    } catch (err) {
      console.error("Failed to create customer", err);
      pushToast && pushToast("Không thể tạo khách hàng.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    onClose && onClose();
  };

  return (
    <div className={cx("overlay")} onClick={handleCancel}>
      <div
        className={cx("modal")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("header")}>
          <h2 className={cx("title")}>Create customer</h2>
          <button
            type="button"
            className={cx("closeBtn")}
            onClick={handleCancel}
          >
            ×
          </button>
        </div>

        <form className={cx("form")} onSubmit={handleSubmit}>
          {/* Name */}
          <div className={cx("row")}>
            <div className={cx("field", "full")}>
              <label className={cx("label")}>
                Name<span className={cx("required")}>*</span>
              </label>
              <input
                className={cx("input")}
                type="text"
                placeholder="Customer name"
                value={form.name}
                onChange={handleChange("name")}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className={cx("row")}>
            <div className={cx("field")}>
              <label className={cx("label")}>Email</label>
              <input
                className={cx("input")}
                type="email"
                placeholder="Email (optional)"
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>

            <div className={cx("field")}>
              <label className={cx("label")}>Phone</label>
              <input
                className={cx("input")}
                type="text"
                placeholder="Phone number (optional)"
                value={form.phoneNumber}
                onChange={handleChange("phoneNumber")}
              />
            </div>
          </div>

          {/* Address */}
          <div className={cx("row")}>
            <div className={cx("field", "full")}>
              <label className={cx("label")}>Address</label>
              <input
                className={cx("input")}
                type="text"
                placeholder="Street / City / State..."
                value={form.address}
                onChange={handleChange("address")}
              />
            </div>
          </div>

          {/* Segment + Note */}
          <div className={cx("row")}>
            <div className={cx("field")}>
              <label className={cx("label")}>Segment</label>
              <select
                className={cx("input")}
                value={form.segment}
                onChange={handleChange("segment")}
              >
                {SEGMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className={cx("field")} />
          </div>

          <div className={cx("row")}>
            <div className={cx("field", "full")}>
              <label className={cx("label")}>Customer note</label>
              <textarea
                className={cx("textarea")}
                rows={3}
                placeholder="Ghi chú chung về khách hàng..."
                value={form.note}
                onChange={handleChange("note")}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={cx("footer")}>
            <button
              type="button"
              className={cx("btnSecondary")}
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cx("btnPrimary")}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
