import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerPage.module.scss";

const cx = classNames.bind(styles);

function getInitial(name = "") {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export default function CustomerRow({ customer, onEdit, onRowClick }) {
  const {  name, email, phoneNumber, address, avatarUrl,segment } = customer;

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit && onEdit(customer);
  };

  return (
     <tr className={cx("row")} onClick={() => onRowClick?.(customer)}>
      <td className={cx("colAvatar")}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className={cx("avatarImg")}
          />
        ) : (
          <div className={cx("avatarFallback")}>
            {getInitial(name)}
          </div>
        )}
      </td>
      <td className={cx("colSegment")}>
        {segment ? (
          <span className={cx("segmentPill", segment.toLowerCase())}>
            {segment}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className={cx("colName")}>{name}</td>
      <td className={cx("colEmail")}>{email}</td>
      <td className={cx("colPhone")}>{phoneNumber}</td>
      <td className={cx("colAddress")}>{address}</td>
      <td className={cx("colEdit")}>
        <button
          type="button"
          className={cx("editBtn")}
          onClick={handleEdit}
        >
          <i className="fa-solid fa-pen-to-square" />
        </button>
      </td>
    </tr>
  );
}
