import React from "react";
import styles from "./styles.module.scss";
import { useParams } from "react-router-dom";
import {
  fetchDealDetail,
  createDealActivity,
  updateDeal,
} from "../api";
import { updateCustomer } from "../../customer/api";
import { useToast } from "../../../components/Toast";
import DealCreateModal from "../components/DealCreateModal";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString();
}

const STAGES = ["POTENTIAL", "CONTACTED", "NEGOTIATION", "CONTRACT", "LOST"];
const SEGMENTS = ["POTENTIAL", "NEW", "ACTIVE", "VIP", "DROPPED", "SPAM"];

function DealInfoCard({ deal, onChange, pushToast }) {
  const [local, setLocal] = React.useState(deal);

  React.useEffect(() => {
    setLocal(deal);
  }, [deal]);

  if (!deal) return null;

  const handleFieldChange = (name, value) => {
    setLocal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await updateDeal(deal.id, {
        stage: local.stage,
        amount: local.amount,
        description: local.description,
      });
      // merge partial lên state cha
      onChange(updated);
      pushToast && pushToast("Đã cập nhật deal.", "success");
    } catch (e) {
      console.error("Failed to update deal", e);
      pushToast && pushToast("Không thể cập nhật deal.", "error");
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Deal information</h2>

      <div className={styles.formRow}>
        <label>Stage</label>
        <select
          value={local.stage}
          onChange={(e) => handleFieldChange("stage", e.target.value)}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formRow}>
        <label>Amount</label>
        <input
          type="number"
          value={local.amount ?? ""}
          onChange={(e) =>
            handleFieldChange(
              "amount",
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
        />
      </div>

      <div className={styles.formRow}>
        <label>Description</label>
        <textarea
          value={local.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
        />
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryBtn} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

function CustomerInfoCard({ customer, onCustomerUpdated, pushToast }) {
  if (!customer) return null;

  const handleSegmentChange = async (e) => {
    const newSegment = e.target.value;
    try {
      const updated = await updateCustomer(customer.id, {
        segment: newSegment,
      });
      onCustomerUpdated(updated);
      pushToast && pushToast("Đã cập nhật segment khách hàng.", "success");
    } catch (err) {
      console.error("Failed to update customer", err);
      pushToast && pushToast("Không thể cập nhật segment.", "error");
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Customer</h2>
      <div className={styles.customerName}>{customer.name || "-"}</div>

      <div className={styles.formRow}>
        <label>Segment</label>
        <select
          value={customer.segment || "POTENTIAL"}
          onChange={handleSegmentChange}
        >
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formRow}>
        <label>Phone</label>
        <span className={styles.rowValue}>{customer.phoneNumber || "-"}</span>
      </div>

      <div className={styles.formRow}>
        <label>Email</label>
        <span className={styles.rowValue}>{customer.email || "-"}</span>
      </div>

      <div className={styles.formRow}>
        <label>Address</label>
        <span className={styles.rowValue}>{customer.address || "-"}</span>
      </div>
    </div>
  );
}

export default function DealDetailPage() {
  const { id } = useParams();
  const { pushToast } = useToast?.() || { pushToast: () => {} };

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
      pushToast && pushToast("Không thể tải chi tiết deal.", "error");
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
      pushToast && pushToast("Đã lưu activity.", "success");
    } catch (e) {
      console.error("Failed to create activity", e);
      pushToast && pushToast("Không thể lưu activity.", "error");
    } finally {
      setSavingActivity(false);
    }
  }

  const handleCustomerUpdated = (updatedCustomer) => {
    setDeal((prev) => ({
      ...prev,
      customer: {
        ...(prev?.customer || {}),
        ...updatedCustomer,
      },
    }));
  };

  // merge deal partial sau khi update, không làm mất customer/activities
  const handleDealUpdated = (partial) => {
    setDeal((prev) => ({
      ...prev,
      ...partial,
    }));
  };

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
        {/* Cột trái: summary + form edit deal */}
        <div className={styles.leftCol}>
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

          <DealInfoCard
            deal={deal}
            onChange={handleDealUpdated}
            pushToast={pushToast}
          />
        </div>

        {/* Cột phải: customer + activity */}
        <div className={styles.rightCol}>
          <CustomerInfoCard
            customer={deal.customer}
            onCustomerUpdated={handleCustomerUpdated}
            pushToast={pushToast}
          />

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

          {/* Activity Log luôn nằm dưới Record Activity */}
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
