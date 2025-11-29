import React from "react";
import classNames from "classnames/bind";
import styles from "./Faq.module.scss";

const cx = classNames.bind(styles);

export default function FaqList({ items, loading, error, onEdit, onDelete, canEdit }) {
  if (loading) {
    return <div className={cx("state")}>Loading FAQs...</div>;
  }

  if (error) {
    return <div className={cx("state", "state-error")}>{error}</div>;
  }

  if (!items || items.length === 0) {
    return <div className={cx("state")}>No FAQ found.</div>;
  }

  return (
    <div className={cx("faq-table-wrapper")}>
      <div className={cx("faq-table")}>
        {items.map((faq) => (
          <div key={faq.id} className={cx("faq-row")}>
            <div className={cx("faq-cell", "faq-question-cell")}>
              <div className={cx("question")}>{faq.question}</div>
              {canEdit && (
                <div className={cx("actions")}>
                  <button
                    type="button"
                    className={cx("text-btn")}
                    onClick={() => onEdit && onEdit(faq)}
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button
                    type="button"
                    className={cx("text-btn", "danger")}
                    onClick={() => onDelete && onDelete(faq)}
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            <div className={cx("faq-cell", "faq-answer-cell")}>
              <div className={cx("answer")}>{faq.answer}</div>
              {faq.category && (
                <div className={cx("meta")}>
                  <span className={cx("badge")}>{faq.category}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
