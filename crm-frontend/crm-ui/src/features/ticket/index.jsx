// src/features/ticket/index.jsx
import React from "react";
import TicketLayout from "./TicketLayout";
import TicketToolbar from "./TicketToolbar";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";
import {
  fetchTickets,
  createTicketFromForm,
  updateTicketFromForm,
  fetchActiveUsers,
} from "./api";
import { useToast } from "../../components/Toast";

const PAGE_SIZE = 20;

function getCurrentUserFromStorage() {
  try {
    const raw = localStorage.getItem("me");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function TicketPage() {
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [mineOnly, setMineOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState("DUE_DATE");
  const [searchText, setSearchText] = React.useState("");

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create"); // "create" | "edit"
  const [editingTicket, setEditingTicket] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

    const { pushToast } = useToast();


  const [currentUser] = React.useState(() => getCurrentUserFromStorage());
  const isAdmin = currentUser?.role === "ADMIN";
  console.log("isAdmin: ", isAdmin);

  const [assigneeOptions, setAssigneeOptions] = React.useState([]);

  // ====== Load list user cho ADMIN ======
    React.useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const users = await fetchActiveUsers();
        if (!cancelled) setAssigneeOptions(users);
      } catch (e) {
        console.error("Failed to fetch users for assign", e);
        pushToast("Tải danh sách người dùng thất bại.", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);


  // ====== Load list ticket từ BE ======
    const loadTickets = React.useCallback(
    async ({ append = false, page: nextPage = 1 } = {}) => {
      setLoading(true);
      try {
        const { items: fetched, total } = await fetchTickets({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          mine: mineOnly,
          q: searchText,
          limit: PAGE_SIZE,
          offset: (nextPage - 1) * PAGE_SIZE,
        });

        setTotal(total);
        setHasMore(nextPage * PAGE_SIZE < total);
        setPage(nextPage);

        setItems((prev) =>
          append ? [...prev, ...fetched] : fetched
        );
      } catch (err) {
        console.error("Failed to fetch tickets", err);
        pushToast("Tải danh sách ticket thất bại.", "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, mineOnly, searchText, pushToast]
  );


  React.useEffect(() => {
    loadTickets({ append: false, page: 1 });
  }, [loadTickets]);

  // ====== Handlers cho toolbar ======
  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleMineChange = (checked) => {
    setMineOnly(checked);
  };

  const handleSortByChange = (value) => {
    setSortBy(value);
  };

  const handleSearchTextChange = (value) => {
    setSearchText(value);
  };

  const handleAddNew = () => {
    setFormMode("create");
    setEditingTicket(null);
    setFormOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setFormMode("edit");
    setEditingTicket({
      id: ticket.id,
      subject: ticket.subject,
      customerName: ticket.customerName || "",
      dueAt: ticket.dueAt || "",
      status: ticket.status,
      priority: ticket.priority,
      assigneeName: ticket.assigneeName || "",
      assigneeId: ticket.assigneeId ?? null,
    });
    setFormOpen(true);
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    loadTickets({ append: true, page: page + 1 });
  };

  // ====== Submit form create / edit ======
  const handleSubmitForm = async (formValues) => {
    setSubmitting(true);
    try {
      if (formMode === "create") {
        const newTicket = await createTicketFromForm(formValues);
        setItems((prev) => [newTicket, ...prev]);
        setTotal((prev) => prev + 1);
        pushToast("Tạo ticket thành công.", "success");
      } else if (formMode === "edit" && editingTicket) {
        const updated = await updateTicketFromForm(
          editingTicket.id,
          formValues
        );
        setItems((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        pushToast("Cập nhật ticket thành công.", "success");
      }
      setFormOpen(false);
      setEditingTicket(null);
      
    } catch (err) {
      if(err.message === "Cannot update a closed ticket"){
        pushToast("Không thể cập nhật ticket đã đóng.", "error");
      }
      console.error("Failed to submit ticket form", err);
      pushToast(
        formMode === "create"
          ? "Tạo ticket thất bại."
          : "Cập nhật ticket thất bại.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TicketLayout>
      <TicketToolbar
        total={total}
        status={statusFilter}
        onStatusChange={handleStatusChange}
        mineOnly={mineOnly}
        onMineChange={handleMineChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onAddNew={handleAddNew}
      />

      <TicketList items={items} onEdit={handleEditTicket} />

      <TicketLayout.Footer>
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading || !hasMore}
        >
          {loading ? "Loading..." : hasMore ? "Load More" : "No more tickets"}
        </button>
      </TicketLayout.Footer>

      <TicketForm
        open={formOpen}
        mode={formMode}
        initialValues={editingTicket}
        onCancel={() => {
          if (!submitting) {
            setFormOpen(false);
            setEditingTicket(null);
          }
        }}
        onSubmit={handleSubmitForm}
        currentUser={currentUser}
        isAdmin={isAdmin}
        assigneeOptions={assigneeOptions}
      />
    </TicketLayout>
  );
}
