export function normalizeDate(str) {
  if (!str) return "-";

  str = str.replace(/[^\d]/g, ""); // 숫자 제외 제거

  // 8자리: YYYYMMDD
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6)}`;
  }

  // 6자리: YYMMDD → 20YY
  if (str.length === 6) {
    return `20${str.slice(0, 2)}-${str.slice(2, 4)}-${str.slice(4)}`;
  }

  return "-";
}
