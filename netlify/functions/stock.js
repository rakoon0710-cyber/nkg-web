// stock.js (Netlify Serverless Function)
// 한국 시간 설정
const TZ_OFFSET = 9 * 60 * 60 * 1000;

exports.handler = async function (event, context) {
  try {
    // 오늘 날짜(한국 기준)
    const today = new Date(Date.now() + TZ_OFFSET);
    today.setHours(0, 0, 0, 0);

    // Google Sheets CSV URL
    const CSV_SAP =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

    const CSV_WMS =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

    //------------------------------------------
    // CSV 다운로드 → 정밀 파싱
    //------------------------------------------
    async function fetchCsv(url) {
      const response = await fetch(url);
      const text = await response.text();
      return parseCsvPrecise(text);
    }

    function parseCsvPrecise(text) {
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

    //------------------------------------------
    // 실제 CSV 데이터 불러오기
    //------------------------------------------
    const sap = await fetchCsv(CSV_SAP);
    const wms = await fetchCsv(CSV_WMS);

    //------------------------------------------
    // WMS 데이터 맵 구성 (인보이스+자재코드 = 입고수량)
    //------------------------------------------
    const wmsMap = new Map();
    for (const r of wms.slice(1)) {
      const key = String(r[0] || "").trim();
      const v = parseFloat(String(r[4] || "").replace(/,/g, "")) || 0;
      if (key) wmsMap.set(key, v);
    }

    //------------------------------------------
    // 클라이언트가 입력한 조회 키
    //------------------------------------------
    const query = event.queryStringParameters;
    const keyInput = query.key ? query.key.trim() : "";

    if (!keyInput) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, msg: "EMPTY_KEY" })
      };
    }

    const isNum = /^[0-9]+$/.test(keyInput);
    const keyUpper = keyInput.toUpperCase();

    //------------------------------------------
    // SAP 데이터에서 매칭 + 날짜 필터(오늘 이전 제외)
    //------------------------------------------
    const result = [];

    for (const r of sap.slice(1)) {
      const A = String(r[0] || "").trim();
      const B = String(r[1] || "").trim();
      const E = String(r[4] || "").trim(); // 출고일 (문자)
      const F = String(r[5] || "").trim(); // 국가
      const G = String(r[6] || "").trim(); // 자재코드
      const H = String(r[7] || "").trim(); // 자재내역
      const I = String(r[8] || "").trim(); // 출고
      const J = String(r[9] || "").trim(); // 박스번호

      // 날짜 필터
      if (E) {
        const dateObj = new Date(E);
        if (!isNaN(dateObj.getTime())) {
          const local = new Date(dateObj.getTime() + TZ_OFFSET);
          local.setHours(0, 0, 0, 0);
          if (local < today) continue; // ★ 오늘 이전 제외
        }
      }

      let match = false;
      if (isNum && G === keyInput) match = true;
      if (!isNum && J === keyUpper) match = true;

      if (match) {
        const inQty = wmsMap.get(A) || 0;
        const outQty = parseFloat(I.replace(/,/g, "")) || 0;

        result.push({
          keyFull: A,
          invoice: B,
          country: F,
          date: E,
          material: G,
          box: J,
          desc: H,
          outQty,
          inQty,
          diff: inQty - outQty
        });
      }
    }

    //------------------------------------------
    // 응답 반환
    //------------------------------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, rows: result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
