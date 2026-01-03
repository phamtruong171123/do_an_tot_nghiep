// src/features/faq/FaqToolbar.jsx
import React from "react";
import classNames from "classnames/bind";
import styles from "./Faq.module.scss";

const cx = classNames.bind(styles);

export default function FaqToolbar({ searchText, onSearchChange, onAdd, canCreate }) {
  return (
    <div className={cx("toolbar")}>
      <input
        className={cx("search-input")}
        type="text"
        placeholder="Search question or answer..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {canCreate && (
        <button className={cx("primary-btn")} type="button" onClick={onAdd}>
          + Add FAQ
        </button>
      )}
    </div>
  );
}
