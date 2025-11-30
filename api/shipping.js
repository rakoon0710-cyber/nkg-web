import fetch from "node-fetch";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1070360000&single=true&output=csv";

export default async function handler(req, res) {
  try {
    const csv = await fetch(CSV_URL).then(r => r.text());
    const rows = parseCSV(csv);

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

  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
}

function clean(str) {
  if (!str) return "";
  return String(str)
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).slice(1);
  const out = [];

  for (let line of lines) {
    if (!line.trim()) continue;

    const c = safeParse(line);

    out.push({
      invoice:   clean(c[0]), 
      type:      clean(c[10]),
      container: clean(c[9]),
      cbm:       clean(c[11]),
      date:      clean(c[3]),
      country:   clean(c[4]),
      work:      clean(c[15]),
      location:  clean(c[16]),
      pallet:    clean(c[18]),
      time:      clean(c[19]),
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

  let t20=0,t40=0,tL=0;
  let n20=0,n40=0,nL=0;

  rows.forEach(r => {
    const d = clean(r.date);
    const J = clean(r.container).toUpperCase();

    if (!d) return;

    const dash = d.replace(/\./g, "-");

    if (dash === today) {
      if (J.includes("20")) t20++;
      else if (J.includes("40")) t40++;
      else if (J.includes("LCL")) tL++;
    }

    if (dash === tomorrow) {
      if (J.includes("20")) n20++;
      else if (J.includes("40")) n40++;
      else if (J.includes("LCL")) nL++;
    }
  });

  return {
    today:    { pt20: t20, pt40: t40, lcl: tL },
    tomorrow: { pt20: n20, pt40: n40, lcl: nL }
  };
}

function filterKey(rows, key) {
  const k = clean(key);

  if (/^\d{6,9}$/.test(k)) {
    return rows.filter(r => clean(r.invoice).includes(k));
  }

  if (/^\d{8}$/.test(k)) {
    const d = `${k.substring(0,4)}.${k.substring(4,6)}.${k.substring(6,8)}`;
    return rows.filter(r => clean(r.date) === d);
  }

  if (/^\d{3,4}$/.test(k)) {
    return rows.filter(r => clean(r.date).replace(/[.]/g,"").endsWith(k));
  }

  const lower = k.toLowerCase();
  return rows.filter(r =>
    Object.values(r).some(v => clean(v).toLowerCase().includes(lower))
  );
}

function getDate(add) {
  const d = new Date();
  d.setDate(d.getDate() + add);
  return d.toISOString().substring(0,10);
}
