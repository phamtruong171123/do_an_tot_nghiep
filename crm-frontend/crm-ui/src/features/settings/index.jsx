import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";

export default function SettingsPage({ me }) {
  const navigate = useNavigate();

  const role = me?.role || "AGENT";
  const isAdmin = role === "ADMIN";


  return (
    <div className={styles.page}>
      <div className={styles.header}>
        
        <div>
          <h1 className={styles.title}>Settings</h1>
          
        </div>
      </div>

      <div className={styles.grid}>
        {/* FAQ: cả agent & admin đều có */}
        <button
          className={styles.card}
          onClick={() =>
            navigate(isAdmin ? "/app/admin/faq" : "/app/agent/faq")
          }
        >
          <div className={styles.cardTitle}>FAQ</div>
          <div className={styles.cardDesc}>
            Common questions and quick answers for agents.
          </div>
        </button>

        {/* Chỉ admin mới thấy Users */}
        {isAdmin && (
          <button
            className={styles.card}
            onClick={() => navigate("/app/admin/users")}
          >
            <div className={styles.cardTitle}>Users</div>
            <div className={styles.cardDesc}>
              Manage system users and permissions.
            </div>
          </button>
        )}

        {/* Placeholder GPT config – sau này bạn build tiếp */}
        {isAdmin && (
          <button
            className={styles.card}
            onClick={() => navigate("/app/admin/settings/gpt")}
          >
            <div className={styles.cardTitle}>GPT Configuration</div>
            <div className={styles.cardDesc}>
              Configure GPT behavior and templates (coming soon).
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
