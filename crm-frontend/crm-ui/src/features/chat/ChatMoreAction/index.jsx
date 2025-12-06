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

  // đảm bảo đã load customer từ BE
  const ensureCustomerLoaded = async () => {
    if (customer || loadingCustomer) return customer;

    try {
      setLoadingCustomer(true);
      const { customer: c, latestDealId: ld } =
        await fetchConversationCustomer(conversationId);

      if (!c) {
        pushToast && pushToast("Không tìm thấy khách hàng cho hội thoại này.", "error");
        return null;
      }

      setCustomer(c);
      if (ld) setLatestDealId(ld);
      return c;
    } catch (e) {
      console.error("fetchConversationCustomer error", e);
      pushToast && pushToast("Không tải được thông tin khách hàng.", "error");
      return null;
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
    const c = await ensureCustomerLoaded();
    if (!c) return;

    const id = latestDealId;
    if (!id) {
      pushToast && pushToast("Khách hàng chưa có deal nào.", "info");
      return;
    }
    setMenuOpen(false);
    window.open(`/app/admin/deals/${id}`, "_self");
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
