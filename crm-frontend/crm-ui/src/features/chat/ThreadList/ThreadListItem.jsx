import React from "react";
import styles from "./ThreadList.module.scss";
import defaultAvatar from "../../../assets/images/default-avatar.png";
import SegmentPill from "../../../components/SegmentPill";

export default function ThreadListItem({ item, meta, active, onClick }) {
  const p = item.participants?.[0];
  const avatar = item.iconUrl || p?.avatarUrl;

  const avatarSrc = avatar || defaultAvatar;
  const isBotLast = item.lastMessageSentBy === "BOT";

  return (
    <button className={`${styles.item} ${active ? styles.active : ""}`} onClick={onClick}>
      <img className={styles.avatar} src={avatarSrc} alt={item.title} />

      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.title}>
            {item.title}
            {meta?.segment ? (
              <span style={{ marginLeft: 8 }}>
                <SegmentPill value={meta.segment} size="sm" />
              </span>
            ) : null}
          </div>
          {/* time... */}
        </div>
        <div className={styles.snippet}>{item.lastMessageSnippet}</div>
      </div>

      {item.unread ? <span className={styles.badge}>{item.unread}</span> : null}
    </button>
  );
}
