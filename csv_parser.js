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
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  row.push(field);
  rows.push(row);

  return rows;
}

async function fetchCsv(url) {
  const res = await fetch(url + "&t=" + Date.now());
  if (!res.ok) throw new Error("Fetch 실패 " + res.status);
  return parseCsvPrecise(await res.text());
}
