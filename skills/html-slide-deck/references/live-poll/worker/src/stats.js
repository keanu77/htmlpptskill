// 純函式統計，方便在 Node 直接測試（npm test）。
// 中位數：輸入需已由小到大排序；偶數筆取中間兩筆平均，沒有資料回傳 null。
export function median(sorted) {
  const n = sorted.length, mid = n >> 1;
  if (!n) return null;
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
