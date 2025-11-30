// netlify/functions/defect.js
const TZ_OFFSET = 9 * 60 * 60 * 1000; // 한국 시간 기준

exports.handler = async function (event, context) {
  try {
    const today = new Date(Date.now() + TZ_OFFSET);
    today.setHours(0, 0, 0, 0);

    const keyInput = event.queryStringParameters.key || "";
    if (!keyInput) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, msg: "EMPTY_KEY" })
      };
    }

    const CSV_SAP =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

    const CSV_WMS =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

    // CSV fetch + parsing
    async function fetchCsv(url) {
      const response = await fetch(url);
      const text = await response.text();
      return parseCsv(text);
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let field = "";
      let inside = false;

      text = text.replace(/\r/g, "");

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
      row.push(field);
      rows.push(row);
      return rows;
    }

    // Load SAP + WMS
    const sap = await fetchCsv(CSV_SAP);
    const wms = await fetchCsv(CSV_WMS);

    // Build WMS map
    const wmsMap = new Map();
    for (const r of wms.slice(1)) {
      const key = String(r[0] || "").trim();
      const v = parseFloat(String(r[4] || "").replace(/,/g, "")) || 0;
      if (key) wmsMap.set(key, v);
    }

    const key10 = keyInput.padStart(10, "0");
    const result = [];

    // SAP filtering
    for (const r of sap.slice(1)) {
      const A = String(r[0] || "").trim();
      const no = r[21];
      const G = r[6];
      const box = r[9];
      const desc = r[7];
      const outQty = parseFloat(String(r[8] || "").replace(/,/g, "")) || 0;

      const country = r[5];
      const date = r[4];
      const cntr = r[14];
      const cbm = parseFloat(r[19] || 0);
      const loc = r[22];
      const note = r[23];
      const work = r[18];

      if (date) {
        const d = new Date(date);
        const local = new Date(d.getTime() + TZ_OFFSET);
        local.setHours(0, 0, 0, 0);
        if (local < today) continue;
      }

      const base = A.split(" ")[0];

      if (base === key10 || base.endsWith(keyInput)) {
        const inQty = wmsMap.get(A) || 0;

        result.push({
          keyFull: A,
          no,
          material: G,
          box,
          desc,
          outQty,
          inQty,
          diff: inQty - outQty,

          country,
          date,
          cntr,
          cbm,
          loc,
          note,
          work
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, rows: result }),
      headers: { "Access-Control-Allow-Origin": "*" }
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
      headers: { "Access-Control-Allow-Origin": "*" }
    };
  }
};
