// api/barcode_table.js
import { loadCsv } from "../lib/_csv.js";

const BARCODE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1454119997&single=true&output=csv";

export default async function handler(req, res) {
  try {
    const rows = await loadCsv(BARCODE_URL);

    const list = rows.map(r => ({
      mat: (r["?�재번호"] || "").trim(),
      box: (r["박스번호"] || "").trim(),
      name: (r["?�재?�역"] || "").trim(),
      barcode: (r["바코??] || "").trim(),
    }));

    return res.status(200).json({ ok: true, list });
  } catch (err) {
    console.error("BARCODE_TABLE ERROR:", err);
    return res.status(200).json({
      ok: false,
      message: "바코???�이�?조회 ?�류",
      error: err.message,
    });
  }
}
