import React from "react";
import styles from "./SegmentPill.module.scss";
import { SEGMENT_LABEL, normalizeSegment } from "../../core/config/const";

export default function SegmentPill({ value, size = "md" }) {
  const seg = normalizeSegment(value);
  const label = SEGMENT_LABEL[seg] || seg;

  return (
    <span className={`${styles.pill} ${styles[seg.toLowerCase()]} ${styles[size]}`}>
      {label}
    </span>
  );
}
