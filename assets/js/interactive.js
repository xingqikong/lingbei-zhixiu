(function () {
  "use strict";

  var COLORS = [
    { name: "朱砂", hex: "#C8402F" },
    { name: "石青", hex: "#2E6A8E" },
    { name: "青黛", hex: "#3F5F8A" },
    { name: "藤黄", hex: "#E0A53B" },
    { name: "松花绿", hex: "#5E8C6A" },
    { name: "月白", hex: "#B9CBD8" },
    { name: "鎏金", hex: "#C9A227" },
    { name: "樱粉", hex: "#E8A0B2" }
  ];

  // ---------- 步骤切换 ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".step-tab"));
  var stages = Array.prototype.slice.call(document.querySelectorAll(".stage"));

  function showStep(n) {
    tabs.forEach(function (t) { t.classList.toggle("is-active", t.dataset.step === String(n)); });
    stages.forEach(function (s) { s.hidden = s.dataset.stage !== String(n); });
    if (n === 3) { initCanvas(); }
    if (n === 4) { resetMemory(); }
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showStep(Number(t.dataset.step)); });
  });

  // ---------- ① 穿针 ----------
  var threadTip = document.getElementById("threadTip");
  var threadPath = document.getElementById("threadPath");
  var needleEye = document.getElementById("needleEye");
  var needleMsg = document.getElementById("needleMsg");
  var next1 = document.getElementById("next1");
  var needleSvg = document.querySelector(".needle-svg");

  function svgPoint(clientX, clientY) {
    var pt = needleSvg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var m = needleSvg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : pt;
  }

  function setTip(x, y) {
    threadTip.setAttribute("cx", x);
    threadTip.setAttribute("cy", y);
    threadPath.setAttribute("d", "M60 250 Q 150 210 " + x + " " + y);
  }

  var dragging = false;
  var done1 = false;

  threadTip.addEventListener("pointerdown", function (e) {
    if (done1) return;
    dragging = true;
    threadTip.setPointerCapture(e.pointerId);
  });

  threadTip.addEventListener("pointermove", function (e) {
    if (!dragging || done1) return;
    var p = svgPoint(e.clientX, e.clientY);
    setTip(p.x, p.y);
  });

  function finishNeedle(e) {
    if (!dragging) return;
    dragging = false;
    if (done1) return;
    var p = svgPoint(e.clientX, e.clientY);
    var ex = 360, ey = 78;
    var d = Math.hypot(p.x - ex, p.y - ey);
    if (d < 18) {
      setTip(ex, ey);
      done1 = true;
      needleMsg.textContent = "穿好了！丝线已穿过针眼。";
      next1.disabled = false;
    } else {
      needleMsg.textContent = "还差一点，把线头对准针眼。";
    }
  }

  threadTip.addEventListener("pointerup", finishNeedle);
  threadTip.addEventListener("pointercancel", function () { dragging = false; });

  next1.addEventListener("click", function () { showStep(2); });

  // ---------- ② 配色 ----------
  var palette = document.getElementById("palette");
  var motifSvg = document.getElementById("motifSvg");
  var colorNote = document.getElementById("colorNote");
  var next2 = document.getElementById("next2");
  var selected = COLORS[0].hex;

  COLORS.forEach(function (c, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.title = c.name;
    b.style.background = c.hex;
    b.dataset.hex = c.hex;
    if (i === 0) b.classList.add("is-active");
    b.addEventListener("click", function () {
      selected = c.hex;
      Array.prototype.forEach.call(palette.children, function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
    });
    palette.appendChild(b);
  });

  var petals = Array.prototype.slice.call(motifSvg.querySelectorAll(".petal"));
  var coloredCount = 0;

  petals.forEach(function (petal) {
    petal.addEventListener("click", function () {
      petal.style.fill = selected;
      if (!petal.dataset.colored) {
        petal.dataset.colored = "1";
        coloredCount += 1;
      }
      if (coloredCount >= petals.length) {
        colorNote.textContent = "配色完成，一朵樱花已经绽放。";
        next2.disabled = false;
      } else {
        colorNote.textContent = "已上色 " + coloredCount + " / " + petals.length + " 片花瓣。";
      }
    });
  });

  next2.addEventListener("click", function () { showStep(3); initCanvas(); });

  // ---------- ③ 绣制 ----------
  var canvas = document.getElementById("stitchCanvas");
  var progress = document.getElementById("stitchProgress");
  var resetBtn = document.getElementById("reset3");
  var ctx = canvas.getContext("2d");
  var dots = [];
  var stitched = [];
  var currentColor = COLORS[0].hex;
  var canvasReady = false;

  // 绣制线色选择
  var stitchPalette = document.getElementById("stitchPalette");
  COLORS.forEach(function (c, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.title = c.name;
    b.style.background = c.hex;
    b.dataset.hex = c.hex;
    if (i === 0) b.classList.add("is-active");
    b.addEventListener("click", function () {
      currentColor = c.hex;
      Array.prototype.forEach.call(stitchPalette.children, function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      drawDots();
    });
    stitchPalette.appendChild(b);
  });

  // 用极坐标生成一朵五瓣樱花（花瓣尖端带缺口）的轮廓点
  function sakuraDots() {
    var cx = 80, cy = 80, R = 52;
    var pts = [];
    var N = 760;
    for (var k = 0; k < N; k++) {
      var th = (k / N) * Math.PI * 2;
      var r = R * (1 + 0.25 * Math.cos(5 * th) - 0.16 * Math.cos(10 * th));
      pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
    }
    var step = Math.max(1, Math.floor(pts.length / 280));
    var out = [];
    for (var i = 0; i < pts.length; i += step) out.push(pts[i]);
    return out;
  }

  function layoutDots() {
    var cw = canvas.clientWidth || 800;
    var ch = canvas.clientHeight || 380;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    var raw = sakuraDots();
    var scale = Math.min(cw, ch) * 0.78 / 160;
    var ox = (cw - 160 * scale) / 2;
    var oy = (ch - 160 * scale) / 2;
    dots = raw.map(function (p) {
      return { x: ox + p[0] * scale, y: oy + p[1] * scale, stitched: false };
    });
    stitched = [];
    drawDots();
    progress.textContent = "0 / " + dots.length + " 针";
  }

  function drawDots() {
    var cw = canvas.clientWidth || 800;
    var ch = canvas.clientHeight || 380;
    ctx.clearRect(0, 0, cw, ch);
    dots.forEach(function (d) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
      if (d.stitched) {
        // 以“×”针脚呈现
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(d.x - 4, d.y - 4);
        ctx.lineTo(d.x + 4, d.y + 4);
        ctx.moveTo(d.x + 4, d.y - 4);
        ctx.lineTo(d.x - 4, d.y + 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(42,37,32,0.28)";
        ctx.fill();
      }
    });
  }

  function stitchNear(px, py) {
    var hit = false;
    dots.forEach(function (d) {
      if (!d.stitched && Math.hypot(d.x - px, d.y - py) < 18) {
        d.stitched = true;
        stitched.push(d);
        hit = true;
      }
    });
    if (hit) {
      drawDots();
      progress.textContent = stitched.length + " / " + dots.length + " 针";
      if (stitched.length >= dots.length) {
        progress.textContent = "完成！你绣出了一朵樱花。";
        glow();
      }
    }
  }

  function glow() {
    ctx.shadowColor = currentColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 1.5;
    var cw = canvas.clientWidth || 800, ch = canvas.clientHeight || 380;
    ctx.strokeRect(8, 8, cw - 16, ch - 16);
    ctx.shadowBlur = 0;
  }

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  var painting = false;
  canvas.addEventListener("pointerdown", function (e) {
    painting = true;
    canvas.setPointerCapture(e.pointerId);
    var p = canvasPos(e);
    stitchNear(p.x, p.y);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!painting) return;
    var p = canvasPos(e);
    stitchNear(p.x, p.y);
  });
  canvas.addEventListener("pointerup", function () { painting = false; });
  canvas.addEventListener("pointercancel", function () { painting = false; });

  function initCanvas() {
    if (canvasReady) return;
    canvasReady = true;
    layoutDots();
    window.addEventListener("resize", function () {
      var s3 = document.querySelector('.stage[data-stage="3"]');
      if (s3 && !s3.hidden) layoutDots();
    });
  }

  resetBtn.addEventListener("click", function () {
    canvasReady = true;
    layoutDots();
  });

  // ---------- ④ 纹样翻牌 ----------
  var MOTIFS = [
    { name: "牡丹", img: "assets/img/motif-mudan.jpg" },
    { name: "莲花", img: "assets/img/motif-lianhua.jpg" },
    { name: "蝙蝠", img: "assets/img/motif-bianfu.jpg" },
    { name: "如意", img: "assets/img/motif-ruyi.jpg" }
  ];
  var memoryBoard = document.getElementById("memoryBoard");
  var memoryNote = document.getElementById("memoryNote");
  var memoryReward = document.getElementById("memoryReward");
  var memoryRestart = document.getElementById("memoryRestart");
  var flipped = [];
  var matched = 0;
  var moves = 0;
  var lock = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildMemory() {
    var cards = shuffle(MOTIFS.concat(MOTIFS));
    memoryBoard.innerHTML = "";
    memoryReward.innerHTML = "";
    cards.forEach(function (m) {
      var c = document.createElement("div");
      c.className = "memory-card";
      c.dataset.motif = m.name;
      c.innerHTML = '<div class="memory-card__inner">' +
        '<div class="memory-card__face memory-card__back">绣</div>' +
        '<div class="memory-card__face memory-card__front"><img class="memory-card__img" src="' + m.img + '" alt="' + m.name + '"><span class="memory-card__label">' + m.name + '</span></div>' +
        '</div>';
      c.addEventListener("click", function () { flipCard(c); });
      memoryBoard.appendChild(c);
    });
    flipped = [];
    matched = 0;
    moves = 0;
    lock = false;
    memoryNote.textContent = "已翻开 0 次";
  }

  function flipCard(c) {
    if (lock || c.classList.contains("is-flipped") || c.classList.contains("is-matched")) return;
    c.classList.add("is-flipped");
    flipped.push(c);
    moves += 1;
    memoryNote.textContent = "已翻开 " + moves + " 次";
    if (flipped.length === 2) {
      lock = true;
      if (flipped[0].dataset.motif === flipped[1].dataset.motif) {
        flipped.forEach(function (x) { x.classList.add("is-matched"); });
        matched += 1;
        flipped = [];
        lock = false;
        if (matched === MOTIFS.length) {
          memoryNote.textContent = "全部配对成功！珞珈山下，你已得织绣真传 🎉";
          memoryReward.innerHTML = '<div class="memory-reward-card">' +
            '<img class="memory-reward-card__img" src="assets/img/laozhaishe.jpg" alt="珞珈山 · 樱花城堡">' +
            '<div class="memory-reward-card__body">' +
            '<p class="reward-school">武汉大学 · 零杯网页设计大赛</p>' +
            '<p class="reward-title">织绣真传 · 传人</p>' +
            '<p class="reward-motto">自强 · 弘毅 · 求是 · 拓新</p>' +
            '</div>' +
            '<div class="seal-stamp is-stamped">传人</div>' +
            '</div>';
        }
      } else {
        setTimeout(function () {
          flipped.forEach(function (x) { x.classList.remove("is-flipped"); });
          flipped = [];
          lock = false;
        }, 750);
      }
    }
  }

  function resetMemory() {
    buildMemory();
  }

  memoryRestart.addEventListener("click", resetMemory);
  resetMemory();

  // 丝线颜色全局联动：互动页也跟随首页选择（同源变量由 CSS 驱动）
  document.documentElement.style.setProperty("--thread", COLORS[0].hex);
})();
