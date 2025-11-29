import React, { useEffect, useRef, useState } from "react";
import styles from "./MessageList.module.scss";
import MessageBubble from "./MessageBubble";

export default function MessageList({ items = [], selectedId: selProp, onSelect }) {
  const [selectedId, setSelectedId] = useState(selProp ?? null);
  const ref = useRef(null);

  useEffect(() => { if (selProp !== undefined) setSelectedId(selProp); }, [selProp]);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); },
            [items.length]);

  const handleSelect = (id) => {
    if (selProp === undefined) setSelectedId(id);
    onSelect && onSelect(id);
  };

  return (
    <div className={styles.list} ref={ref}>
      {items.map(m => (
        <MessageBubble
          key={m.id}
          msg={m}
          isMine={!!m.isMine}               // <- dùng flag trong dữ liệu
          
          selected={m.id === selectedId}
          onClick={() => handleSelect(m.id)}
        />
      ))}
    </div>
  );
}
