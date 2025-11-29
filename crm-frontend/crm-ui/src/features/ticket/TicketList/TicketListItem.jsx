import React from "react";
import classNames from "classnames/bind";
import styles from "./TicketList.module.scss";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

import { fetchTicketNotes, createTicketNote, getNotesCount } from "../api";
import { useToast } from "../../../components/Toast";

const cx = classNames.bind(styles);

export default function TicketListItem({ item, onEdit }) {
  const {
    code,
    subject,
    customerName,
    dueAt,
    isOverdue,
    assigneeName,
    status,
    priority,
  } = item;

  
  const { pushToast } = useToast();
  const ticketId = item.id;


  // State cho notes
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [notes, setNotes] = React.useState(null); 
  const [loadingNotes, setLoadingNotes] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [adding, setAdding] = React.useState(false);



  const handleEdit = () => {
    onEdit && onEdit(item);
  };

  async function ensureNotesLoaded() {
    if (notes !== null || loadingNotes) return;
    try {
      setLoadingNotes(true);
      const data = await fetchTicketNotes(ticketId);
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notes", err);
      pushToast("Tải ghi chú thất bại.", "error");
    } finally {
      setLoadingNotes(false);
    }
  }


  const notesCount = notes ? notes.length : item.notesCount || 0;
  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setAdding(true);
      const created = await createTicketNote(ticketId, {
        content: noteText.trim(),
        isInternal: true,
      });
      setNoteText("");
      setNotes((prev) => (prev ? [created, ...prev] : [created]));
      pushToast("Đã thêm ghi chú.", "success");
    } catch (err) {
      console.error("Failed to create note", err);
      pushToast("Không thể thêm ghi chú.", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <tr>
      <td className={cx("code")}>{code}</td>
      <td className={cx("due")}>
        {dueAt ? (
          <span className={cx("duePill", { overdue: isOverdue })}>
            {new Date(dueAt).toLocaleDateString()}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className={cx("subject")}>
        <div className={cx("subjectMain")}>{subject}</div>
        {customerName && (
          <div className={cx("subjectSub")}>{customerName}</div>
        )}
      </td>
      <td className={cx("assignee")}>{assigneeName || "-"}</td>
      <td className={cx("status")}>
        <span className={cx("statusPill", status.toLowerCase())}>{status}</span>
      </td>
      <td className={cx("priority")}>
        <span className={cx("prioPill", priority.toLowerCase())}>
          {priority}
        </span>
      </td>
      <td className={cx("edit")}>
        <i
          className="fa-solid fa-pen-to-square"
          aria-hidden="true"
          onClick={handleEdit}
        />
      </td>

      {/* Cột Notes */}
      <td
        className={cx("colNotes")}
        onClick={(e) => e.stopPropagation()} // tránh trigger row
      >
        <Tippy
          visible={notesOpen}
          onClickOutside={() => setNotesOpen(false)}
          className={cx("noteTippy")}
          interactive
          maxWidth={420}
          placement="bottom"
          offset={[0, 8]}
          content={
            <div className={cx("notesPopup")}>
              <div className={cx("popupHeader")}>
                <span className={cx("popupTitle")}>
                  Notes for {code}
                </span>
                <button
                  type="button"
                  className={cx("popupClose")}
                  onClick={() => setNotesOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className={cx("popupBody")}>
                {loadingNotes && (
                  <div className={cx("notesEmpty")}>Đang tải…</div>
                )}

                {!loadingNotes &&
                  notes &&
                  notes.length === 0 && (
                    <div className={cx("notesEmpty")}>
                      Chưa có ghi chú nào.
                    </div>
                  )}

                {!loadingNotes && notes && notes.length > 0 && (
                  <div className={cx("notesList")}>
                    {notes.map((n) => (
                      <div key={n.id} className={cx("noteItem")}>
                        <div className={cx("noteMeta")}>
                          <span className={cx("noteAuthor")}>
                            
                            {n.authorName ||
                              (n.authorId
                                ? `User #${n.authorId}`
                                : "N/A")}
                          </span>
                          <span className={cx("noteTime")}>
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={cx("noteText")}>{n.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form className={cx("popupComposer")} onSubmit={handleAddNote}>
                <textarea
                  rows={3}
                  className={cx("popupTextarea")}
                  placeholder="Thêm ghi chú cho ticket…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className={cx("composerFooter")}>
                  <button
                    type="submit"
                    className={cx("saveBtn")}
                    disabled={adding || !noteText.trim()}
                  >
                    {adding ? "Đang lưu..." : "Lưu note"}
                  </button>
                </div>
              </form>
            </div>
          }
        >
          <button
            type="button"
            className={cx("notesTrigger")}
            title="Ghi chú ticket"
            onClick={async (e) => {
              e.stopPropagation();
              const next = !notesOpen;
              setNotesOpen(next);
              if (next) {
                await ensureNotesLoaded();
              }
            }}
          >
           <i class="fa-regular fa-note-sticky"></i>
           {/*  {notesCount > 0 && (
              <span className={cx("notesBadge")}>{notesCount}</span>
            )} */}
          </button>
        </Tippy>
      </td>
    </tr>
  );
}
