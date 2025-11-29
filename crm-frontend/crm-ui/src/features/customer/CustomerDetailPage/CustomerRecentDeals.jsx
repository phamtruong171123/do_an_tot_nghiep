import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";

const cx = classNames.bind(styles);

export default function CustomerRecentDeals({ deals, onClickDeal, onAddDeal }) {
  return (
    <div className={cx("recentDeals")}>
      <div className={cx("recentHeader")}>
        <h2 className={cx("recentTitle")}>Recent Deals</h2>
        <button
          type="button"
          className={cx("recentAddBtn")}
          onClick={onAddDeal}
        >
          +
        </button>
      </div>

      <div className={cx("recentList")}>
        {deals.map((d) => (
          <button
            key={d.id}
            type="button"
            className={cx("dealItem")}
            onClick={() => onClickDeal?.(d)}
          >
            <div className={cx("dealAvatar")}>
              {d.avatarUrl ? (
                <img src={d.avatarUrl} alt={d.title} />
              ) : (
                <span />
              )}
            </div>
            <div className={cx("dealInfo")}>
              <div className={cx("dealTitle")}>{d.title}</div>
              <div className={cx("dealMeta")}>
                <span>{d.dateLabel}</span>
                <span>{d.amount}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button type="button" className={cx("recentLoadMore")}>
        Load More
      </button>
    </div>
  );
}
