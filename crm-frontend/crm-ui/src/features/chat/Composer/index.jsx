import React from "react";
import styles from "./Composer.module.scss";

export default function Composer({ onSend }) {
  const [text, setText] = React.useState("");

  const hanldeChange = (e) => {
    const e1=e.target;
    setText(e1.value);

    e1.style.height="auto";
    e1.style.height=e1.scrollHeight+"px";
  };
  const handleOnKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend && onSend(t);
    setText("");
    // set height back to normal
    const textArea = e.target.querySelector("textarea");
    if(textArea)
      textArea.style.height="";
    };
  return (
    <form className={styles.wrap} onSubmit={submit}>
      <textarea
        className={styles.input}
        placeholder="Type a message..."
        value={text}
        onChange={(e) => {hanldeChange(e)}}
        onKeyDown = {handleOnKeyDown}
      />
      <div className={styles.actions}>
        <button className={styles.ghost} type="button" title="Attach">📎</button>
        <button className={styles.primary} type="submit">Send</button>
      </div>
    </form>
  );
}
