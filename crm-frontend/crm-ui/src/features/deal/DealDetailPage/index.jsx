import React from "react";
import styles from "./styles.module.scss";
import { useParams } from "react-router-dom";
import { fetchDealDetail, createDealActivity } from "../api";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function DealDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const [activityContent, setActivityContent] = React.useState("");
  const [savingActivity, setSavingActivity] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    loadDeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadDeal() {
    setLoading(true);
    try {
      const data = await fetchDealDetail(id);
      setDeal(data);
    } catch (e) {
      console.error("Failed to load deal", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddActivity() {
    if (!activityContent.trim()) return;
    setSavingActivity(true);
    try {
      const newAct = await createDealActivity(id, {
        content: activityContent,
      });
      setDeal((prev) => ({
        ...prev,
        activities: [newAct, ...(prev.activities || [])],
      }));
      setActivityContent("");
    } catch (e) {
      console.error("Failed to create activity", e);
    } finally {
      setSavingActivity(false);
    }
  }

  if (loading || !deal) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{deal.title}</h1>
          <div className={styles.subtitle}>
            Deal code: {deal.code} • Customer: {deal.customer?.name || "-"}
          </div>
        </div>
        <span
          className={`${styles.pill} ${
            styles["pill_" + deal.stage.toLowerCase()]
          }`}
        >
          {deal.stage}
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.summaryCard}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Amount</span>
            <span className={styles.rowValue}>
              {deal.amount != null
                ? deal.amount.toLocaleString("vi-VN")
                : "-"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Appointment</span>
            <span className={styles.rowValue}>
              {formatDate(deal.appointmentAt)}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Owner</span>
            <span className={styles.rowValue}>
              {deal.owner?.fullName || "-"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Description</span>
            <span className={styles.rowValue}>
              {deal.description || "-"}
            </span>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.activityCard}>
            <h3 className={styles.sectionTitle}>Record Activity</h3>
            <textarea
              className={styles.textarea}
              value={activityContent}
              onChange={(e) => setActivityContent(e.target.value)}
              placeholder="Write your notes"
            />
            <div className={styles.activityActions}>
              <button
                className={styles.primaryBtn}
                onClick={handleAddActivity}
                disabled={savingActivity}
              >
                {savingActivity ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className={styles.activityCard}>
            <h3 className={styles.sectionTitle}>Activity Log</h3>
            {(deal.activities || []).length === 0 ? (
              <div className={styles.empty}>No activity found.</div>
            ) : (
              <ul className={styles.activityList}>
                {deal.activities.map((a) => (
                  <li key={a.id} className={styles.activityItem}>
                    <div className={styles.activityContent}>{a.content}</div>
                    <div className={styles.activityMeta}>
                      {formatDate(a.activityAt || a.createdAt)} •{" "}
                      {a.author?.fullName || "-"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
