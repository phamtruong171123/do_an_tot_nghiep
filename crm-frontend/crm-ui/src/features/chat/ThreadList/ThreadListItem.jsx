import React from "react";
import styles from "./ThreadList.module.scss";
import defaultAvatar from "../../../assets/images/default-avatar.png";

export default function ThreadListItem({ item, active, onClick }) {
  const p = item.participants?.[0];
  const avatar = item.iconUrl || p?.avatarUrl;

  const avatarSrc = avatar || defaultAvatar; 
  const isBotLast = item.lastMessageSentBy === "BOT"; 

  return (
    <button
      className={`${styles.item} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      <img
        className={styles.avatar}
        src={avatarSrc}
        alt={item.title}
      />

      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.title}>{item.title}
             {isBotLast && (
              <span className={styles.botTag}>Bot</span>   
            )}
          </div>
          {item.updatedAt && (
            <time className={styles.time}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </time>
          )}
        </div>
        <div className={styles.snippet}>{item.lastMessageSnippet}</div>
      </div>

      {item.unread ? <span className={styles.badge}>{item.unread}</span> : null}
    </button>
  );
}
