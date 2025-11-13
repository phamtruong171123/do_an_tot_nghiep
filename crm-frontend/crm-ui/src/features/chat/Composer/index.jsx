import React from "react";
import styles from "./Composer.module.scss";

export default function Composer({ onSend }) {
  const [text, setText] = React.useState("");
  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend && onSend(t);
    setText("");
  };
  return (
    <form className={styles.wrap} onSubmit={submit}>
      <input
        className={styles.input}
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className={styles.actions}>
        <button className={styles.ghost} type="button" title="Attach">📎</button>
        <button className={styles.primary} type="submit">Send</button>
      </div>
    </form>
  );
}
