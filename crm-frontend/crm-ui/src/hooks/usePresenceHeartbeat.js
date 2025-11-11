
import { useEffect } from "react";
import { apiPost } from "../lib/apiClient";

export default function usePresenceHeartbeat(intervalMs = 60000) {
  useEffect(() => {
    let t;
    const ping = async () => { try { await apiPost("/api/presence/ping", {}); } catch {} };
    const start = () => { ping(); t = setInterval(ping, intervalMs); };
    const stop  = () => { if (t) clearInterval(t); };

    const onVis = () => document.visibilityState === "visible" ? start() : stop();
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [intervalMs]);
}
