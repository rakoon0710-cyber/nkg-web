export function parseCsv(csvText) {
  csvText = csvText.replace(/^\uFEFF/, ""); // BOM 제거

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");

  const header = splitCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() ?? "";
    });
    rows.push(obj);
  }

  return { header, rows };
}

// CSV 한 줄 파싱
function splitCsvLine(line) {
  const result = [];
  let cur = "";
  let inside = false;

  for (let c of line) {
    if (c === '"' && inside) {
      inside = false;
      continue;
    }
    if (c === '"' && !inside) {
      inside = true;
      continue;
    }
    if (c === "," && !inside) {
      result.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  result.push(cur);
  return result;
}
