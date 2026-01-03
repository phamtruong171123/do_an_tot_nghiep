
import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketList.module.scss";
import TicketListItem from "./TicketListItem";



const cx = classNames.bind(styles);

export default function TicketList({ items , onEdit}) {
  if (!items.length) {
    return <div className={cx("empty")}>No Tickets found!</div>;
  }

  //console.log(items);

  return (
    <div className={cx("tableWrap")}>
      <table className={cx("table")}>
        <thead>
          <tr>
            <th className={cx("colCode")}>Code</th>
            <th className={cx("colDue")}>Due date</th>
            <th className={cx("colTask")}>Title</th>
            <th className={cx("colAssignee")}>Assignee</th>
            <th className={cx("colStatus")}>Status</th>
            <th className={cx("colPriority")}>Priority</th>
            <th className={cx("colActions")} aria-label="Actions" />

        
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <TicketListItem key={t.id} item={t} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
