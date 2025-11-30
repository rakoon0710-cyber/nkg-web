export default async function handler(req, res) {
  try {
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

    const text = await fetch(CSV_URL).then(r => r.text());
    const rows = parseCSV(text);

    const { all, key, summary } = req.query;

    if (summary === "true") {
      return res.status(200).json({ ok: true, summary: calcSummary(rows) });
    }

    if (all === "true") {
      return res.status(200).json({ ok: true, data: rows });
    }

    if (key) {
      return res.status(200).json({ ok: true, data: filterKey(rows, key) });
    }

    return res.status(200).json({ ok: true, data: rows });

  } catch (err) {
    return res.status(500).json({ ok: false, msg: err.message });
  }
}


// ---- 아래는 날짜/CSV 유틸 ----

function clean(str) {
  if (!str) return "";
  return String(str)
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;
    const c = safeParse(row);

    out.push({
      invoice:   clean(c[0]),  // A
      date:      clean(c[3]),  // D
      country:   clean(c[4]),  // E
      container: clean(c[9]),  // J
      type:      clean(c[10]), // K
      cbm:       clean(c[11]), // L
      work:      clean(c[15]), // P
      location:  clean(c[16]), // Q
      pallet:    clean(c[18]), // S
      time:      clean(c[19]), // T
    });
  }

  return out;
}

function safeParse(row) {
  let out = [], cur = "", inside = false;
  for (let c of row) {
    if (c === '"' && inside) inside = false;
    else if (c === '"' && !inside) inside = true;
    else if (c === "," && !inside) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function calcSummary(rows) {
  const today = getDate(0);
  const tomorrow = getDate(1);

  let t20=0,t40=0,tLCL=0;
  let n20=0,n40=0,nLCL=0;

  rows.forEach(r => {
    const dash = r.date.replace(/\./g, "-");
    const cont = r.container.toUpperCase();

    if (dash === today) {
      if (cont.includes("20")) t20++;
      else if (cont.includes("40")) t40++;
      else if (cont.includes("LCL")) tLCL++;
    }

    if (dash === tomorrow) {
      if (cont.includes("20")) n20++;
      else if (cont.includes("40")) n40++;
      else if (cont.includes("LCL")) nLCL++;
    }
  });

  return {
    today:    { pt20: t20, pt40: t40, lcl: tLCL },
    tomorrow: { pt20: n20, pt40: n40, lcl: nLCL }
  };
}

function filterKey(rows, key) {
  const k = clean(key);

  // 인보이스 (A)
  if (/^\d{6,9}$/.test(k)) {
    return rows.filter(r => r.invoice.includes(k));
  }

  // YYYYMMDD → YYYY.MM.DD
  if (/^\d{8}$/.test(k)) {
    const d = `${k.slice(0,4)}.${k.slice(4,6)}.${k.slice(6)}`;
    return rows.filter(r => r.date === d);
  }

  // MMDD → 부분 날짜 검색
  if (/^\d{3,4}$/.test(k)) {
    return rows.filter(r => r.date.replace(/\./g,"").endsWith(k));
  }

  // 국가/기타 문자열 검색
  return rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(k.toLowerCase()))
  );
}

function getDate(add) {
  const d = new Date();
  d.setDate(d.getDate() + add);
  return d.toISOString().split("T")[0];
}
