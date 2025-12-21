
export function formatNumber(value) {
  const digits = String(value ?? "")
    .replaceAll(".", "")
    .replace(/[^\d]/g, ""); // chỉ giữ số

  if (digits === "") return "";

  // bỏ 0 đầu
  const normalized = digits.replace(/^0+(?=\d)/, "");

  // thêm dấu chấm mỗi 3 số
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


export function convertStringToNumber(value) {
  const digits = String(value ?? "")
    .replaceAll(".", "")
    .replace(/[^\d]/g, "");

  if (digits === "") return null;


  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}
