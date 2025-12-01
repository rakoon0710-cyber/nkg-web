// api/shipping.js — Final Stable Version

export default async function handler(req, res) {
  try {
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

    const text = await fetch(CSV_URL).then(r => r.text());
    const rows = parseCSV(text);

    const todayYmd = getTodayYMD();

    const filtered = rows.filter(r => r.ymd >= todayYmd);
    filtered.sort((a, b) => a.ymd - b.ymd);

    return res.status(200).json({ ok: true, data: filtered });

  } catch (err) {
    return res.status(500).json({ ok: false, msg: err.message });
  }
}


// -------------------- CSV 파싱 --------------------
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    const c = safeParse(row);
    const safe = (idx) => (c[idx] !== undefined ? clean(c[idx]) : "");

    const dateStr = safe(3);
    const ymd = convertToYMD(dateStr);

    out.push({
      ymd,
      date:      safe(3),
      invoice:   safe(0),
      country:   safe(4),
      location:  safe(16),
      pallet:    safe(18),
      time:      safe(19),
      cbm:       safe(11),
      container: safe(9),
      work:      safe(15),
      type:      safe(10),
    });
  }

  return out;
}


// -------------------- CSV 안전 파서 --------------------
function safeParse(row) {
  let out = [], cur = "", inside = false;

  for (let c of row) {
    if (c === '"' && inside) inside = false;
    else if (c === '"' && !inside) inside = true;
    else if (c === "," && !inside) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);

  return out;
}


// -------------------- 날짜 변환 완전 안정 버전 --------------------
function convertToYMD(str) {
  if (!str) return 0;

  const s = String(str).trim();

  const match = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!match) return 0;

  const y = match[1];
  const m = match[2].padStart(2, "0");
  const d = match[3].padStart(2, "0");

  return Number(`${y}${m}${d}`);
}


// -------------------- 기타 유틸 --------------------
function clean(str) {
  if (!str) return "";
  return String(str)
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}
