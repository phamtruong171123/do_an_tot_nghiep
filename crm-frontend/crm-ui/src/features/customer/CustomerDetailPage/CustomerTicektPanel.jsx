import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";

const cx = classNames.bind(styles);

export default function CustomerTicketsPanel({ tickets, onClickTicket }) {
  return (
    <div className={cx("ticketsCard")}>
      <div className={cx("ticketsHeader")}>
        <h2 className={cx("ticketsTitle")}>Tickets</h2>
        {/* Sau có thể thêm nút Create Ticket từ đây */}
      </div>

      {tickets.length === 0 ? (
        <div className={cx("ticketsEmpty")}>No tickets yet.</div>
      ) : (
        <div className={cx("ticketsList")}>
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cx("ticketItem")}
              onClick={() => onClickTicket && onClickTicket(t)}
            >
              <div className={cx("ticketCode")}>{t.code}</div>
              <div className={cx("ticketSubject")}>{t.subject}</div>
              <div className={cx("ticketMeta")}>
                <span className={cx("ticketStatus", t.status.toLowerCase())}>{t.status}</span>
                {t.status !== "CLOSED" && (
                  <span className={cx("ticketPriority", t.priority.toLowerCase())}>
                    {t.priority}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
