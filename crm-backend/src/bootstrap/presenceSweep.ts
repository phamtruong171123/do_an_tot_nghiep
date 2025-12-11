import { markOfflineIfExpired } from "../modules/presence/presence.service";
export function bootPresenceSweep() {
  setInterval(() => {
    markOfflineIfExpired().catch(() => {});
  }, 60 * 1000); // mỗi 60s
}
