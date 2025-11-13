import React from "react";
import styles from "./MessageList.module.scss";

export default function MessageBubble({ msg, isMine, selected, onClick }) {
  return (
    <div
      className={[
        styles.msg,
        isMine ? styles.mine : styles.theirs,
        selected ? styles.selected : ""
      ].join(" ")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e)=> (e.key==="Enter"||e.key===" ") && onClick?.()}
    >
      {!isMine && msg.from?.avatarUrl && (
        <img className={styles.avatar} src={msg.from.avatarUrl} alt={msg.from?.name || ""} />
      )}

      <div className={styles.bubble}>
        {msg.text && <p className={styles.text}>{msg.text}</p>}
        {msg.html && <div className={styles.html} dangerouslySetInnerHTML={{ __html: msg.html }} />}
        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
          <ul className={styles.attach}>
            {msg.attachments.map(a => <li key={a.id}><a href={a.url}>{a.name}</a></li>)}
          </ul>
        )}
        <div className={styles.meta}>
          <time>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
          {msg.status && <span className={styles.status}>{msg.status}</span>}
        </div>
      </div>
    </div>
  );
}
