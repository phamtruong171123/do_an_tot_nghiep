import React from "react";
import { MOCK_TICKETS } from "./mock";
import TicketLayout from "./TicketLayout";
import TicketToolbar from "./TicketToolbar";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";

export default function TicketPage() {
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [mineOnly, setMineOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState("DUE_DATE");
  const [searchText, setSearchText] = React.useState("");
  const [items, setItems] = React.useState(MOCK_TICKETS);

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create"); // "create" | "edit"
  const [editingTicket, setEditingTicket] = React.useState(null);

  const currentAgentName = "Agent 1"; // tạm mock

  const filtered = React.useMemo(() => {
    let items = [...MOCK_TICKETS];

    if (statusFilter !== "ALL") {
      items = items.filter((t) => t.status === statusFilter);
    }

    if (mineOnly) {
      items = items.filter((t) => t.assigneeName === currentAgentName);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          (t.customerName || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "DUE_DATE") {
      items.sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt) - new Date(b.dueAt);
      });
    } else {
      items.sort((a, b) => (a.code < b.code ? 1 : -1));
    }

    return items;
  }, [statusFilter, mineOnly, sortBy, searchText]);

  const handleAddNew = () => {
    setFormMode("create");
    setEditingTicket(null);
    setFormOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setFormMode("edit");
    setEditingTicket(ticket);
    setFormOpen(true);
  };

  const handleSubmitForm = (payload) => {
    if (formMode === "create") {
      const newTicket = {
        id: String(Date.now()),
        code: "TCK-" + Date.now(), // mock
        ...payload,
        isOverdue: false, // tạm
      };
      setItems((prev) => [newTicket, ...prev]);
    } else if (editingTicket) {
      setItems((prev) =>
        prev.map((t) => (t.id === editingTicket.id ? { ...t, ...payload } : t))
      );
    }
    setFormOpen(false);
  };


  

  return (
    <TicketLayout>
      <TicketToolbar
        total={items.length}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        mineOnly={mineOnly}
        onMineChange={setMineOnly}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onAddNew={handleAddNew}
        
      />

      <TicketList items={filtered} onEdit={handleEditTicket} />

      <TicketLayout.Footer>
        <button className='btn-loadmore' type="button">
          Load More
        </button>
      </TicketLayout.Footer>

      <TicketForm
        open={formOpen}
        mode={formMode}
        initialValues={editingTicket}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
      />
    </TicketLayout>
  );
}
