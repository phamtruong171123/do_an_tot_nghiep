import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketForm.module.scss";

const cx = classNames.bind(styles);

const DEFAULT_VALUES = {
  subject: "",
  customerName: "",
  dueAt: "",
  status: "OPEN",
  priority: "NORMAL",
  assigneeName: "",
};

export default function TicketForm({ open, mode, initialValues, onCancel, onSubmit }) {
  // Hooks luôn gọi ở top
  const [form, setForm] = React.useState(DEFAULT_VALUES);

  // Khi mở modal hoặc initialValues đổi -> reset form
  React.useEffect(() => {
    if (!open) return; // modal đóng thì thôi, không cần reset
    setForm({
      ...DEFAULT_VALUES,
      ...(initialValues || {}),
      dueAt: initialValues?.dueAt ? initialValues.dueAt.slice(0, 10) : "",
    });
  }, [open, initialValues]);

  // Sau khi gọi hooks mới được return conditionally
  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...initialValues,
      ...form,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
    };
    onSubmit && onSubmit(payload);
  };

  return (
    <div className={cx("overlay")}>
      <div className={cx("modal")}>
        <div className={cx("header")}>
          <h3 className={cx("title")}>
            {mode === "edit" ? "Edit ticket" : "Add new ticket"}
          </h3>
          <button className={cx("closeBtn")} type="button" onClick={onCancel}>
            ×
          </button>
        </div>

        <form className={cx("form")} onSubmit={handleSubmit}>
          <div className={cx("row")}>
            <label className={cx("label")}>Subject</label>
            <input
              className={cx("input")}
              value={form.subject}
              onChange={handleChange("subject")}
              placeholder="Ticket subject"
              required
            />
          </div>

          <div className={cx("row")}>
            <label className={cx("label")}>Customer</label>
            <input
              className={cx("input")}
              value={form.customerName}
              onChange={handleChange("customerName")}
              placeholder="Customer name (optional)"
            />
          </div>

          <div className={cx("rowGrid")}>
            <div>
              <label className={cx("label")}>Due date</label>
              <input
                className={cx("input")}
                type="date"
                value={form.dueAt}
                onChange={handleChange("dueAt")}
              />
            </div>
            <div>
              <label className={cx("label")}>Status</label>
              <select
                className={cx("input")}
                value={form.status}
                onChange={handleChange("status")}
              >
                <option value="OPEN">OPEN</option>
                <option value="PENDING">PENDING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <label className={cx("label")}>Priority</label>
              <select
                className={cx("input")}
                value={form.priority}
                onChange={handleChange("priority")}
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div className={cx("row")}>
            <label className={cx("label")}>Assignee</label>
            <input
              className={cx("input")}
              value={form.assigneeName}
              onChange={handleChange("assigneeName")}
              placeholder="Assignee name (mock)"
            />
          </div>

          <div className={cx("footer")}>
            <button
              type="button"
              className={cx("btn", "ghost")}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className={cx("btn", "primary")}>
              {mode === "edit" ? "Save changes" : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
