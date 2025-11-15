// src/features/ticket/TicketList/TicketListItem.jsx
import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketList.module.scss";

const cx = classNames.bind(styles);

export default function TicketListItem({ item , onEdit}) {
  const {
    code,
    subject,
    customerName,
    dueAt,
    isOverdue,
    assigneeName,
    status,
    priority,
  } = item;


  const handleEdit = () => {
    onEdit && onEdit(item);
  }
  return (
    <tr>
      <td className={cx("code")}>{code}</td>
      <td className={cx("due")}>
        {dueAt ? (
          <span className={cx("duePill", { overdue: isOverdue })}>
            {new Date(dueAt).toLocaleDateString()}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className={cx("subject")}>
        <div className={cx("subjectMain")}>{subject}</div>
        {customerName && <div className={cx("subjectSub")}>{customerName}</div>}
      </td>
      <td className={cx("assignee")}>{assigneeName || "-"}</td>
      <td className={cx("status")}>
        <span className={cx("statusPill", status.toLowerCase())}>
          {status}
        </span>
      </td>
      <td className={cx("priority")}>
        <span className={cx("prioPill", priority.toLowerCase())}>
          {priority}
        </span>
      </td>
      <td className={cx("edit")}>
        <i className="fa-solid fa-pen-to-square" aria-hidden="true" onClick={handleEdit} />
      </td>
    </tr>
  );
}
