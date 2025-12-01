// ship.js — 자동 로드 출고정보

const tbody = document.getElementById("shipTableBody");
const statusTxt = document.getElementById("shipStatus");

async function loadData() {
  statusTxt.textContent = "불러오는 중...";

  const res = await fetch("/api/shipping");
  const { ok, data } = await res.json();

  if (!ok) {
    statusTxt.textContent = "불러오기 실패";
    return;
  }

  tbody.innerHTML = "";

  data.forEach((r, i) => {
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

  statusTxt.textContent = `${data.length}건 표시됨`;
}

loadData();
