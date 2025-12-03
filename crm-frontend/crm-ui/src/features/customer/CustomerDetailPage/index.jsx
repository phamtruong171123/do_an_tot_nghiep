import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerDetailPage.module.scss";
import { useParams, useNavigate } from "react-router-dom";

import CustomerDetailHeader from "./CustomerDetailHeader";
import CustomerInfoForm from "./CustomerInfoForm";
import CustomerSummaryPanel from "./CustomerSummaryPanel";
import CustomerRecentDeals from './CustomerRecentDeals';

import { fetchCustomerDetail, updateCustomer } from "../api";
import { useToast } from "../../../components/Toast";

const cx = classNames.bind(styles);

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast?.() || { pushToast: () => {} };

  const [customer, setCustomer] = React.useState(null);
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchCustomerDetail(id);
        if (cancelled) return;
        setCustomer(data);
        setTickets(data.tickets || []);
      } catch (err) {
        console.error("Failed to fetch customer detail", err);
        pushToast &&
          pushToast("Tải thông tin khách hàng thất bại.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChangeAvatar = () => {
    // TODO: mở file picker + upload avatar
  };

  const handleRemoveAvatar = () => {
    // TODO: xoá avatar
  };

  const handleSegmentChange = async (value) => {
    if (!customer) return;
    try {
      const updated = await updateCustomer(customer.id, { segment: value });
      setCustomer((prev) => (prev ? { ...prev, segment: updated.segment } : prev));
      pushToast && pushToast("Đã cập nhật segment khách hàng.", "success");
    } catch (err) {
      console.error("Failed to update customer segment", err);
      pushToast && pushToast("Không thể cập nhật segment.", "error");
    }
  };

  const handleNoteChange = async (value) => {
    if (!customer) return;
    try {
      const updated = await updateCustomer(customer.id, { note: value });
      setCustomer((prev) => (prev ? { ...prev, note: updated.note } : prev));
      pushToast && pushToast("Đã lưu ghi chú khách hàng.", "success");
    } catch (err) {
      console.error("Failed to update customer note", err);
      pushToast && pushToast("Không thể lưu ghi chú khách hàng.", "error");
    }
  };

  const handleSaveInfo = async (patch) => {
    if (!customer) return;
    try {
      const updated = await updateCustomer(customer.id, patch);
      // cập nhật state local → header & form sync
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              email: updated.email,
              phoneNumber: updated.phoneNumber,
              address: updated.address,
            }
          : prev
      );
      pushToast && pushToast("Đã cập nhật thông tin khách hàng.", "success");
    } catch (err) {
      console.error("Failed to update customer info", err);
      pushToast && pushToast("Không thể cập nhật thông tin khách hàng.", "error");
      throw err; // để InfoForm vẫn dừng saving đúng
    }
  };



  if (loading && !customer) {
    return <div className={cx("page")}>Đang tải khách hàng…</div>;
  }

  if (!customer) {
    return <div className={cx("page")}>Không tìm thấy khách hàng.</div>;
  }

  return (
    <div className={cx("page")}>
      <div className={cx("leftPane")}>
        <h1 className={cx("title")}>Customer Details</h1>

        <CustomerDetailHeader
          customer={customer}
          onChangeAvatar={handleChangeAvatar}
          onRemoveAvatar={handleRemoveAvatar}
        />

        <CustomerInfoForm customer={customer} onSaveInfo={handleSaveInfo}/>
      </div>

      <div className={cx("rightPane")}>
        <CustomerSummaryPanel
          segment={customer.segment || "POTENTIAL"}
          note={customer.note || ""}
          onChangeSegment={handleSegmentChange}
          onChangeNote={handleNoteChange}
        />
        <div className="customer-detail-right-column">
  {/* ...các card khác như TicketPanel... */}
  <CustomerRecentDeals customerId={customer.id} />
</div>
        
      </div>
    </div>
  );
}
