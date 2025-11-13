import React from "react";
import styles from "./ChatHeader.module.scss";

export default function ChatHeader({ thread }) {
  const p = thread.participants && thread.participants[0];
  const avatar = p?.avatarUrl || thread.iconUrl;
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {avatar && <img className={styles.avatar} src={avatar} alt={thread.title} />}
        <div>
          <div className={styles.title}>{thread.title}</div>
          <div className={styles.status}><span className={styles.dot} /> Online</div>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.btn}>Search</button>
        <button className={styles.btn}>More</button>
      </div>
    </header>
  );
}
