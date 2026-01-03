import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";

const cx = classNames.bind(styles);

const SEGMENT_OPTIONS = ["POTENTIAL", "NEW", "ACTIVE", "VIP", "DROPPED", "SPAM"];

export default function CustomerSummaryPanel({ segment, note, onChangeSegment, onChangeNote }) {
  const [internalSegment, setInternalSegment] = React.useState(segment);
  const [internalNote, setInternalNote] = React.useState(note);

  React.useEffect(() => {
    setInternalSegment(segment);
  }, [segment]);

  React.useEffect(() => {
    setInternalNote(note);
  }, [note]);

  const handleSegmentChange = (e) => {
    const value = e.target.value;
    setInternalSegment(value);
    onChangeSegment && onChangeSegment(value);
  };

  const handleNoteBlur = () => {
    if (internalNote !== note) {
      onChangeNote && onChangeNote(internalNote);
    }
  };

  return (
    <div className={cx("summaryCard")}>
      <div className={cx("summaryHeader")}>
        <h2 className={cx("summaryTitle")}>Customer Summary</h2>
      </div>

      <div className={cx("summaryBody")}>
        <div className={cx("summaryField")}>
          <label className={cx("label")}>Segment</label>
          <select
            className={cx("segmentSelect")}
            value={internalSegment}
            onChange={handleSegmentChange}
          >
            {SEGMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className={cx("summaryField")}>
          <label className={cx("label")}>Customer Note</label>
          <textarea
            className={cx("noteTextarea")}
            rows={4}
            placeholder="Ghi chú chung về khách hàng (tính cách, lịch sử, ưu tiên...)"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            onBlur={handleNoteBlur}
          />
        </div>
      </div>
    </div>
  );
}
