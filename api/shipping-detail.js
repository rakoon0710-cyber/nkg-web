export default async function handler(req, res) {
  try {
    const { invoice } = req.query;
    if (!invoice) return res.json({ ok: false, msg: "invoice 필요" });

    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1454119997&single=true&output=csv";

    const resp = await fetch(CSV_URL);
    const text = await resp.text();

    const rows = parseCSV(text);
    const body = rows.slice(1);

    const result = body
      .filter(r => clean(r[1]) === invoice)  // B열 = 인보이스
      .map(r => ({
        code: clean(r[2]),      // 자재코드
        box: clean(r[3]),       // 박스번호
        name: clean(r[4]),      // 자재명
        outQty: clean(r[5]),    // 출고
        inQty: clean(r[6]),     // 입고
        note: clean(r[7]),      // 비고
        action: clean(r[8])     // 작업
      }));

    return res.json({ ok: true, data: result });

  } catch (e) {
    return res.json({ ok: false, msg: e.message });
  }
}


// CSV 파서
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

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function clean(str) {
  return String(str).replace(/\uFEFF/g, "").trim();
}
