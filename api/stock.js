// api/stock.js
import { parseCsv } from "../utils/csv_parser.js";

export default async function handler(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ ok: false, msg: "key 없음" });
    }

    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    // ⭐ 유연 CSV 파서
    const { header, rows } = parseCsv(csvText);

    // 🔎 검색 필터: material, invoice, desc 모두 검색
    const list = rows.filter((r) =>
      Object.values(r).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(key.toLowerCase())
      )
    );

    return res.status(200).json({ ok: true, rows: list });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: "서버 오류",
      error: err.toString(),
    });
  }
}
