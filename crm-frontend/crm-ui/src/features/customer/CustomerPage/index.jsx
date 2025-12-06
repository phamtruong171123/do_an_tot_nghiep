import React from "react";
import classNames from "classnames/bind";
import styles from "../CustomerPage.module.scss"
import { useNavigate } from "react-router-dom";
import CreateCustomerForm from "../CreateCustomerForm";
import CustomerToolbar from "../CustomerToolbar";
import CustomerTable from "../CustomerTable";


import { fetchCustomers } from "../api";
import { useToast } from "../../../components/Toast";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import PageLayout from "../../../components/PageLayout";
const PAGE_SIZE = 20;

const cx = classNames.bind(styles);

export default function CustomerPage() {

const { pushToast } = useToast?.() || { pushToast: () => {} };

  const [customers, setCustomers] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);


  const navigate = useNavigate();
   const [filters, setFilters] = React.useState({
    q: "",
    segment: "ALL",       // ALL | POTENTIAL | ACTIVE | ...
    sortBy: "NAME_ASC",   // NAME_ASC | NAME_DESC | CREATED_AT
  });

  const debouncedSearch = useDebouncedValue(filters.q, 400);



  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { items, total, page: serverPage, pageSize } =
          await fetchCustomers({
            page,
            limit: PAGE_SIZE,
            q: debouncedSearch,
            segment: filters.segment,
            sortBy: filters.sortBy,
          });

        if (cancelled) return;

        setTotal(total);
        setCustomers((prev) =>
          serverPage === 1 ? items : [...prev, ...items]
        );

        const pageSizeFinal = pageSize || PAGE_SIZE;
        const loaded = (serverPage - 1) * pageSizeFinal + items.length;
        setHasMore(loaded < total);
      } catch (err) {
        console.error("Failed to fetch customers", err);
       // if (pushToast) pushToast("Tải danh sách khách hàng thất bại.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, filters.segment, filters.sortBy]);


 
  const handleCustomerCreated = (customer) => {
  setIsCreateOpen(false);


  setPage(1);
  setCustomers([]);
  setHasMore(true);
};

  const handleChangeFilters = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const filteredCustomers = React.useMemo(() => {
    let result = [...customers];

    // 1. Lọc theo segment
    if (filters.segment && filters.segment !== "ALL") {
      result = result.filter((c) => c.segment === filters.segment);
    }

    // 2. Lọc theo search (name / email / phone / address)
    const q = filters.q.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        return (
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phoneNumber || "").toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q)
        );
      });
    }

    // 3. Sort
    if (filters.sortBy === "NAME_ASC" || filters.sortBy === "NAME_DESC") {
      result.sort((a, b) => {
        const na = (a.name || "").toLowerCase();
        const nb = (b.name || "").toLowerCase();
        if (na < nb) return filters.sortBy === "NAME_ASC" ? -1 : 1;
        if (na > nb) return filters.sortBy === "NAME_ASC" ? 1 : -1;
        return 0;
      });
    } else if (filters.sortBy === "CREATED_AT") {
      result.sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da; // mới nhất trước
      });
    }

    return result;
  }, [customers, filters]);


  const handleRowClick = (customer) => {
    if (!customer || !customer.id) return;
    navigate(`../customers/${customer.id}`);
  };

  const handleEditCustomer= ()=>{ 

  };



  // Handler tạm, sau này nối logic thật
  const handleAddNew = () => {
    setIsCreateOpen(true);
  };

  

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    setPage((p) => p + 1);
  };

  return (
    <PageLayout>
      <div className={cx("page")}>
        <CustomerToolbar
          total={total}
          filters={filters} 
          onAddNew={handleAddNew}
          
          onChangeFilters={handleChangeFilters}
        />
  
        <CustomerTable
          items={filteredCustomers}
          onEdit={handleEditCustomer}
          onRowClick={handleRowClick}
        />
  
        <div className={cx("loadMoreWrapper")}>
          <button
            type="button"
            className={cx("loadMoreBtn")}
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
        <CreateCustomerForm
    open={isCreateOpen}
    onClose={() => setIsCreateOpen(false)}
    onCreated={handleCustomerCreated}
  />
      </div>
    </PageLayout>
  );
}
