/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import classNames from "classnames/bind";
import styles from "./Login.module.scss";
import Input from "../../components/Input";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
const cx = classNames.bind(styles);

const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:4000";

export default function Login() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const canLogin = username.trim() !== "" && password.trim() !== "";

  async function handleLogin(e) {
    e.preventDefault();
    if (!canLogin || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

     
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("me", JSON.stringify(data.user));
      }

      // đi tiếp
      if (data.user.role === "admin") window.location.href = "/app/admin/dashboard";
      else if (data.user.role === "agent") window.location.href = "/app/agent/dashboard";
      else window.location.href = "/app/login";
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cx("page")}>
      <div className={cx("card")}>
        <h2 className={cx("title")}>Sign in</h2>

        <form className={cx("form")} onSubmit={handleLogin}>
          <Input
            label="Your username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <PasswordInput
            label="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={cx("error")}>{error}</p>}

          <Button
            type="submit"
            className={cx("loginBtn", { enabled: canLogin, loading })}
            disabled={!canLogin || loading}
            aria-busy={loading ? "true" : "false"}
          >
            {loading ? "..." : "Log in"}
          </Button>

          <p className={cx("note")}>
            By continuing, you agree to the <a href="#">Terms of use</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>

          
        </form>
      </div>
    </div>
  );
}
