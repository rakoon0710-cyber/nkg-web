// api/shipping.js — Auto Load Version

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

function clean(str) {
  return String(str || "").trim();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    const c = safeParse(row);

    const dateStr = clean(c[3]);
    const ymd = convertToYMD(dateStr);

    out.push({
      date: dateStr,
      ymd,
      invoice: clean(c[0]),
      country: clean(c[4]),
      container: clean(c[9]),
      type: clean(c[10]),
      cbm: clean(c[11]),
      work: clean(c[15]),
      location: clean(c[16]),
      pallet: clean(c[18]),
      time: clean(c[19]),
    });
  }

  return out;
}

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

function convertToYMD(str) {
  if (!str) return 0;
  const s = str.replace(/\s+/g, "");
  if (s.includes(".")) {
    const [y, m, d] = s.split(".");
    return Number(`${y}${m.padStart(2,"0")}${d.padStart(2,"0")}`);
  }
  return 0;
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return Number(`${y}${m}${day}`);
}
