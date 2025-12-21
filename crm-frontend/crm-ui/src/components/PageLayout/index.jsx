import React from "react";
import styles from "./PageLayout.module.scss";

export default function PageLayout({ title, subtitle, actions, children }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>

       
        <div className={styles.actions}>{actions}</div>
      </div>

      <div className={styles.card}>{children}</div>
    </div>
  );
}
