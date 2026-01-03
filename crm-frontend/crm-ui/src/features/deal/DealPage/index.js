import React from "react";
import styles from "./styles.module.scss";
import { fetchDeals } from "../api";
import { useToast } from "../../../components/Toast";
import DealCreateModal from "../components/DealCreateModal";
import PageLayout from "../../../components/PageLayout";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatNumber } from "../../../core/helper/string";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
const cx = classNames.bind(styles);
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
  const [stageFilter, setStageFilter] = React.useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const { pushToast } = useToast?.() || { pushToast: () => {} };

  const navigate = useNavigate();

  function getMe() {
    try {
      return JSON.parse(localStorage.getItem("me") || "null");
    } catch (err) {
      return null;
    }
  }

  const me = React.useMemo(() => getMe(), []);
  const isAdmin = me?.role === "ADMIN";
  const role = (me?.role).toLowerCase();

  const [tab, setTab] = React.useState("mine");

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, stageFilter, tab]);

  async function loadData() {
    setLoading(true);
    try {
      const view = isAdmin ? (tab === "approval" ? "pendingApproval" : "mine") : undefined;

      const { items, total } = await fetchDeals({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        stage: stageFilter || undefined,
        view,
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

  const handleSearchChange = (e) => {
    setPage(1);
    setSearch(e.target.value);
  };

  const handleStageChange = (e) => {
    setStageFilter(e.target.value);
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

    return s.toLowerCase().replace(/\s+/g, "_");
  };

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Deals</h1>
            <div className={styles.subtitle}>
              Total: <strong>{total}</strong> deals
            </div>
          </div>

          <div className={styles.headerMiddle}>
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <i
                  className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`}
                  aria-hidden="true"
                />

                <input
                  className={styles.searchInput}
                  placeholder="Search by code, title or customer"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>

              <div className={styles.sortGroup}>
                <span className={styles.sortLabel}>Stage:</span>
                <select
                  className={styles.sortSelect}
                  value={stageFilter}
                  onChange={handleStageChange}
                >
                  <option value="">ALL</option>
                  <option value="POTENTIAL">POTENTIAL</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="PENDING_CONTRACT_APPROVAL">PENDING</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className={styles.tabGroup}>
              <select
                className={styles.sortSelect}
                value={tab}
                onChange={(e) => {
                  setTab(e.target.value);
                  setPage(1);
                }}
              >
                <option value="mine">My deals</option>
                <option value="approval">Deals pending approval</option>
              </select>
            </div>
          )}

          <div className={styles.headerRight}>
            <button className={styles.primaryBtn} onClick={() => setShowCreate(true)}>
              <span style={{ marginRight: "9px" }}>Add New</span>
              <i className="fa-solid fa-plus" aria-hidden="true" />
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
                  <th>Code</th>
                  <th>Title</th>
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
                    onClick={() => navigate(`/app/${role}/deals/${d.id}`)}
                  >
                    <td>{d.code}</td>
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
                      {d.paidAmount != null
                        ? `${formatNumber(d.paidAmount.toLocaleString("en-US"))} VND`
                        : "-"}
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
              setPage(1);
            }}
            pushToast={pushToast}
          />
        )}
      </div>
    </PageLayout>
  );
}
