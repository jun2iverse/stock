/* ============ GFS 주식 스터디 — 스크립트 ============ */

/* ---------- 1. 티커 테이프 ---------- */
const tapeData = [
  { t: "GFS", p: "75.53", c: "-10.83%" },
  { t: "NVDA", p: "—", c: "League of NVIDIA" },
  { t: "QNT", p: "60.00", c: "IPO 6/4" },
  { t: "MU", p: "—", c: "메모리가 王" },
  { t: "IBM", p: "—", c: "+$1B Quantum" },
  { t: "INTC", p: "—", c: "정부지분 9.9%" },
  { t: "TSM", p: "—", c: "GaN→GFS 라이선스" },
  { t: "RGTI", p: "—", c: "Quantum 9" },
  { t: "QBTS", p: "—", c: "Quantum 9" },
];
const tape = document.getElementById("tape");
const tapeHTML = tapeData.map(d => {
  const cls = d.c.startsWith("-") ? "down" : d.c.startsWith("+") ? "up" : "";
  return `<span><b>${d.t}</b> ${d.p !== "—" ? "$" + d.p : ""} <span class="${cls}">${d.c}</span></span>`;
}).join("");
tape.innerHTML = tapeHTML + tapeHTML; // 무한루프용 복제

/* ---------- 2. 사이드 네비 활성화 + 등장 애니메이션 ---------- */
const sections = document.querySelectorAll(".slide");
const navLinks = document.querySelectorAll("#sidenav a");

/* 등장 애니메이션: 모바일은 처음부터 전부 렌더링, 데스크톱만 스크롤 등장 효과 */
const isMobile = window.matchMedia("(max-width: 1000px)").matches;
if (isMobile) {
  sections.forEach(s => s.classList.add("visible"));
} else {
  const revealIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealIo.unobserve(e.target); // 한 번 보이면 끝 — 재계산 불필요
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
  sections.forEach(s => revealIo.observe(s));
}

/* 사이드 네비 활성화는 기존 기준(25%) 유지 — 데스크톱 전용 */
const navIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { threshold: 0.25 });
sections.forEach(s => navIo.observe(s));

/* ---------- 3. 스크롤 프로그레스 ---------- */
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
  document.getElementById("scroll-progress").style.width = pct + "%";
});

/* ---------- 4. 발표 타이머 (10분) ---------- */
const TOTAL = 10 * 60;
let remain = TOTAL, timerId = null;
const disp = document.getElementById("timer-display");
const prog = document.getElementById("timer-progress");

function renderTimer() {
  const m = String(Math.floor(remain / 60)).padStart(2, "0");
  const s = String(remain % 60).padStart(2, "0");
  disp.textContent = `${m}:${s}`;
  prog.style.width = (remain / TOTAL * 100) + "%";
  disp.classList.toggle("warn", remain <= 180 && remain > 60);
  disp.classList.toggle("danger", remain <= 60);
}

document.getElementById("timer-start").addEventListener("click", function () {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    this.textContent = "▶ 시작";
  } else {
    timerId = setInterval(() => {
      if (remain > 0) { remain--; renderTimer(); }
      else { clearInterval(timerId); timerId = null; }
    }, 1000);
    this.textContent = "⏸ 일시정지";
  }
});
document.getElementById("timer-reset").addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  remain = TOTAL;
  renderTimer();
  document.getElementById("timer-start").textContent = "▶ 시작";
});
renderTimer();

/* ---------- 5. 애널리스트 목표가 레인지 바 ---------- */
(function analystRange() {
  const el = document.getElementById("analyst-range");
  const low = 60, high = 125, cur = 75.53, avg = 78.95;
  const pos = v => ((v - low) / (high - low) * 100).toFixed(1);
  el.innerHTML = `
    <div style="position:relative; height:54px; margin:6px 0 4px;">
      <div style="position:absolute; top:24px; left:0; right:0; height:8px; border-radius:4px;
        background:linear-gradient(90deg, var(--red), var(--gold), var(--green));opacity:.85;"></div>
      <div style="position:absolute; top:14px; left:${pos(cur)}%; transform:translateX(-50%); text-align:center;">
        <div style="width:3px; height:28px; background:#fff; margin:0 auto; border-radius:2px;"></div>
        <div style="font-family:var(--mono); font-size:11px; color:#fff; margin-top:2px;">현재 $${cur}</div>
      </div>
      <div style="position:absolute; top:0; left:${pos(avg)}%; transform:translateX(-50%);
        font-family:var(--mono); font-size:11px; color:var(--blue);">▼ 평균 $${avg}</div>
      <div style="position:absolute; top:36px; left:0; font-family:var(--mono); font-size:11px; color:var(--red);">$${low}</div>
      <div style="position:absolute; top:36px; right:0; font-family:var(--mono); font-size:11px; color:var(--green);">$${high}</div>
    </div>`;
})();

/* ---------- 6. 목표주가 시나리오 차트 (Canvas) ---------- */
(function targetChart() {
  const canvas = document.getElementById("targetChart");
  const dpr = window.devicePixelRatio || 1;

  function draw() {
    const W = canvas.clientWidth || canvas.parentElement.clientWidth - 52;
    const H = 300;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const padL = 56, padR = 30, padT = 24, padB = 40;
    const cw = W - padL - padR, ch = H - padT - padB;

    // x: 0=현재, 1=6개월, 2=1년
    const labels = ["현재 (26.06)", "6개월 (26.12)", "1년 (27.06)"];
    const series = [
      { name: "Bull", color: "#00d68f", data: [75.53, 115, 160] },
      { name: "Base", color: "#4d9fff", data: [75.53, 90, 110] },
      { name: "Bear", color: "#ff5b6e", data: [75.53, 62, 70] },
    ];
    const yMin = 40, yMax = 180;
    const X = i => padL + cw * i / 2;
    const Y = v => padT + ch * (1 - (v - yMin) / (yMax - yMin));

    // 그리드 + y축
    ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--mono");
    for (let v = 40; v <= 180; v += 20) {
      ctx.strokeStyle = "#1f2a44";
      ctx.beginPath();
      ctx.moveTo(padL, Y(v));
      ctx.lineTo(W - padR, Y(v));
      ctx.stroke();
      ctx.fillStyle = "#8b97ad";
      ctx.textAlign = "right";
      ctx.fillText("$" + v, padL - 8, Y(v) + 4);
    }
    // x축 라벨
    ctx.textAlign = "center";
    labels.forEach((l, i) => {
      ctx.fillStyle = "#8b97ad";
      ctx.fillText(l, X(i), H - 14);
    });

    // Bull-Bear 영역 (fan)
    const bull = series[0].data, bear = series[2].data;
    ctx.beginPath();
    bull.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
    for (let i = 2; i >= 0; i--) ctx.lineTo(X(i), Y(bear[i]));
    ctx.closePath();
    ctx.fillStyle = "rgba(77,159,255,.07)";
    ctx.fill();

    // 라인
    series.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      s.data.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
      ctx.stroke();
      // 포인트 + 값
      s.data.forEach((v, i) => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(X(i), Y(v), 4, 0, Math.PI * 2);
        ctx.fill();
        if (i > 0) {
          ctx.textAlign = "center";
          ctx.fillText("$" + v, X(i), Y(v) - 10);
        }
      });
      // 시리즈 라벨
      ctx.textAlign = "left";
      ctx.fillText(s.name, X(2) + 10, Y(s.data[2]) + 4);
    });

    // 현재가 라벨
    ctx.fillStyle = "#dce3f0";
    ctx.textAlign = "center";
    ctx.fillText("$75.53", X(0), Y(75.53) - 10);
  }

  draw();
  window.addEventListener("resize", draw);
})();
