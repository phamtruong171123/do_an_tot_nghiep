import React from "react";
import styles from "./ThreadList.module.scss";
import ThreadListItem from "./ThreadListItem";

export default function ThreadList({ items=[], activeId, onSelect }) {
  return (
    <div className={styles.list}>
      {items.map(t => (
        <ThreadListItem
          key={t.id}
          item={t}
          active={t.id === activeId}
          onClick={() => onSelect && onSelect(t.id)}
        />
      ))}
    </div>
  );
}
