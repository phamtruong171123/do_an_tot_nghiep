export function formatLastActive(lastActivityAt) {
  if (!lastActivityAt) return null;

  const t = new Date(lastActivityAt);
  if (Number.isNaN(t.getTime())) return null;

  const diffMs = Date.now() - t.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
