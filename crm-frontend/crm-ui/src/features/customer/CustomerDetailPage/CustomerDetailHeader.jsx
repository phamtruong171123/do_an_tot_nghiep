import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";

const cx = classNames.bind(styles);

export default function CustomerDetailHeader({
  customer,
  onChangeAvatar,
  onRemoveAvatar,
}) {
  const initials = (customer?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className={cx("headerCard")}>
      <div className={cx("cover")} />

      <div className={cx("headerContent")}>
        <div className={cx("avatarWrapper")}>
          <div className={cx("avatarCircle")}>{initials}</div>
          <button
            type="button"
            className={cx("avatarEditBtn")}
            onClick={onChangeAvatar}
            title="Change photo"
          >
            <i className="fa-solid fa-pen" />
          </button>
        </div>

        <button
          type="button"
          className={cx("coverRemoveBtn")}
          onClick={onRemoveAvatar}
          title="Remove photo"
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>
  );
}
