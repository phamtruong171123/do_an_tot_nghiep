import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketToolbar.module.scss";

const cx = classNames.bind(styles);

export default function TicketToolbar({
  total,
  status,
  onStatusChange,
  mineOnly,
  onMineChange,
  sortBy,
  onSortByChange,
  searchText,
  onSearchTextChange,
  onAddNew,
  
}) {
  return (
    <div className={cx("toolbar")}>
      <div className={cx("left")}>
        <h2 className={cx("title")}>Tickets</h2>
        <div className={cx("total")}>Total: <strong>{total}</strong> tickets</div>
      </div>

      <div className={cx("center")}>
        <div className={cx("searchWrap")}>
          <i
            className={`fa-solid fa-magnifying-glass ${cx("searchIcon")}`}
            aria-hidden="true"
          />
          <input
            className={cx("search")}
            type="text"
            placeholder="Search by code or title"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
          />
        </div>
      </div>

      <div className={cx("right")}>
        <div className={cx("controls")}>
          <select
            className={cx("select")}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
          >
            <option value="DUE_DATE">Sort by: Due Date</option>
            <option value="CREATED_AT">Sort by: Created Date</option>
          </select>

          <select
            className={cx("select")}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="ALL">All status</option>
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="CLOSED">Closed</option>
          </select>

          <label className={cx("toggleMine")}>
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => onMineChange(e.target.checked)}
            />
            <span>My tickets</span>
          </label>
        </div>

        <button className={cx("addBtn")} type="button" onClick={onAddNew}>
          Add New
          <i className="fa-solid fa-plus" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
