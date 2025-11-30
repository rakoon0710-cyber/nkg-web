document.write(`
  <nav class="bg-[#0A1833] text-white fixed w-full top-0 z-50 shadow">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex justify-between items-center h-14">

        <a href="index.html" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-xs font-bold">NK</div>
          <span class="font-semibold text-sm tracking-wide">남경 검수시스템</span>
        </a>

        <div class="hidden md:flex gap-6 text-sm">
          <a href="index.html" class="hover:text-sky-400">메인</a>
          <a href="index_defect.html" class="hover:text-sky-400">결품조회</a>
          <a href="index_stock.html" class="hover:text-sky-400">재고조회</a>
        </div>

        <button id="navToggle" class="md:hidden text-2xl">☰</button>
      </div>
    </div>

    <div id="mobileMenu" class="hidden md:hidden bg-[#13264C] px-6 py-4 space-y-3 text-sm">
      <a href="index.html" class="block hover:text-sky-300">메인</a>
      <a href="index_defect.html" class="block hover:text-sky-300">결품조회</a>
      <a href="index_stock.html" class="block hover:text-sky-300">재고조회</a>
    </div>
  </nav>

  <div class="h-14"></div>

  <script>
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    navToggle?.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  </script>
`);
