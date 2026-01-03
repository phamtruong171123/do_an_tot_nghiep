import React from "react";
import styles from "./ThreadList.module.scss";
import ThreadListItem from "./ThreadListItem";

export default function ThreadList({ items = [], activeId, onSelect, metaById = {} }) {
  return (
    <div className={styles.list}>
      {items.map((t) => (
        <ThreadListItem
          key={t.id}
          item={t}
          meta={metaById?.[t.id]}
          active={t.id === activeId}
          onClick={() => onSelect && onSelect(t.id)}
        />
      ))}
    </div>
  );
}
