import React from "react";
import styles from "./styles.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchDealDetail,
  createDealActivity,
  updateDeal,
  requestContractApproval,
  rejectContract,
  approveContract,
} from "../api";
import { updateCustomer } from "../../customer/api";
import { useToast } from "../../../components/Toast";
import { formatNumber, convertStringToNumber } from "../../../core/helper/string";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString();
}

function normalizeStageLabel(stage) {
  if (!stage) return "-";
  const s = String(stage).trim();

  if (s.toUpperCase() === "PENDING_CONTRACT_APPROVAL") return "PENDING";
  if (s.toLowerCase() === "pending contract approval") return "PENDING";

  return s;
}

function normalizeStageKey(stage) {
  if (!stage) return "unknown";
  const s = String(stage).trim();

  // KEY để map CSS => LUÔN lowercase
  if (s.toUpperCase() === "PENDING_CONTRACT_APPROVAL") return "pending";
  if (s.toLowerCase() === "pending contract approval") return "pending";

  return s.toLowerCase().replace(/\s+/g, "_");
}


const EDITABLE_STAGES = ["POTENTIAL", "CONTACTED", "NEGOTIATION", "LOST"];
const SEGMENTS = ["POTENTIAL", "NEW", "ACTIVE", "VIP", "DROPPED", "SPAM"];

function getMe() {
  try {
    return JSON.parse(localStorage.getItem("me") || "null");
  } catch {
    return null;
  }
};



function asInputString(v) {
  if (v === null || v === undefined || v === "") return "";
  return formatNumber(String(v));
}

function DealInfoCard({ deal, onChange, pushToast, reload }) {
  
  const [local, setLocal] = React.useState(deal);
  const [rejectReason, setRejectReason] = React.useState("");
  const navigate=useNavigate();

  const me = React.useMemo(() => getMe(), []);
  const role=(me?.role).toLowerCase();
  const isAdmin = me?.role === "ADMIN";

  React.useEffect(() => {
    setLocal({
      ...deal,
      unitPrice: asInputString(deal?.unitPrice),
      quantity: asInputString(deal?.quantity),
      paidAmount: asInputString(deal?.paidAmount),
    });
  }, [deal]);

  

  const locked =
    deal.stage === "PENDING_CONTRACT_APPROVAL" || deal.stage === "CONTRACT";

  const goodsAmountNum = React.useMemo(() => {
    const up = convertStringToNumber(local.unitPrice);
    const q = convertStringToNumber(local.quantity);
    if (up == null || q == null) return null;
    return up * q;
  }, [local.unitPrice, local.quantity]);

  const goodsAmountText =
    goodsAmountNum == null ? "-" : formatNumber(String(goodsAmountNum));

  const handleFieldChange = (name, value) => {
    setLocal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (locked) return;

    try {
      const updated = await updateDeal(deal.id, {
        stage: local.stage,
        description: local.description,

        unitPrice: convertStringToNumber(local.unitPrice),
        quantity: convertStringToNumber(local.quantity),
        paidAmount: convertStringToNumber(local.paidAmount),
        costNote: local.costNote,
      });

      onChange(updated);
      await reload?.(); // để activity log/summary update ngay
      pushToast && pushToast("Deal updated.", "success");
    } catch (e) {
      console.error("Failed to update deal", e);
      pushToast && pushToast("Failed to update deal.", "error");
    }
  };

  const handleSubmitApproval = async () => {
    if (locked) return;

    const up = convertStringToNumber(local.unitPrice);
    const q = convertStringToNumber(local.quantity);
    const paid = convertStringToNumber(local.paidAmount);
    const note = String(local.costNote || "").trim();
    const ga = goodsAmountNum;

    if (up == null || up <= 0)
      return pushToast && pushToast("Unit price is required.", "error");
    if (q == null || q <= 0)
      return pushToast && pushToast("Quantity is required.", "error");
    if (!note)
      return pushToast && pushToast("Cost explanation is required.", "error");
    if (paid == null || paid <= 0)
      return pushToast && pushToast("Paid amount is required.", "error");
    // if (ga == null || paid < ga)
    //   return pushToast &&
    //     pushToast(
    //       "Paid amount must be greater than or equal to goods amount.",
    //       "error"
    //     );

    const ok = window.confirm(
      "Are you sure to submit this deal for contract approval? This action cannot be undone."
    );
    if (!ok) return;

    try {
    
      const updated = await requestContractApproval(deal.id);
      onChange(updated);
      await reload?.();
      pushToast && pushToast("Submitted for approval.", "success");
     
    } catch (e) {
      console.error("Submit approval failed", e);
      pushToast &&
        pushToast(
          e?.response?.data?.error || "Submit approval failed.",
          "error"
        );
    }
  };

  const handleApprove = async () => {
    try {
      const updated = await approveContract(deal.id);
      onChange(updated);
      await reload?.();
      navigate(`/app/${role}/deals/`);
      pushToast && pushToast("Approved. Deal is now CONTRACT.", "success");

    } catch (e) {
      console.error("Approve failed", e);
      pushToast &&
        pushToast(e?.response?.data?.error || "Approve failed.", "error");
    }
  };



  const handleReject = async () => {
    const reason = String(rejectReason || "").trim();
    if (!reason) return pushToast && pushToast("Reject reason is required.", "error");

    try {
      const updated = await rejectContract(deal.id, reason);
      onChange(updated);
      setRejectReason("");
      await reload?.();
      pushToast && pushToast("Rejected.", "success");
      navigate(`/app/${role}/deals/`);
    } catch (e) {
      console.error("Reject failed", e);
      pushToast &&
        pushToast(e?.response?.data?.error || "Reject failed.", "error");
    }
  };




  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Deal Information</h2>

      <div className={styles.formRow}>
        <label>Stage</label>
        <select
          value={local.stage}
          disabled={locked}
          onChange={(e) => handleFieldChange("stage", e.target.value)}
        >
          {/* Không cho user chọn PENDING/CONTRACT */}
          {locked && (
            <option value={local.stage}>{normalizeStageLabel(local.stage)}</option>
          )}

          {!locked &&
            EDITABLE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
      </div>

      <div className={styles.grid4}>
        <div className={styles.formRow}>
          <label>Quantity</label>
          <input
            type="text"
            value={local.quantity ?? ""}
            disabled={locked}
            onChange={(e) =>
              handleFieldChange("quantity", formatNumber(e.target.value))
            }
          />
        </div>

        <div className={styles.formRow}>
          <label>Unit Price</label>
          <input
            type="text"
            value={local.unitPrice ?? ""}
            disabled={locked}
            onChange={(e) =>
              handleFieldChange("unitPrice", formatNumber(e.target.value))
            }
          />
        </div>

        <div className={styles.formRow}>
          <label>Goods Amount</label>
          <input type="text" value={goodsAmountText} disabled />
        </div>

        <div className={styles.formRow}>
          <label>Paid Amount</label>
          <input
            type="text"
            value={local.paidAmount ?? ""}
            disabled={locked}
            onChange={(e) =>
              handleFieldChange("paidAmount", formatNumber(e.target.value))
            }
          />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.formRow}>
          <label>Cost Explanation</label>
          <textarea
            rows={2}
            value={local.costNote || ""}
            disabled={locked}
            onChange={(e) => handleFieldChange("costNote", e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label>Description</label>
          <textarea
            rows={2}
            value={local.description || ""}
            disabled={locked}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        {!locked && (
          <>
            <button className={styles.primaryBtn} onClick={handleSave}>
              Save
            </button>
            <button className={styles.primaryBtn} onClick={handleSubmitApproval}>
              Submit for Contract Approval
            </button>
          </>
        )}

        {isAdmin && deal.stage === "PENDING_CONTRACT_APPROVAL" && (
          <div className={styles.adminBox}>
            <button className={styles.primaryBtn} onClick={handleApprove}>
              Approve Contract
            </button>

            <textarea
              className={styles.textarea}
              placeholder="Reject reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <button className={styles.dangerBtn} onClick={handleReject}>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerInfoCard({ customer, onCustomerUpdated, pushToast }) {
  if (!customer) return null;

  const handleSegmentChange = async (e) => {
    const newSegment = e.target.value;
    try {
      const updated = await updateCustomer(customer.id, { segment: newSegment });
      onCustomerUpdated(updated);
      pushToast && pushToast("Customer segment updated.", "success");
    } catch (err) {
      console.error("Failed to update customer", err);
      pushToast && pushToast("Failed to update segment.", "error");
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
      pushToast && pushToast("Failed to load deal detail.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function reloadDealSilent() {
    try {
      const data = await fetchDealDetail(id);
      setDeal(data);
    } catch (e) {
      console.error("Failed to reload deal", e);
    }
  }

  async function handleAddActivity() {
    if (!activityContent.trim()) return;
    setSavingActivity(true);
    try {
      const newAct = await createDealActivity(id, { content: activityContent });
      setDeal((prev) => ({
        ...prev,
        activities: [newAct, ...(prev.activities || [])],
      }));
      setActivityContent("");
      pushToast && pushToast("Activity saved.", "success");
    } catch (e) {
      console.error("Failed to create activity", e);
      pushToast && pushToast("Failed to save activity.", "error");
    } finally {
      setSavingActivity(false);
    }
  }

  const handleCustomerUpdated = (updatedCustomer) => {
    setDeal((prev) => ({
      ...prev,
      customer: { ...(prev?.customer || {}), ...updatedCustomer },
    }));
  };

  const handleDealUpdated = (partial) => {
    setDeal((prev) => ({ ...prev, ...partial }));
  };

  if (loading || !deal) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const paidAmountText =
    deal.paidAmount == null ? "-" : formatNumber(String(deal.paidAmount));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{deal.title}</h1>
          <div className={styles.subtitle}>
            Deal code: {deal.code} • Customer: {deal.customer?.name || "-"}
          </div>
        </div>

        {(() => {
          const key = normalizeStageKey(deal.stage);
          const label = normalizeStageLabel(deal.stage);
          return (
            <span className={`${styles.pill} ${styles[`pill_${key}`] || ""}`}>
              {label}
            </span>
          );
        })()}

      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.summaryCard}>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Owner</span>
              <span className={styles.rowValue}>{deal.owner?.fullName || "-"}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Appointment</span>
              <span className={styles.rowValue}>{formatDate(deal.appointmentAt)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Paid Amount</span>
              <span className={styles.rowValue}>{paidAmountText} VND</span>
            </div>
          </div>

          <DealInfoCard
            deal={deal}
            onChange={handleDealUpdated}
            pushToast={pushToast}
            reload={reloadDealSilent}
          />
        </div>

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
