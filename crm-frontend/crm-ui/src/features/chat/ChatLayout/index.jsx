import React from "react";
import styles from "./ChatLayout.module.scss";

export default function ChatLayout({ sidebar, content }) {
  return (
    <div className={styles.chatLayout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.content}>{content}</main>
    </div>
  );
}
