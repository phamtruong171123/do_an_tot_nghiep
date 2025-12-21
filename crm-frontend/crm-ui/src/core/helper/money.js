export function calcGoodsAmount(unitPrice, quantity) {
  const up = Number(unitPrice);
  const q = Number(quantity);
  if (!Number.isFinite(up) || !Number.isFinite(q)) return null;
  return up * q;
}
