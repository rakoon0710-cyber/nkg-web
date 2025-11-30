const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8888;

// =========================
// 1) 정적파일 제공
// =========================
app.use(express.static(path.join(__dirname, "public")));

// =========================
// 2) CSV 파일 제공 API
// =========================

// SAP CSV
app.get("/api/sap", (req, res) => {
    const csvPath = path.join(__dirname, "data", "sap.csv");
    if (!fs.existsSync(csvPath)) return res.status(404).send("SAP CSV not found");

    res.sendFile(csvPath);
});

// WMS CSV
app.get("/api/wms", (req, res) => {
    const csvPath = path.join(__dirname, "data", "wms.csv");
    if (!fs.existsSync(csvPath)) return res.status(404).send("WMS CSV not found");

    res.sendFile(csvPath);
});

// =========================
// 서버 실행
// =========================
app.listen(PORT, () => {
    console.log(`🚀 남경 검수시스템 서버 실행중… http://localhost:${PORT}`);
});
