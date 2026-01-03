import React from "react";
import styles from "./ChatHeader.module.scss";
import defaultAvatar from "../../../assets/images/default-avatar.png";
import ChatMoreActions from "../ChatMoreAction";
import { formatLastActive } from "../../../core/helper/formatLastActive";
import { fetchConversationCustomer } from "../api";

export default function ChatHeader({ thread, injectedLastActivityAt }) {
  const p = thread.participants && thread.participants[0];
  const avatar = p?.avatarUrl || thread.iconUrl || defaultAvatar;
  const [customer, setCustomer] = React.useState(null);
  const effectiveLastActivityAt = injectedLastActivityAt || customer?.lastActivityAt;
  const last = formatLastActive(effectiveLastActivityAt);

  const isOnline = effectiveLastActivityAt
    ? Date.now() - new Date(effectiveLastActivityAt).getTime() < 2 * 60 * 1000
    : false;

  console.log("Customer in ChatHeader:", customer);

  React.useEffect(() => {
    let alive = true;

    async function loadCustomer() {
      try {
        const res = await fetchConversationCustomer(thread.id);
        if (!alive) return;
        setCustomer(res?.customer ?? null);
      } catch {
        if (!alive) return;
        setCustomer(null);
      }
    }

    if (thread?.id) loadCustomer();

    return () => {
      alive = false;
    };
  }, [thread?.id]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {avatar && <img className={styles.avatar} src={avatar} alt={thread.title} />}
        <div>
          <div className={styles.title}>{thread.title}</div>

          <div
            className={`${styles.status} ${isOnline ? styles.statusOnline : styles.statusOffline}`}
          >
            <span className={`${styles.dot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
            {isOnline ? "Online" : last ? `Active ${last}` : "Offline"}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <ChatMoreActions conversationId={thread.id} />
      </div>
    </header>
  );
}
