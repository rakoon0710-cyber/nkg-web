// api/barcode_lookup.js
import { loadCsv } from "../lib/_csv.js";

const BARCODE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1454119997&single=true&output=csv";

/*
바코??CSV ?�더 (?�약)
(�? (�? (�? ?�재번호 박스번호 ?�재?�역 바코???�수???�통기한 ...
??loadCsv ?�서???�제�?
"?�재번호", "박스번호", "?�재?�역", "바코??, ...
�??�용
*/

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(200).json({ ok: false, message: "바코?��? ?�습?�다." });
  }

  try {
    const rows = await loadCsv(BARCODE_URL);

    const hit = rows.find(
      r => (r["바코??] || "").trim() === code.trim()
    );

    if (!hit) {
      return res.status(200).json({
        ok: false,
        message: "바코??목록???�는 코드?�니??",
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        mat: hit["?�재번호"] || "",
        box: hit["박스번호"] || "",
        name: hit["?�재?�역"] || "",
        barcode: hit["바코??] || "",
      },
    });

  } catch (err) {
    console.error("BARCODE_LOOKUP ERROR:", err);
    return res.status(200).json({
      ok: false,
      message: "바코??조회 ?�류",
      error: err.message,
    });
  }
}
