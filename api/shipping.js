// api/shipping.js — Stable Version (오늘 포함 + 이후 출고만 표시)

export default async function handler(req, res) {
  try {
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

    const resp = await fetch(CSV_URL);
    if (!resp.ok) {
      throw new Error("CSV 요청 실패: " + resp.status);
    }

    const text = await resp.text();
    const rows = parseCSV(text);

    if (!rows || rows.length <= 1) {
      return res.status(200).json({ ok: true, data: [] });
    }

    const dataRows = rows.slice(1); // 헤더 제외
    const today = getTodayYMD();

    const result = [];

    for (const r of dataRows) {
      const safe = (idx) => (r[idx] !== undefined ? clean(r[idx]) : "");

      const dateStr = safe(3); // D: 출고일
      const ymd = convertToYMD(dateStr);
      if (!ymd) continue;

      // 🔹 오늘 포함 + 이후 날짜만
      if (ymd < today) continue;

      result.push({
        ymd,
        date: dateStr,      // 출고일 (D)
        invoice: safe(0),   // 인보이스 (A)
        country: safe(4),   // 국가 (E)
        location: safe(16), // 상차위치 (Q)
        pallet: safe(18),   // 파레트 (S)
        time: safe(19),     // 상차시간 (T)
        cbm: safe(11),      // CBM (L)
        container: safe(9), // 컨테이너 (J)
        work: safe(15),     // 작업 (P)
        type: safe(10),     // 유형 (K)
      });
    }

    // 날짜순 정렬
    result.sort((a, b) => a.ymd - b.ymd);

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error("SHIPPING API ERROR:", err);
    return res.status(500).json({
      ok: false,
      msg: err.message || String(err),
    });
  }
}

/* ===================== 공통 유틸 ===================== */

// 멀티라인/쉼표 안전 CSV 파서
function parseCSV(text) {
  // 줄바꿈 형태 통일
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      // "" -> " 처리
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

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function clean(str) {
  return String(str)
    .replace(/\uFEFF/g, "") // BOM 제거
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .trim();
}

function convertToYMD(str) {
  if (!str) return 0;
  const s = String(str).trim().replace(/\s+/g, "");
  const parts = s.split(".");
  if (parts.length !== 3) return 0;

  const y = parts[0];
  const m = parts[1].padStart(2, "0");
  const d = parts[2].padStart(2, "0");
  return Number(`${y}${m}${d}`);
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}
