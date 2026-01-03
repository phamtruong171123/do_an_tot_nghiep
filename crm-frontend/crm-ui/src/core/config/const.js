export const SEGMENT_LABEL = {
  VIP: "VIP",
  ACTIVE: "Active",
  NEW: "New",
  POTENTIAL: "Potential",
  DROPPED: "Dropped",
  SPAM: "Spam",
};

export const SEGMENTS_BY_PRIORITY = ["VIP", "ACTIVE", "NEW", "POTENTIAL", "DROPPED", "SPAM"];

export function normalizeSegment(value) {
  if (!value) return "POTENTIAL";
  const s = String(value).toUpperCase();
  return SEGMENT_LABEL[s] ? s : "POTENTIAL";
}
