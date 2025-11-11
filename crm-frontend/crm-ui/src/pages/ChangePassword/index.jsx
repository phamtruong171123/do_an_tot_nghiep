import React from "react";
import classNames from "classnames/bind";
import styles from "./ChangePassword.module.scss";

const cx = classNames.bind(styles);
const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:4000";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [show, setShow] = React.useState({ cur: false, nw: false, cf: false });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [ok, setOk] = React.useState("");
  const [done, setDone] = React.useState(false); //  flag đã đổi mật khẩu thành công

  const minLen = 6;
  const sameAsOld = newPassword && currentPassword && newPassword === currentPassword;
  const notMatch = newPassword && confirmPassword && newPassword !== confirmPassword;
  const tooShort = newPassword && newPassword.length < minLen;

  const canSubmit =
    currentPassword.trim() !== "" &&
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    !sameAsOld &&
    !notMatch &&
    !tooShort &&
    !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setOk("");

    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(`${API_BASE}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        throw new Error((isJson && (data?.message || data?.error)) || "Change password failed");
      }

      //  Thành công: xoá token & me, báo thành công + hiện link quay về login
      setOk("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      setDone(true);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("me");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Change password failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cx("page")}>
      <div className={cx("card")}>
        <h2 className={cx("title")}>Change password</h2>

        <form className={cx("form")} onSubmit={handleSubmit}>
          <label className={cx("field")}>
            <span className={cx("label")}>Current password</span>
            <div className={cx("inputWrap")}>
              <input
                type={show.cur ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={cx("input")}
                autoComplete="current-password"
                placeholder="Enter current password"
                disabled={done}
              />
              <button
                type="button"
                className={cx("eye")}
                onClick={() => setShow((s) => ({ ...s, cur: !s.cur }))}
                aria-label="Toggle current password"
                disabled={done}
              >
                <i className={`fa-solid ${show.cur ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </label>

          <label className={cx("field")}>
            <span className={cx("label")}>New password</span>
            <div className={cx("inputWrap")}>
              <input
                type={show.nw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={cx("input")}
                autoComplete="new-password"
                placeholder={`At least ${minLen} characters`}
                disabled={done}
              />
              <button
                type="button"
                className={cx("eye")}
                onClick={() => setShow((s) => ({ ...s, nw: !s.nw }))}
                aria-label="Toggle new password"
                disabled={done}
              >
                <i className={`fa-solid ${show.nw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            {!done && tooShort && <p className={cx("hint", "warn")}>Mật khẩu tối thiểu {minLen} ký tự.</p>}
            {!done && sameAsOld && <p className={cx("hint", "warn")}>Mật khẩu mới không được trùng mật khẩu cũ.</p>}
          </label>

          <label className={cx("field")}>
            <span className={cx("label")}>Confirm new password</span>
            <div className={cx("inputWrap")}>
              <input
                type={show.cf ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cx("input")}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                disabled={done}
              />
              <button
                type="button"
                className={cx("eye")}
                onClick={() => setShow((s) => ({ ...s, cf: !s.cf }))}
                aria-label="Toggle confirm password"
                disabled={done}
              >
                <i className={`fa-solid ${show.cf ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            {!done && notMatch && <p className={cx("hint", "warn")}>Xác nhận mật khẩu không khớp.</p>}
          </label>

          {error && <p className={cx("alert", "error")}>{error}</p>}
          {ok && <p className={cx("alert", "ok")}>{ok}</p>}

          <div className={cx("actions")}>
            <button
              type="submit"
              disabled={!canSubmit || done}
              className={cx("btn", { enabled: canSubmit && !done, loading })}
              aria-busy={loading ? "true" : "false"}
            >
              {loading ? "Processing..." : "Update password"}
            </button>

            {/*  Link quay về login */}
            {done && (
              <a href="/login" className={cx("linkLogin")}>
                Quay về trang đăng nhập
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
