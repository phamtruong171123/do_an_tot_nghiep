// src/pages/admin/UserManagement/index.jsx
import { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import styles from "./UserManagement.module.scss";
import { apiGet, apiPost, apiPut, apiDelete } from "./../../lib/apiClient";

const cx = classNames.bind(styles);

const ROLES = ["ADMIN", "AGENT"];
const STATUSES = ["ACTIVE", "INACTIVE"];


function timeAgo(d) {
  if (!d) return "N/A";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}



export default function UserManagement() {
  // data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filter UI
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("createdAt:desc");

  // selection
  const [selected, setSelected] = useState(() => new Set());
  const isSelected = (id) => selected.has(id);
  const toggleOne = (id) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleAll = (ids) =>
    setSelected((prev) => {
      const s = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => s.has(id));
      if (all) ids.forEach((id) => s.delete(id));
      else ids.forEach((id) => s.add(id));
      return s;
    });

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    role: "AGENT",
    status: "ACTIVE",
  });
  const [formErr, setFormErr] = useState("");

  // toasts

  const [toasts, setToasts] = useState([]);
  function pushToast(message, type = "success", ttl = 3000) {
  const id = Date.now() + Math.random();
  setToasts((ts) => [...ts, { id, type, message }]);
  // auto dismiss
  setTimeout(() => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, ttl);
}

    // Tự refresh để cập nhật online / lastOnlineAt
const [refreshTick, setRefreshTick] = useState(0);
useEffect(() => {
  const t = setInterval(() => setRefreshTick((x) => x + 1), 25000);
  return () => clearInterval(t);
}, []);

function dismissToast(id) {
  setToasts((ts) => ts.filter((t) => t.id !== id));
}


  // fetch list
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (roleFilter !== "All") params.set("role", roleFilter);
        if (statusFilter !== "All") params.set("status", statusFilter);
        if (sort) params.set("sort", sort);

        const data = await apiGet(`/api/users?${params.toString()}`, { signal: ctrl.signal });
        setUsers(Array.isArray(data.items) ? data.items : []);
        setSelected(new Set());
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Load failed");
        pushToast(e.message || "Tải thất bại.", "error");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [query, roleFilter, statusFilter, sort, refreshTick]);

  const list = useMemo(() => users, [users]);
  const pageIds = useMemo(() => list.map((x) => x.id), [list]);

 
  async function createUserApi(payload) {
     return apiPost("/api/users", payload);
  }
  async function updateUserApi(id, payload) {
     return apiPut(`/api/users/${id}`, payload);
   
  }
  async function deleteUserApi(id) {
     await apiDelete(`/api/users/${id}`);
     pushToast("Xoá người dùng thành công.");
   
  }
  async function batchRoleApi(ids, role) {
    await apiPost("/api/users/batch", { action: "setRole", ids, data: { role } });
    pushToast("Cập nhật vai trò thành công.");
   
  }

  function openCreate() {
    setEditingId(null);
    setForm({ username: "", email: "", role: "AGENT", status: "ACTIVE",fullName:"" });
    setFormErr("");
    setOpen(true);
  }
  function openEdit(u) {
    setEditingId(u.id);
    setForm({
      username: u.username || "",
      email: u.email || "",
      role: u.role || "AGENT",
      status: u.status || "ACTIVE",
      fullName: u.fullName || "",
    });
    setFormErr("");
    setOpen(true);
  }
  async function remove(id) {
    if (!window.confirm("Delete this user?")) return;
    const prev = users;
    setUsers((u) => u.filter((x) => x.id !== id));
    setSelected((s) => {
      const t = new Set(s);
      t.delete(id);
      return t;
    });
    try {
      await deleteUserApi(id);
    } catch {
      setUsers(prev);
      alert("Delete failed");
    }
  }
  async function save(e) {
    e.preventDefault();
    setFormErr("");
    if (!form.username || !form.email) {
      setFormErr("Username và Email là bắt buộc.");
      return;
    }
    try {
      if (editingId) {
        const updated = await updateUserApi(editingId, form);
        setUsers((u) => u.map((x) => (x.id === editingId ? { ...x, ...updated } : x)));
        pushToast("Cập nhật người dùng thành công.");
      } else {
        const created = await createUserApi(form);
        setUsers((u) => [created, ...u]);
        pushToast("Tạo người dùng mới thành công.");
      }
      setOpen(false);
    } catch (e2) {
      setFormErr(e2.message || "Save failed");
       pushToast(e2.message || "Lưu thất bại.", "error");
    }
  }

  // bulk
  async function bulkDelete() {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} user(s)?`)) return;
    const ids = Array.from(selected);
    const prev = users;
    setUsers((u) => u.filter((x) => !ids.includes(x.id)));
    setSelected(new Set());
    try {
       await apiPost("/api/users/batch", { action: "delete", ids });
       pushToast("Xoá người dùng thành công.");
    } catch {
      setUsers(prev);
      alert("Delete failed");
      pushToast("Xoá thất bại.", "error");
    }
  }
  async function bulkSetRole(role) {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const prev = users;
    setUsers((u) => u.map((x) => (ids.includes(x.id) ? { ...x, role } : x)));
    setSelected(new Set());
    try {
      await batchRoleApi(ids, role);
      pushToast("Cập nhật vai trò thành công.");
    } catch {
      setUsers(prev);
      alert("Update role failed");
      pushToast("Cập nhật vai trò thất bại.", "error");
    }
  }

  return (
    <div className={cx("wrap")}>
      <div className={cx("header")}>
        <h2>User Management</h2>
        <div className={cx("actions")}>
          <button className={cx("primary")} onClick={openCreate}>+ New User</button>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className={cx("toolbar")}>
        <input
          className={cx("search")}
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={cx("select")} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option>All</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className={cx("select")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={cx("select")} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="username:asc">Name A→Z</option>
          <option value="username:desc">Name Z→A</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className={cx("bulkBar")}>
          <span>{selected.size} selected</span>
          <button onClick={bulkDelete} className={cx("link", "danger")}>Delete</button>
          <div className={cx("sep")} />
          <span>Set role:</span>
          {ROLES.map((r) => (
            <button key={r} onClick={() => bulkSetRole(r)} className={cx("link")}>{r}</button>
          ))}
          <div className={cx("spacer")} />
          <button onClick={() => setSelected(new Set())} className={cx("link")}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className={cx("table")}>
        <div className={cx("thead")}>
          <div className={cx("th", "wCheck")}>
            <input
              type="checkbox"
              onChange={() => toggleAll(pageIds)}
              checked={pageIds.length > 0 && pageIds.every((id) => selected.has(id))}
              ref={(el) => {
                if (!el) return;
                const some = pageIds.some((id) => selected.has(id));
                const all = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
                el.indeterminate = !all && some;
              }}
            />
          </div>
          <div className={cx("th")}>Username</div>
          <div className={cx("th")}>Email</div>
          <div className={cx("th")}>Role</div>
          <div className={cx("th")}>Status</div>
          <div className={cx("th")}>Activity</div>
        
          <div className={cx("th", "wActions")}>Actions</div>
        </div>

        {loading && <div className={cx("empty")}>Loading…</div>}
        {err && !loading && <div className={cx("empty")}>Error: {err}</div>}

        {!loading && !err && list.map((u) => (
          <div key={u.id} className={cx("row")}>
            <div className={cx("td", "wCheck")}>
              <input type="checkbox" checked={isSelected(u.id)} onChange={() => toggleOne(u.id)} />
            </div>
            <div className={cx("td")}>{u.username}</div>
            <div className={cx("td")}>{u.email}</div>
            <div className={cx("td")}>
              <span className={cx("badge", (u.role || "").toLowerCase())}>{u.role}</span>
            </div>
            <div className={cx("td")}>
              <span className={cx("badge", (u.status || "").toLowerCase())}>{u.status}</span>
            </div>
            <div className={cx("td")}>
                {u.agentProfile?.online ? (
                    <span className={cx("badge", "online")}>Online</span>
                ) : (
                    <span className={cx("muted")}>{timeAgo(u.agentProfile?.lastOnlineAt)}</span>
                )}
            </div>

            
            <div className={cx("td", "wActions")}>
              <button className={cx("link")} onClick={() => openEdit(u)}>
                <i className="fa fa-edit" /> 
              </button>
              <button className={cx("link", "danger")} onClick={() => remove(u.id)}>
                <i className="fa fa-trash" /> 
              </button>
            </div>
          </div>
        ))}

        {!loading && !err && !list.length && <div className={cx("empty")}>No users found.</div>}
      </div>

      {/* Modal create/edit */}
      {open && (
        <div className={cx("modalBackdrop")} onClick={() => setOpen(false)}>
          <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit user" : "New user"}</h3>
            <form className={cx("form")} onSubmit={save}>
              <label className={cx("field")}>
                <span className={cx("label")}>Username</span>
                <input
                  className={cx("input")}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </label>
              <label className={cx("field")}>
                <span className={cx("label")}>Password</span>
                <input
                  className={cx("input")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
              <label className={cx("field")}>
                <span className={cx("label")}>Email</span>
                <input
                  type="email"
                  className={cx("input")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className={cx("field")}>
                <span className={cx("label")}>FullName</span>
                <input
                  
                  className={cx("input")}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </label>
              <label className={cx("field")}>
                <span className={cx("label")}>Role</span>
                <select
                  className={cx("input")}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
             

              {formErr && <div className={cx("error")}>{formErr}</div>}

              <div className={cx("modalActions")}>
                <button type="button" className={cx("btn")} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={cx("btn", "primary")}>
                  {editingId ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={cx("toasts")} style={{ top:50}} aria-live="polite" aria-atomic="true">
  {toasts.map((t) => (
    <div key={t.id} className={cx("toast", t.type)}>
      <span className={cx("toastMsg")}>{t.message}</span>
      <button
        className={cx("toastClose")}
        onClick={() => dismissToast(t.id)}
        aria-label="Close"
        title="Close"
      >
        ×
      </button>
    </div>
  ))}
</div>
    </div>
  );
}
