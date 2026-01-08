// /api/stock.js ??FINAL (?°ë„ ì¶”ì • ê¸ˆì?, ê³µë°± ?¬í•¨ ? ì§œ ?Œì‹± ê°•í™”)
// ??ì¶œê³ ?¼ì? ?ë³¸ ê·¸ë?ë¡??¬ìš© (?? "2025. 12. 01")
// ???„í„°/?•ë ¬?€ "?°ë„ ?¬í•¨ ? ì§œ"ë§??¸ì •
// ??MM/DD(?°ë„ ?†ìŒ)ë¡??´ë ¤?¤ëŠ” ?‰ì? ?œì™¸(ë¬´ê²°??? ì?)
// ???¤ëŠ˜ ?´ì „ ?œì™¸ + ??ì¶œê³ ??ê¸°ì? ?•ë ¬ + ???ˆì „ length

export default async function handler(req, res) {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ ok: false, msg: "ê²€???¤ê? ?†ìŠµ?ˆë‹¤." });
    }

    const searchKey = String(key).trim();
    const isNumericSearch = /^[0-9]+$/.test(searchKey); // ?«ìë©??ì¬ì½”ë“œ, ?„ë‹ˆë©?ë°•ìŠ¤
    const today = getTodayYMD();

    // ?“Œ SAP & WMS CSV URL
    const SAP_CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

    const WMS_CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

    // ======================
    // 1) SAP CSV ?½ê¸°
    // ======================
    const sapResp = await fetch(SAP_CSV_URL);
    if (!sapResp.ok) throw new Error("SAP CSV ?”ì²­ ?¤íŒ¨");
    const sapText = await sapResp.text();
    const sapRows = parseCSV(sapText).slice(1); // ?¤ë” ?œì™¸

    // ======================
    // 2) WMS CSV ?½ê¸°
    // ======================
    const wmsResp = await fetch(WMS_CSV_URL);
    if (!wmsResp.ok) throw new Error("WMS CSV ?”ì²­ ?¤íŒ¨");
    const wmsText = await wmsResp.text();
    const wmsRows = parseCSV(wmsText).slice(1);

    // ======================
    // 3) WMS ?…ê³ ?˜ëŸ‰ ë§??ì„± (keyFull ê¸°ì?)
    // ======================
    const wmsMap = new Map();
    for (const r of wmsRows) {
      if (!r || r.length < 5) continue;

      const keyFull = clean(r[0]); // ?¸ë³´?´ìŠ¤+?ì¬ì½”ë“œ
      const qty = toNumber(r[4]);

      if (keyFull) {
        wmsMap.set(keyFull, (wmsMap.get(keyFull) || 0) + qty);
      }
    }

    // ======================
    // 4) SAP + WMS ê²°í•© & ?„í„°ë§?
    // ======================
    const matched = [];

    for (const r of sapRows) {
      // work(r[18])ê¹Œì? ?°ë?ë¡?ìµœì†Œ 19ì¹??„ìš”
      if (!r || r.length < 19) continue;

      const keyFull = clean(r[0]);
      const invoice = clean(r[1]);
      const dateStr = clean(r[4]); // ì¶œê³ ??(?ë³¸ ê·¸ë?ë¡??€??

      // ???°ë„ ?¬í•¨ ? ì§œë§??Œì‹± (ê³µë°±/???˜ì´???¬ë˜???ˆìš©)
      const ymd = convertToYMD(dateStr);

      // ???°ë„ ?†ëŠ” ? ì§œ(MM/DD ?????œì™¸ (ë¬´ê²°??
      if (!ymd) continue;

      // ???¤ëŠ˜ ?´ì „ ì¶œê³  ?œì™¸
      if (ymd < today) continue;

      const country = clean(r[5]);
      const material = clean(r[6]);
      const desc = clean(r[7]);
      const outQty = toNumber(r[8]);
      const box = clean(r[9]);
      const work = clean(r[18]);

      // ê²€??ì¡°ê±´
      if (isNumericSearch) {
        if (material !== searchKey) continue;
      } else {
        if (box.toUpperCase() !== searchKey.toUpperCase()) continue;
      }

      const inQty = toNumber(wmsMap.get(keyFull));
      const diff = inQty - outQty;

      matched.push({
        keyFull,
        invoice,
        country,
        date: dateStr, // ???œì‹œ: ?ë³¸ ê·¸ë?ë¡?(?? "2025. 12. 1")
        material,
        box,
        desc,
        outQty,
        inQty,
        diff,
        work,
        _ymd: ymd, // ???•ë ¬???«ì
      });
    }

    // ??ì¶œê³ ??ê¸°ì? ?¤ë¦„ì°¨ìˆœ ?•ë ¬ (ë¹ ë¥¸ ? ì§œ ????? ? ì§œ)
    matched.sort((a, b) => a._ymd - b._ymd);

    // _ymd ?œê±°(?‘ë‹µ ê¹”ë”?˜ê²Œ)
    const data = matched.map(({ _ymd, ...rest }) => rest);

    return res.status(200).json({
      ok: true,
      rows: data.length,
      data,
    });
  } catch (err) {
    console.error("STOCK API ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

/* ====================================================================
   ê³µí†µ ? í‹¸
==================================================================== */

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

function toNumber(v) {
  const n = parseFloat(String(v || "").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * ???°ë„ ?¬í•¨ ? ì§œë§??ˆìš© (ê³µë°± ?¬í•¨ ê°•ë ¥ ì§€??
 * - "2025. 12. 1" / "2025.12.01" / "2025-12-1" / "2025/12/01" ëª¨ë‘ OK
 * - "12/01" ê°™ì? ?°ë„ ?†ëŠ” ê°’ì? 0 ë°˜í™˜ (?œì™¸)
 */
function convertToYMD(str) {
  if (!str) return 0;
  const s = String(str).trim();

  const m = s.match(/^(\d{4})\s*[.\-\/]\s*(\d{1,2})\s*[.\-\/]\s*(\d{1,2})$/);
  if (!m) return 0;

  const y = m[1];
  const mo = String(m[2]).padStart(2, "0");
  const d = String(m[3]).padStart(2, "0");

  const ymd = Number(`${y}${mo}${d}`);
  return Number.isFinite(ymd) ? ymd : 0;
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}
