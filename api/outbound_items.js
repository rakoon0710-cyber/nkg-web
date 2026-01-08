// api/outbound_items.js
import { loadCsv } from "../lib/_csv.js";

const SAP_ITEM_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=221455512&single=true&output=csv";

const WMS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1850233363&single=true&output=csv";

const BARCODE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAWmUNAeyndXfdxHjR-1CakW_Tm3OzmMTng5RkB53umXwucqpxABqMMcB0y8H5cHNg7aoHYqFztz0F/pub?gid=1454119997&single=true&output=csv";

// ?�보?�스 ?�규??
function normalizeInv(v) {
  if (!v) return "";
  return v.toString().replace(/[^0-9]/g, "").replace(/^0+/, "");
}

// ??Google pub CSV 캐시 깨기??
function bust(url) {
  const t = Date.now();
  return url.includes("?") ? `${url}&t=${t}` : `${url}?t=${t}`;
}

export default async function handler(req, res) {
  // ??API ?�답 캐시 금�? (브라?��?/?�록??Vercel edge ??
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const { inv } = req.query;

  if (!inv) {
    return res.status(200).json({ ok: false, message: "?�보?�스가 ?�습?�다." });
  }

  try {
    // ??�?CSV URL??timestamp 붙여??최신 강제
    const [sapRows, wmsRows, barcodeRows] = await Promise.all([
      loadCsv(bust(SAP_ITEM_URL)),
      loadCsv(bust(WMS_URL)),
      loadCsv(bust(BARCODE_URL)),
    ]);

    const targetInv = normalizeInv(inv);

    // 1) SAP ?�재?�동?�서 ?�당 ?�보?�스�??�터
    const sapList = sapRows.filter(r => {
      const invCol = normalizeInv(r["?�보?�스"]);
      return invCol === targetInv;
    });

    // 2) WMS �?(?�보?�스 + ?�재코드 + 박스번호 기�?)
    const wmsMap = {};
    wmsRows.forEach(r => {
      const invKey = normalizeInv(r["?�보?�스"]);
      const mat = (r["?�품코드"] || "").trim();
      const box = (r["박스번호"] || "").trim();
      const qty = Number(r["?�량"] || 0);

      if (!invKey || !mat || !box) return;

      const key = `${invKey}__${mat}__${box}`;
      wmsMap[key] = qty;
    });

    // 3) 바코??�?(?�재번호 + 박스번호 ??바코??
    const barcodeMap = {};
    barcodeRows.forEach(r => {
      const mat = (r["?�재번호"] || "").trim();
      const box = (r["박스번호"] || "").trim();
      const barcode = (r["바코??] || "").trim();
      if (!mat || !barcode) return;

      const key = `${mat}__${box}`;
      if (!barcodeMap[key]) {
        barcodeMap[key] = {
          barcode,
          name: r["?�재?�역"] || "",
          box,
        };
      }
    });

    // 4) 최종 ?�이??리스??구성
    const items = sapList.map(r => {
      const no = r["번호"] || "";
      const mat = r["?�재코드"] || "";
      const box = r["박스번호"] || "";
      const name = r["?�재?�역"] || "";
      const sapQty = Number(r["출고"] || 0);
      const unit = r["?�위"] || "";

      const invMatKey = (r["?�보?�스+?�재코드"] || "").trim();
      const wmsKey = `${targetInv}__${mat}__${box}`;
      const wmsQty = Number(wmsMap[wmsKey] || 0);

      const compare = sapQty - wmsQty;

      // 바코??매핑: ?�재번호 + 박스번호 기�?
      const barcodeKey = `${mat}__${box}`;
      const binfo = barcodeMap[barcodeKey];
      const barcode = binfo ? binfo.barcode : "";

      return {
        invKey: invMatKey,
        no,
        mat,
        box,
        name,
        sap: sapQty,
        wms: wmsQty,
        compare,
        unit,
        barcode,
        status: "미완�?,
      };
    });

    // 번호 ?�름차순 ?�렬
    items.sort((a, b) => {
      const na = Number(a.no || 0);
      const nb = Number(b.no || 0);
      return na - nb;
    });

    return res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("OUTBOUND_ITEMS ERROR:", err);
    return res.status(200).json({
      ok: false,
      message: "출고 ?�목 조회 ?�류",
      error: err.message,
    });
  }
}
