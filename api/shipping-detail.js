// api/shipping-detail.js ??ì¶œê³  ?ì„¸?´ì—­ ìµœì ???ˆì •??

// ?•í™•??SAP & WMS CSV URL (?¤í? ?œê±°??ë²„ì „)
const SAP_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

const WMS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

export default async function handler(req, res) {
  try {
    /* ----------------------------------------------------
       1) invoice ?•ê·œ??
    ---------------------------------------------------- */
    let invoice = String(req.query.invoice || "").trim();
    invoice = invoice.replace(/[^0-9]/g, ""); // ?«ìë§??¬ìš©

    if (!invoice) {
      return res.status(400).json({ ok: false, msg: "invoice ê°’ì´ ?†ìŠµ?ˆë‹¤." });
    }

    /* ----------------------------------------------------
       2) CSV ?°ì´??ë¡œë“œ
    ---------------------------------------------------- */
    const [sapText, wmsText] = await Promise.all([
      (await fetch(SAP_CSV_URL)).text(),
      (await fetch(WMS_CSV_URL)).text(),
    ]);

    const sapRows = parseCSV(sapText).slice(1); // ?¤ë” ?œì™¸
    const wmsRows = parseCSV(wmsText).slice(1);

    /* ----------------------------------------------------
       3) WMS ??Map(keyFull ???…ê³ ?˜ëŸ‰ ?©ê³„)
    ---------------------------------------------------- */
    const wmsMap = new Map();

    for (const r of wmsRows) {
      const keyFull = clean(r[0]);
      if (!keyFull) continue;

      const qty = toNumber(r[4]); // WMS ?…ê³ ?˜ëŸ‰
      wmsMap.set(keyFull, (wmsMap.get(keyFull) || 0) + qty);
    }

    /* ----------------------------------------------------
       4) SAP ??invoice ?„í„° + ?ì„¸?´ì—­ êµ¬ì„±
    ---------------------------------------------------- */
    const result = [];

    for (const r of sapRows) {
      const keyFull = clean(r[0]); // A??
      const inv = clean(r[1]).replace(/[^0-9]/g, ""); // B??(?•ê·œ??

      if (inv !== invoice) continue; // ?¸ë³´?´ìŠ¤ ?„í„°

      const date = clean(r[4]);      // ì¶œê³ ??(E)
      const country = clean(r[5]);   // êµ??   (F)
      const code = clean(r[6]);      // ?ì¬ì½”ë“œ (G)
      const name = clean(r[7]);      // ?ì¬?´ì—­ (H)
      const outQty = toNumber(r[8]); // ì¶œê³ ?˜ëŸ‰ (I)
      const box = clean(r[9]);       // ë°•ìŠ¤ë²ˆí˜¸ (J)
      const work = clean(r[18]);     // ?‘ì—…?¬ë? (S)
      const container = clean(r[14]);// ì»¨í…Œ?´ë„ˆ (O)
      const cbm = clean(r[19]);      // CBM     (T)
      const note = clean(r[23]);     // ?¹ì´?¬í•­ (X)

      // WMS ?…ê³ ?˜ëŸ‰ ë§¤ì¹­
      const inQty = toNumber(wmsMap.get(keyFull));
      const diff = inQty - outQty;

      result.push({
        invoice,
        date,
        country,
        code,
        name,
        box,
        outQty,
        inQty,
        diff,
        container,
        cbm,
        work,
        note,
      });
    }

    return res.status(200).json({ ok: true, data: result });

  } catch (err) {
    console.error("SHIPPING-DETAIL API ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

/* ============================================================
   CSV ?Œì„œ (?•í™•??100%, ?°íŒŒ?¼ë„ ë¬¸ì œ ?†ìŒ)
============================================================ */
function parseCSV(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [], field = "", inside = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      if (inside && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inside = !inside;
      }
    } else if (c === "," && !inside) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !inside) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ============================================================
   ë¬¸ì???•ë¦¬
============================================================ */
function clean(str) {
  if (!str) return "";
  return String(str)
    .replace(/\uFEFF/g, "")
    .replace(/\n/g, " ")
    .trim();
}

/* ============================================================
   ?«ì ë³€??
============================================================ */
function toNumber(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}
