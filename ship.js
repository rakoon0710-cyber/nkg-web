// ship.js — 출고정보 자동로드 + 필터 + 정렬

const tbody = document.getElementById("shipTableBody");
const statusTxt = document.getElementById("shipStatus");

let shipData = []; // 전체 데이터 저장용

// ▣ 1) 서버에서 데이터 불러오기
async function loadData() {
  statusTxt.textContent = "불러오는 중...";

  try {
    const res = await fetch("/api/shipping");
    const { ok, data } = await res.json();

    if (!ok) {
      statusTxt.textContent = "불러오기 실패";
      return;
    }

    shipData = data; // 전체 저장
    renderTable(shipData); // 초기 렌더
    statusTxt.textContent = `${shipData.length}건 표시됨`;

  } catch (e) {
    statusTxt.textContent = "서버 오류";
  }
}

// ▣ 2) 정렬 함수 (날짜 → 수출 우선)
function sortList(list) {
  return [...list].sort((a, b) => {
    // 날짜 오름차순
    const d1 = new Date(a.date);
    const d2 = new Date(b.date);
    if (d1 - d2 !== 0) return d1 - d2;

    // 같은 날짜면 "수출" 먼저
    const priority = { "수출": 1, "배송": 2 };
    const p1 = priority[a.type] || 99;
    const p2 = priority[b.type] || 99;

    return p1 - p2;
  });
}

// ▣ 3) 테이블 렌더링
function renderTable(list) {
  tbody.innerHTML = "";
  const sorted = sortList(list);

  sorted.forEach((r, i) => {
    const tr = document.createElement("tr");

    // 줄무늬 스타일 기존 유지
    if (i % 2 === 1) tr.classList.add("bg-slate-50");

    tr.innerHTML = `
      <td class="px-3 py-2 border-b sticky left-0 bg-white z-10">${r.date}</td>
      <td class="px-3 py-2 border-b">${r.invoice}</td>
      <td class="px-3 py-2 border-b">${r.country}</td>
      <td class="px-3 py-2 border-b">${r.location}</td>
      <td class="px-3 py-2 border-b">${r.pallet}</td>
      <td class="px-3 py-2 border-b">${r.time}</td>
      <td class="px-3 py-2 border-b">${r.cbm}</td>
      <td class="px-3 py-2 border-b">${r.container}</td>
      <td class="px-3 py-2 border-b">${r.work}</td>
      <td class="px-3 py-2 border-b font-semibold">${r.type}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ▣ 4) 필터: 출고일 + 인보이스 검색
document.getElementById("btnSearch")?.addEventListener("click", () => {
  const fDate = document.getElementById("filterDate").value;
  const fInv = document.getElementById("filterInvoice").value.trim();

  const filtered = shipData.filter(v => {
    if (fDate && v.date !== fDate) return false;
    if (fInv && !v.invoice.includes(fInv)) return false;
    return true;
  });

  renderTable(filtered);
  statusTxt.textContent = `${filtered.length}건 표시됨`;
});

// ▣ 5) 전체 조회
document.getElementById("btnAll")?.addEventListener("click", () => {
  renderTable(shipData);
  statusTxt.textContent = `${shipData.length}건 표시됨`;
});

// ▣ 최초 실행
loadData();
