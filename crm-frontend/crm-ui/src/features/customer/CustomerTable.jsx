import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerPage.module.scss";
import CustomerRow from "./CustomerRow";

const cx = classNames.bind(styles);

export default function CustomerTable({ items, onEdit, onRowClick }) {
  return (
    <div className={cx("tableWrapper")}>
      <table className={cx("table")}>
        <thead>
          <tr>
            <th className={cx("colAvatar")} />
            <th className={cx("colSegment")}>Segment</th>
            <th className={cx("colName")}>Name</th>
            <th className={cx("colEmail")}>Email</th>
            <th className={cx("colPhone")}>Phone</th>
            <th className={cx("colAddress")}>Address</th>
           {/*  <th className={cx("colEdit")}>Edit</th> */}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              onEdit={onEdit}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className={cx("emptyState")}>
          <i className={cx("emptyIcon", "fa-regular fa-user")} />
          <p>No customers found.</p>
        </div>
      )}
    </div>
  );
}
