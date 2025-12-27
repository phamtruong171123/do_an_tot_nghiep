import React from "react";
import styles from "./styles.module.scss";
import { fetchDeals } from "../api";
import { useToast } from "../../../components/Toast";
import DealCreateModal from "../components/DealCreateModal";
import PageLayout from "../../../components/PageLayout";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatNumber } from "../../../core/helper/string";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function DealPage() {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 20;

  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);


  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState("desc"); // asc | desc

  const debouncedSearch = useDebouncedValue(search, 400); 
  const { pushToast } = useToast?.() || { pushToast: () => {} };

  // load data mỗi khi page / search / sort thay đổi
  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, sortBy, sortOrder]);

  async function loadData() {
    setLoading(true);
    try {
     const { items, total } = await fetchDeals({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });

      setItems(items);
      setTotal(total);
    } catch (e) {
      console.error("Failed to load deals", e);
      pushToast && pushToast("Không thể tải danh sách deals.", "error");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // khi đổi search → về page 1
  const handleSearchChange = (e) => {
    setPage(1);
    setSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split(":");
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const normalizeStatusLabel = (status) => {
    if (!status) return "-";
    const s = String(status).trim();

    if (s.toLowerCase() === "pending contract approval") return "PENDING";
    if (s.toUpperCase() === "PENDING_CONTRACT_APPROVAL") return "PENDING";

    return s;
  };

  const normalizeStatusKey = (status) => {
    if (!status) return "unknown";
    const s = String(status).trim();

    if (s.toLowerCase() === "pending contract approval") return "PENDING";
    if (s.toUpperCase() === "PENDING_CONTRACT_APPROVAL") return "PENDING";

    return s.toLowerCase().replace(/\s+/g, "_"); // ví dụ "In Progress" -> "in_progress"
  };


  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Deals</h1>
            <div className={styles.subtitle}>Total: {total} deals</div>
          </div>

          <div className={styles.headerMiddle}>
            <div className={styles.toolbar}>
              <input
                className={styles.searchInput}
                placeholder="Search by deal or customer"
                value={search}
                onChange={handleSearchChange}
              />

              <div className={styles.sortGroup}>
                <span className={styles.sortLabel}>Sort by:</span>
                <select
                  className={styles.sortSelect}
                  value={`${sortBy}:${sortOrder}`}
                  onChange={handleSortChange}
                >
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                  <option value="amount:desc">Amount: high → low</option>
                  <option value="amount:asc">Amount: low → high</option>
                  <option value="appointmentAt:desc">Appointment: latest</option>
                  <option value="appointmentAt:asc">Appointment: earliest</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.primaryBtn} onClick={() => setShowCreate(true)}>
              + Add New
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.empty}>Loading...</div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>No deals found.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                <tr>
                  <th>Deal</th>
                  <th>Customer</th>
                  <th>Stage</th>
                  <th>Appointment</th>
                  <th className={styles.amountCol}>Paid Amount</th>
                </tr>
                </thead>
                <tbody>
                {items.map((d) => (
                  <tr
                    key={d.id}
                    className={styles.row}
                    onClick={() => window.open(`/app/admin/deals/${d.id}`, "_self")}
                  >
                    <td className={styles.cellTitle}>{d.title}</td>
                    <td>{d.customerName || "-"}</td>
                    <td>
                      {(() => {
                        const stageKey = normalizeStatusKey(d.stage);
                        const stageLabel = normalizeStatusLabel(d.stage);

                        return (
                          <span className={`${styles.pill} ${styles["pill_" + stageKey] || ""}`}>
                            {stageLabel}
                          </span>
                        );
                      })()}
                    </td>

                    <td>{formatDate(d.appointmentAt)}</td>
                    <td className={styles.cellAmount}>
                      {d.paidAmount != null ? `${formatNumber(d.paidAmount.toLocaleString("en-US"))} VND` : "-"}
                    </td>

                  </tr>
                ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.textBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                className={styles.textBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
  
        {showCreate && (
          <DealCreateModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              // reload lại về page 1 sau khi tạo deal mới
              setPage(1);
            }}
            pushToast={pushToast}
          />
        )}
      </div>
    </PageLayout>
  );
}
