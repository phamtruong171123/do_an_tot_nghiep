import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerPage.module.scss";

const cx = classNames.bind(styles);

const SEGMENT_OPTIONS = [
  { value: "ALL", label: "All segments" },
  { value: "POTENTIAL", label: "Potential" },
  { value: "NEW", label: "New" },
  { value: "ACTIVE", label: "Active" },
  { value: "VIP", label: "VIP" },
  { value: "DROPPED", label: "Dropped" },
  { value: "SPAM", label: "Spam" },
];

export default function CustomerToolbar({
  total,
  filters,
  onChangeFilters,
  onAddNew,
}) {
  const safeFilters = filters || {
    q: "",
    segment: "ALL",
    sortBy: "CREATED_AT",
  };

  const handleSearchChange = (e) => {
    onChangeFilters?.({ q: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleSegmentChange = (e) => {
    onChangeFilters?.({ segment: e.target.value });
  };

  const handleSortChange = (e) => {
    onChangeFilters?.({ sortBy: e.target.value });
  };

  return (
    <div className={cx("toolbar")}>
      <div className={cx("toolbarLeft")}>
        <h1 className={cx("title")}>Customers</h1>
        <span className={cx("subtitle")}>
          Total: <strong>{total}</strong> customers
        </span>
      </div>

      <div className={cx("toolbarRight")}>
        {/* Search */}
        <form className={cx("searchWrapper")} onSubmit={handleSearchSubmit}>
          <i
            className={`fa-solid fa-magnifying-glass ${cx("searchIcon")}`}
            aria-hidden="true"
          />
          <input
            type="text"
            className={cx("searchInput")}
            placeholder="Search by name, email or phone"
            value={safeFilters.q}
            onChange={handleSearchChange}
          />
        </form>

        {/* Segment */}
        <div className={cx("segmentFilter")}>
          <select
            className={cx("segmentSelect")}
            value={safeFilters.segment}
            onChange={handleSegmentChange}
          >
            {SEGMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className={cx("sortWrapper")}>
          <label className={cx("sortLabel")}></label>
          <select
            className={cx("sortSelect")}
            value={safeFilters.sortBy}
            onChange={handleSortChange}
          >
            <option value="CREATED_AT">Date Created</option>
            <option value="NAME_ASC">Name A–Z</option>
            <option value="NAME_DESC">Name Z–A</option>
          </select>
        </div>

        {/* Add new */}
        <button
          type="button"
          className={cx("addBtn")}
          onClick={onAddNew}
        >
          Add New
          <i className="fa-solid fa-plus" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
