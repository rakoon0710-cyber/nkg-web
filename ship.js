/* ---------------------------------------------------------
   ship.js — 최종 완성본 (날짜조회 제거)
--------------------------------------------------------- */

const tbody = document.getElementById("shipTableBody");
const statusTxt = document.getElementById("shipStatus");

const today20 = document.getElementById("today_20");
const today40 = document.getElementById("today_40");
const todayLCL = document.getElementById("today_lcl");

const tom20 = document.getElementById("tom_20");
const tom40 = document.getElementById("tom_40");
const tomLCL = document.getElementById("tom_lcl");

const btnSearch = document.getElementById("shipSearchBtn");
const btnAll = document.getElementById("btnAll");

const API = "/api/shipping";


/* -------------------- 요약 --------------------- */

async function loadSummary() {
  const res = await fetch(`${API}?summary=true`);
  const { ok, summary } = await res.json();
  if (!ok) return;

  today20.textContent = summary.today.pt20;
  today40.textContent = summary.today.pt40;
  todayLCL.textContent = summary.today.lcl;

  tom20.textContent = summary.tomorrow.pt20;
  tom40.textContent = summary.tomorrow.pt40;
  tomLCL.textContent = summary.tomorrow.lcl;
}


/* -------------------- 테이블 --------------------- */

function renderRows(list) {
  tbody.innerHTML = "";

  list.forEach((r, i) => {
    const tr = document.createElement("tr");
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
      <td class="px-3 py-2 border-b">${r.type}</td>
    `;

    tbody.appendChild(tr);
  });

  statusTxt.textContent = `${list.length}건 조회됨`;
}


/* -------------------- 전체조회 --------------------- */

async function loadAll() {
  statusTxt.textContent = "전체 조회 중...";

  const res = await fetch(`${API}?all=true`);
  const { ok, data } = await res.json();

  if (!ok) {
    statusTxt.textContent = "전체 조회 실패";
    return;
  }

  renderRows(data);
}


/* -------------------- 검색 --------------------- */

async function searchKeyword() {
  const key = document.getElementById("shipKey").value.trim();
  if (!key) {
    statusTxt.textContent = "검색어를 입력하세요.";
    return;
  }

  statusTxt.textContent = "검색 중...";

  const res = await fetch(`${API}?key=${encodeURIComponent(key)}`);
  const { ok, data } = await res.json();

  if (!ok) {
    statusTxt.textContent = "검색 실패";
    return;
  }

  renderRows(data);
}


/* -------------------- 이벤트 --------------------- */

btnSearch.addEventListener("click", searchKeyword);
btnAll?.addEventListener("click", loadAll);


/* -------------------- 초기 실행 --------------------- */

loadSummary();
