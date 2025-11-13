import React from "react";
import styles from "./EmptyState.module.scss";
export default function EmptyState({ title, subtitle }) {
  return (
    <div className={styles.empty}>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
