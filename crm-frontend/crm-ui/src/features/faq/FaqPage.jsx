import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Faq.module.scss";

import FaqToolbar from "./FaqToolbar";
import FaqList from "./FaqList";
import FaqFormModal from "./FaqFormModal";
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from "./api";

const cx = classNames.bind(styles);

export default function FaqPage({ currentUser }) {
  const me =
    currentUser ||
    (() => {
      try {
        const raw = localStorage.getItem("me");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

  const isAdmin = me?.role === "ADMIN";

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const loadFaqs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFaqs();
      setFaqs(data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load FAQ list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => {
      const qText = (f.question || "").toLowerCase();
      const aText = (f.answer || "").toLowerCase();
      return qText.includes(q) || aText.includes(q);
    });
  }, [faqs, searchText]);

  const handleAddClick = () => {
    setEditingFaq(null);
    setModalVisible(true);
  };

  const handleEdit = (faq) => {
    if (!isAdmin) return;
    setEditingFaq(faq);
    setModalVisible(true);
  };

  const handleDelete = async (faq) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this FAQ?")) return;

    try {
      await deleteFaq(faq.id);
      setFaqs((prev) => prev.filter((x) => x.id !== faq.id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete FAQ");
    }
  };

  const handleSubmitFaq = async (values) => {
    if (editingFaq) {
      const updated = await updateFaq(editingFaq.id, values);
      setFaqs((prev) =>
        prev.map((x) => (x.id === editingFaq.id ? updated : x)),
      );
    } else {
      const created = await createFaq(values);
      setFaqs((prev) => [created, ...prev]);
    }
    setModalVisible(false);
    setEditingFaq(null);
  };

  return (
    <div className={cx("faq-page")}>
      <header className={cx("faq-header")}>
        <h1 className={cx("faq-title")}>FAQ</h1>
        <p className={cx("faq-subtitle")}>
          Can&apos;t find the answer you&apos;re looking for?{" "}
          <span className={cx("faq-subtitle-highlight")}>
            Contact your admin or support team for extra assistance.
          </span>
        </p>
      </header>

      <FaqToolbar
        searchText={searchText}
        onSearchChange={setSearchText}
        onAdd={handleAddClick}
        canCreate={isAdmin}
      />

      <FaqList
        items={filteredFaqs}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={isAdmin}
      />

      <FaqFormModal
        visible={modalVisible}
        initialValue={editingFaq}
        onCancel={() => {
          setModalVisible(false);
          setEditingFaq(null);
        }}
        onSubmit={handleSubmitFaq}
      />
    </div>
  );
}
