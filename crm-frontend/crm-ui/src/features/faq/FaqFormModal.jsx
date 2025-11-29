import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Faq.module.scss";

const cx = classNames.bind(styles);

export default function FaqFormModal({ visible, initialValue, onCancel, onSubmit }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      setQuestion(initialValue.question || "");
      setAnswer(initialValue.answer || "");
      setCategory(initialValue.category || "");
      setStatus(initialValue.status || "ACTIVE");
    } else {
      setQuestion("");
      setAnswer("");
      setCategory("");
      setStatus("ACTIVE");
    }
  }, [visible, initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim() || null,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className={cx("modal-overlay")}>
      <div className={cx("modal")}>
        <div className={cx("modal-header")}>
          <h2>{initialValue ? "Edit FAQ" : "Add FAQ"}</h2>
          <button type="button" className={cx("close-btn")} onClick={onCancel}>
            ×
          </button>
        </div>

        <form className={cx("modal-body")} onSubmit={handleSubmit}>
          <label className={cx("field")}>
            <span className={cx("label")}>Question</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </label>

          <label className={cx("field")}>
            <span className={cx("label")}>Answer</span>
            <textarea
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </label>

          <label className={cx("field")}>
            <span className={cx("label")}>Category (optional)</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>

          <label className={cx("field")}>
            <span className={cx("label")}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <div className={cx("modal-footer")}>
            <button
              type="button"
              className={cx("secondary-btn")}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={cx("primary-btn")} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
