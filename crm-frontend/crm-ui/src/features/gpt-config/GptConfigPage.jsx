import React, { useEffect, useState } from "react";
import PageLayout from "../../components/PageLayout";
import { fetchGptConfig, saveGptConfig, testGptConfig } from "./api";
import { useToast } from "../../components/Toast";
import styles from "./GptConfigPage.module.scss";

export default function GptConfigPage() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showSystemHelp, setShowSystemHelp] = useState(false);

  const [form, setForm] = useState({
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    temperature: 0.3,
    systemPrompt: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchGptConfig();
        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          baseUrl: res.baseUrl || prev.baseUrl,
          model: res.model || prev.model,
          temperature:
            typeof res.temperature === "number"
              ? res.temperature
              : prev.temperature,
          systemPrompt: res.systemPrompt || "",
          apiKey: res.apiKey || "", 
        }));
      } catch (e) {
        pushToast("Lỗi tải cấu hình GPT", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pushToast]);

  const updateField = (field) => (e) => {
    const value =
      field === "temperature" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        baseUrl: form.baseUrl,
        model: form.model,
        temperature: form.temperature,
        systemPrompt: form.systemPrompt,
      };
      if (form.apiKey && form.apiKey.trim() !== "") {
        payload.apiKey = form.apiKey.trim();
      }
      await saveGptConfig(payload);
      pushToast("Đã lưu thành công!", "success");
      setForm((prev) => ({ ...prev, apiKey: "" }));
    } catch (e) {
      pushToast("Lưu thât bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult("");
    try {
      const payload = {
        baseUrl: form.baseUrl,
        model: form.model,
        temperature: form.temperature,
        systemPrompt: form.systemPrompt,
      };
      if (form.apiKey && form.apiKey.trim() !== "") {
        payload.apiKey = form.apiKey.trim();
      }
      const res = await testGptConfig(payload);
      if (res.ok) {
        setTestResult(res.reply || "(Empty reply)");
        pushToast("Kết nối GPT thành công", "success");
      } else {
        setTestResult("Error: " + res.error);
        pushToast("Kết nối GPT thất bại", "error");
      }
    } catch (e) {
      setTestResult("Error: " + (e.message || String(e)));
      pushToast("Kết nối GPT thất bại", "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <PageLayout title="GPT Settings">Loading...</PageLayout>;
  }

  return (
    <PageLayout
      title="GPT Settings"
      subtitle="Configure GPT key, model and default behavior for the system."
      actions={
        <div className={styles.actions}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? "Testing..." : "Test GPT"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className={styles.root}>
        {/* Card form */}
        <div className={`card ${styles.formCard}`}>
          <div className={`card-body ${styles.formBody}`}>
            {/* API KEY */}
            <div className={styles.formRow}>
              <div className={styles.labelRow}>
                <label className={styles.label}>API Key</label>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowApiHelp((v) => !v)}
                  title="Hướng dẫn lấy API key"
                >
                  <i className="fa-regular fa-circle-question" />
                </button>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type={showApiKey ? "text" : "password"}
                  className={styles.input}
                  value={form.apiKey}
                  onChange={updateField("apiKey")}
                  placeholder="Enter new key to update"
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowApiKey((v) => !v)}
                  title={showApiKey ? "Hide API key" : "Show API key"}
                >
                  <i
                    className={
                      showApiKey ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                    }
                  />
                </button>
              </div>

              {showApiHelp && (
                <>
                  <span className={styles.hint}>
                    Bạn có thể tạo OpenAI API key tại{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      trang API keys của OpenAI
                    </a>
                    . Sao chép secret key dạng <code>sk-...</code> rồi dán vào ô
                    này.
                  </span>
                  <span className={styles.hint}>
                    Để trống nếu bạn không muốn thay đổi API key hiện tại.
                  </span>
                </>
              )}
            </div>

            {/* BASE URL */}
            <div className={styles.formRow}>
              <label className={styles.label}>Base URL</label>
              <input
                type="text"
                className={styles.input}
                value={form.baseUrl}
                onChange={updateField("baseUrl")}
              />
            </div>

            {/* MODEL */}
            <div className={styles.formRow}>
              <label className={styles.label}>Model</label>
              <input
                type="text"
                className={styles.input}
                value={form.model}
                onChange={updateField("model")}
                placeholder="gpt-4.1-mini, gpt-4.1, ..."
              />
            </div>

            {/* TEMPERATURE */}
            <div className={styles.formRow}>
              <label className={styles.label}>Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className={styles.input}
                value={form.temperature}
                onChange={updateField("temperature")}
              />
            </div>

            {/* SYSTEM PROMPT */}
            <div className={styles.formRow}>
              <div className={styles.labelRow}>
                <label className={styles.label}>System Prompt (optional)</label>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowSystemHelp((v) => !v)}
                  title="Giải thích System Prompt"
                >
                  <i className="fa-regular fa-circle-question" />
                </button>
              </div>

              {showSystemHelp && (
                <span className={styles.hint}>
                  Đây là “vai trò cố định” (system prompt) cho GPT. Ví dụ, trong
                  hàm sinh câu trả lời từ FAQ, nó sẽ thay cho đoạn:{" "}
                  <code>
                    "Bạn là nhân viên chăm sóc khách hàng. Hãy trả lời trực tiếp
                    cho khách bằng tiếng Việt, lịch sự, ngắn gọn..."
                  </code>
                  . Các request AI trong hệ thống có thể dùng nội dung này làm
                  lời dặn chung.
                </span>
              )}

              <textarea
                rows={4}
                className={styles.textarea}
                value={form.systemPrompt}
                onChange={updateField("systemPrompt")}
                placeholder="Ví dụ: Bạn là nhân viên chăm sóc khách hàng, trả lời ngắn gọn, lịch sự, không bịa thông tin..."
              />
            </div>
          </div>
        </div>

        
      </div>
    </PageLayout>
  );
}
