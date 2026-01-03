import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketForm.module.scss";
import CustomerSearchSelect from "../../../components/CustomerSearchSelect";
const cx = classNames.bind(styles);

const DEFAULT_VALUES = {
  subject: "",
  customerId: null,
  customerName: "",
  dueAt: "",
  status: "OPEN",
  priority: "NORMAL",
  assigneeName: "",
  assigneeId: null,
};

export default function TicketForm({
  open,
  mode,               // "create" | "edit"
  initialValues,
  onCancel,
  onSubmit,
  currentUser,         // optional: { id, username, fullName, role }
  isAdmin = false,     // optional, mặc định false
  assigneeOptions = [],// optional: [{ id, name, username, ... }]
}) {
  const [values, setValues] = React.useState(DEFAULT_VALUES);

  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialValues) {
      setValues({
        ...DEFAULT_VALUES,
        ...initialValues,
        assigneeId:
          typeof initialValues.assigneeId === "number"
            ? initialValues.assigneeId
            : null,
      });
    } else {
      // create
      setValues({
        ...DEFAULT_VALUES,
        assigneeName:
          currentUser?.fullName || currentUser?.username || "",
        assigneeId: null, 
      });
    }
  }, [open, mode, initialValues, currentUser, isAdmin]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = { ...values };

    // AGENT: không gửi assigneeId, backend tự gán = authUser.id
    if (!isAdmin) {
      delete payload.assigneeId;
    } else {
      // ADMIN: convert sang number hoặc null
      if (payload.assigneeId === "" || payload.assigneeId === null) {
        payload.assigneeId = null;
      } else {
        payload.assigneeId = Number(payload.assigneeId) || null;
      }
    }

    onSubmit(payload);
  };

  return (
    <div className={cx("overlay")}>
      <div className={cx("modal")}>
        <div className={cx("header")}>
          <h2 className={cx("title")}>
            {mode === "edit" ? "Edit ticket" : "Create ticket"}
          </h2>
          <button
            type="button"
            className={cx("closeBtn")}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form className={cx("form")} onSubmit={handleSubmit}>
          {/* Subject */}
          <div className={cx("row")}>
            <label className={cx("label")}>
              Subject <span>*</span>
            </label>
            <input
              type="text"
              className={cx("input")}
              value={values.subject}
              onChange={handleChange("subject")}
              placeholder="Ticket subject"
              required
            />
          </div>


          <div className={cx("row")}>
            <label className={cx("label")}>Customer</label>
            <CustomerSearchSelect
              value={values.customerId}
              onChange={(id, customer) => {
                setValues((prev) => ({
                  ...prev,
                  customerId: id,
                  customerName: customer?.name || "",
                }));
              }}
              placeholder="Search by name or phone number"
              selectedCustomer={
                     initialValues?.customerId
                       ? { id: initialValues.customerId, name: initialValues.customerName }
                        : null
                     }
            />
          </div>


          {/* Status + Priority + Due date (3 cột) */}
          <div className={cx("rowGrid")}>
            <div className={cx("row")}>
              <label className={cx("label")}>Status</label>
              <select
                className={cx("input")}
                value={values.status}
                onChange={handleChange("status")}
              >
                <option value="OPEN">Open</option>
                <option value="PENDING">Pending</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className={cx("row")}>
              <label className={cx("label")}>Priority</label>
              <select
                className={cx("input")}
                value={values.priority}
                onChange={handleChange("priority")}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className={cx("row")}>
              <label className={cx("label")}>Due date</label>
              <input
                type="date"
                className={cx("input")}
                value={values.dueAt || ""}
                onChange={handleChange("dueAt")}
              />
            </div>
          </div>

          {/* Assignee */}
          <div className={cx("row")}>
            <label className={cx("label")}>Assignee</label>
            {isAdmin ? (
              <select
                className={cx("input")}
                value={
                  values.assigneeId != null
                    ? String(values.assigneeId)
                    : ""
                }
                onChange={handleChange("assigneeId")}
              >
                <option value="">{ initialValues?.assigneeId?  initialValues?.assigneeName : "Unassigned"}</option>
                {assigneeOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{" "}
                    {u.username ? `(${u.username})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className={cx("input")}
                value={
                  values.assigneeName || ""
                }
                readOnly
              />
            )}
          </div>

          {/* Footer buttons */}
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
