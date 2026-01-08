// /api/defect.js ??Stable Serverless Version (ÏµúÏ¢ÖÎ≥?

export default async function handler(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        ok: false,
        msg: "Í≤Ä????key)Í∞Ä ?ÜÏäµ?àÎã§. ?? /api/defect?key=775803",
      });
    }

    const invoiceKey = String(key).trim();
    const today = getTodayYMD();

    // SAP / WMS CSV URL
    const SAP_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

    const WMS_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

    // 1) SAP CSV
    const sapResp = await fetch(SAP_URL);
    if (!sapResp.ok) throw new Error("SAP CSV ?îÏ≤≠ ?§Ìå®");
    const sapText = await sapResp.text();
    const sapRows = parseCSV(sapText).slice(1);

    // 2) WMS CSV
    const wmsResp = await fetch(WMS_URL);
    if (!wmsResp.ok) throw new Error("WMS CSV ?îÏ≤≠ ?§Ìå®");
    const wmsText = await wmsResp.text();
    const wmsRows = parseCSV(wmsText).slice(1);

    // 3) WMS map ?ùÏÑ± (keyFull ???©Í≥Ñ?òÎüâ)
    const wmsMap = new Map();
    for (const r of wmsRows) {
      if (!r || r.length < 5) continue;
      const keyFull = clean(r[0]);
      if (!keyFull) continue;
      const qty = toNumber(r[4]);
      wmsMap.set(keyFull, (wmsMap.get(keyFull) || 0) + qty);
    }

    // 4) SAP + WMS Îß§Ïπ≠
    const result = [];

    for (const r of sapRows) {
      if (!r || r.length < 15) continue;

      const keyFull = clean(r[0]);  // ?∏Î≥¥?¥Ïä§ + ?êÏû¨ÏΩîÎìú
      const invoice = clean(r[1]);  // ?∏Î≥¥?¥Ïä§
      const dateStr = clean(r[4]);  // Ï∂úÍ≥†??
      const ymd = convertToYMD(dateStr);

      // ?∏Î≥¥?¥Ïä§ Î∂àÏùºÏπ?skip
      if (invoice !== invoiceKey) continue;

      // ?§Îäò ?¥Ï†Ñ Ï∂úÍ≥† ?úÏô∏
      if (ymd && ymd < today) continue;

      // SAP ?ÑÎìú??
      const country = clean(r[5]);
      const material = clean(r[6]);
      const desc = clean(r[7]);
      const outQty = toNumber(r[8]);
      const box = clean(r[9]);
      const cntr = clean(r[14]);
      const cbm = toNumber(r[19]);
      const loc = clean(r[22]);
      const note = clean(r[23]);
      const work = clean(r[18]);

      // WMS ?ÖÍ≥†?òÎüâ
      const inQty = toNumber(wmsMap.get(keyFull));
      const diff = inQty - outQty;

      result.push({
        keyFull,
        invoice,
        date: dateStr,
        country,
        material,
        desc,
        box,
        outQty,
        inQty,
        diff,
        cntr,
        cbm,
        loc,
        note,
        work,
      });
    }

    return res.status(200).json({
      ok: true,
      invoice: invoiceKey,
      rows: result.length,
      data: result,
    });
  } catch (err) {
    console.error("DEFECT API ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

/* ============================================================
   Í≥µÌÜµ ?†Ìã∏
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

  if (field || row.length > 0) {
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

function toNumber(v) {
  const n = parseFloat(String(v || "").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
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
