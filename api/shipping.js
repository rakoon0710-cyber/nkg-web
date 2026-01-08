// /api/shipping.js ??Stable Serverless Version (ìµœì¢…ë³?

export default async function handler(req, res) {
  try {
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

    // 1) CSV ?”ì²­
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error("CSV ?”ì²­ ?¤íŒ¨: " + resp.status);

    const text = await resp.text();
    const rows = parseCSV(text);

    if (!rows || rows.length <= 1) {
      return res.status(200).json({ ok: true, data: [] });
    }

    const bodyRows = rows.slice(1);
    const today = getTodayYMD();

    const result = [];

    // 2) ?°ì´???Œì‹±
    for (const r of bodyRows) {
      if (!r || r.length < 20) continue;

      const safe = (i) => clean(r[i] ?? "");

      const dateStr = safe(3);          // D?? ì¶œê³ ??
      const ymd = convertToYMD(dateStr);
      if (!ymd) continue;

      // ?¤ëŠ˜ ?´ì „ ì¶œê³  ?œì™¸
      if (ymd < today) continue;

      result.push({
        ymd,
        date: dateStr,           // ì¶œê³ ??
        invoice: safe(0),        // ?¸ë³´?´ìŠ¤
        country: safe(4),        // êµ??
        location: safe(16),      // ?ì°¨?„ì¹˜
        pallet: safe(18),        // ?Œë ˆ??
        time: safe(19),          // ?ì°¨?œê°„
        cbm: safe(11),           // CBM
        container: safe(9),      // ì»¨í…Œ?´ë„ˆ
        work: safe(15),          // ?‘ì—…?¬ë?
        type: safe(10),          // ? í˜•
      });
    }

    // 3) ? ì§œ ê¸°ì? ?•ë ¬ (ê¸°ë³¸)
    result.sort((a, b) => a.ymd - b.ymd);

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error("SHIPPING API ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
}

/* ============================================================
   ê³µí†µ ? í‹¸
============================================================ */

function parseCSV(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !inQuotes) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function clean(str) {
  return String(str || "")
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .trim();
}

function convertToYMD(dateStr) {
  if (!dateStr) return 0;
  const s = dateStr.replace(/\s+/g, "");
  const parts = s.split(".");
  if (parts.length !== 3) return 0;

  const y = parts[0];
  const m = parts[1].padStart(2, "0");
  const d = parts[2].padStart(2, "0");

  return Number(`${y}${m}${d}`);
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}
