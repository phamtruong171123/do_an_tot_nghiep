import React from "react";
import styles from "./styles.module.scss";
import { useToast } from "../../../components/Toast";
import { fetchConversationCustomer } from "../api";
import CustomerSidePanel from "../CustomerSidePanel";
import DealCreateModal from "../../deal/components/DealCreateModal";

export default function ChatMoreAction({ conversationId }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const [customer, setCustomer] = React.useState(null);
  const [latestDealId, setLatestDealId] = React.useState(null);
  const [loadingCustomer, setLoadingCustomer] = React.useState(false);

  const [showProfile, setShowProfile] = React.useState(false);
  const [showCreateDeal, setShowCreateDeal] = React.useState(false);

  const { pushToast } = useToast?.() || { pushToast: () => {} };

  const menuRef = React.useRef(null);

   React.useEffect(() => {
    setCustomer(null);
    setLatestDealId(null);
    setShowProfile(false);
    setShowCreateDeal(false);
    setMenuOpen(false);
  }, [conversationId]);


  const getAppPrefixByRole = () => {
    try {
      const me = JSON.parse(localStorage.getItem("me") || "null");
      const role = String(me?.role || "").toUpperCase();
      return role === "ADMIN" ? "/app/admin" : "/app/agent";
    } catch {
      return "/app/admin"; // fallback
    }
  };


  // đóng menu khi click ra ngoài
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);


  const ensureCustomerLoaded = async () => {
    if (loadingCustomer) return { customer: null, latestDealId: null };


    if (customer) return { customer, latestDealId };

    try {
      setLoadingCustomer(true);
      const res = await fetchConversationCustomer(conversationId);
      const c = res?.customer ?? null;
      const ld = res?.latestDealId ?? null;

      if (!c) {
        pushToast?.("Không tìm thấy khách hàng cho hội thoại này.", "error");
        return { customer: null, latestDealId: null };
      }

      setCustomer(c);
      setLatestDealId(ld);
      return { customer: c, latestDealId: ld };
    } catch (e) {
      console.error("fetchConversationCustomer error", e);
      pushToast?.("Không tải được thông tin khách hàng.", "error");
      return { customer: null, latestDealId: null };
    } finally {
      setLoadingCustomer(false);
    }
  };


  const handleViewProfile = async () => {
    const c = await ensureCustomerLoaded();
    if (!c) return;
    setMenuOpen(false);
    setShowProfile(true);
  };

  const handleViewLatestDeal = async () => {
    const { customer: c, latestDealId: id } = await ensureCustomerLoaded();
    if (!c) return;

    if (!id) {
      setMenuOpen(false);
      pushToast?.("Khách hàng chưa có deal nào.", "info");
      return;
    }

    setMenuOpen(false);
    const prefix = getAppPrefixByRole();
    window.open(`${prefix}/deals/${id}`, "_self");
  };


  const handleCreateDeal = async () => {
    const c = await ensureCustomerLoaded();
    if (!c) return;
    setMenuOpen(false);
    setShowCreateDeal(true);
  };

  return (
    <>
      {/* nút 3 chấm */}
      <div className={styles.wrapper} ref={menuRef}>
        <button
          className={styles.trigger}
          onClick={() => setMenuOpen((v) => !v)}
          title="More actions"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className={styles.menu}>
            {loadingCustomer && (
              <div className={styles.menuItemDisabled}>Loading...</div>
            )}
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleViewProfile}
            >
              View profile
            </button>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleViewLatestDeal}
            >
              View latest deal
            </button>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleCreateDeal}
            >
              Create deal
            </button>
          </div>
        )}
      </div>

      {/* Side panel: profile */}
      {showProfile && customer && (
        <CustomerSidePanel
          customer={customer}
          onClose={() => setShowProfile(false)}
          pushToast={pushToast}
        />
      )}

      {/* Modal: create deal với customerId */}
      {showCreateDeal && customer && (
        <DealCreateModal
          onClose={() => setShowCreateDeal(false)}
          initialCustomerId={customer.id}
          initialCustomer={customer}
          pushToast={pushToast}
          onCreated={() => {
            pushToast && pushToast("Đã tạo deal mới.", "success");
            setShowCreateDeal(false);
          }}
        />
      )}
    </>
  );
}
