import { loadCsv } from "../lib/_csv.js";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

export default async function handler(req, res) {
  const { mat, inv } = req.query;

  try {
    const rows = await loadCsv(CSV_URL);

    let result = rows;

    if (mat) result = result.filter(r => r["?ì¬ë²ˆí˜¸"] === mat);
    if (inv) result = result.filter(r => r["?¸ë³´?´ìŠ¤"] === inv);

    return res.status(200).json({
      ok: true,
      data: result
    });

  } catch (err) {
    res.status(200).json({ ok: false, message: err.message });
  }
}
