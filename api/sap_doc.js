// api/sap_doc.js
import { loadCsv } from "../lib/_csv.js";

const SAP_DOC_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

/**
 * ?¸ë³´?´ìŠ¤ ë²ˆí˜¸ ?•ê·œ??
 * - ?«ìë§?ì¶”ì¶œ
 * - ??0 ?œê±°
 */
function normalizeInv(v) {
  if (!v) return "";
  return v.toString().replace(/[^0-9]/g, "").replace(/^0+/, "");
}

export default async function handler(req, res) {
  const { inv } = req.query;

  if (!inv) {
    return res.status(200).json({ ok: false, message: "?¸ë³´?´ìŠ¤ê°€ ?†ìŠµ?ˆë‹¤." });
  }

  try {
    const rows = await loadCsv(SAP_DOC_URL);
    const target = normalizeInv(inv);

    let found = null;

    for (const r of rows) {
      const inv1 = normalizeInv(r["?¸ë³´?´ìŠ¤"]);
      const docNo = normalizeInv(r["ë¬¸ì„œë²ˆí˜¸"]);
      if (inv1 === target || docNo === target) {
        found = r;
        break;
      }
    }

    if (!found) {
      return res.status(200).json({
        ok: false,
        message: `?¸ë³´?´ìŠ¤(${inv})ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.`,
      });
    }

    return res.status(200).json({
      ok: true,
      data: found,
    });
  } catch (err) {
    console.error("SAP_DOC ERROR:", err);
    return res.status(200).json({
      ok: false,
      message: "SAP ë¬¸ì„œ ì¡°íšŒ ?¤ë¥˜",
      error: err.message,
    });
  }
}
