(function () {
  "use strict";

  // ---------- 贯穿全页的针线 ----------
  var thread = document.getElementById("stitchThread");
  var needle = document.getElementById("stitchNeedle");
  var stitchRoot = document.querySelector(".stitch");

  function updateStitch() {
    if (!thread || !needle || !stitchRoot) return;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    thread.style.strokeDasharray = "1";
    thread.style.strokeDashoffset = String(1 - p);
    var h = stitchRoot.clientHeight;
    needle.setAttribute("transform", "translate(13 " + (p * h).toFixed(1) + ")");
  }

  window.addEventListener("scroll", updateStitch, { passive: true });
  window.addEventListener("resize", updateStitch);
  updateStitch();

  // ---------- 首屏视差 ----------
  var heroBg = document.querySelector(".hero__bg");
  var ticking = false;

  function parallaxHero() {
    if (!heroBg) return;
    var y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = "translateY(" + (y * 0.1).toFixed(1) + "px)";
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(parallaxHero);
      ticking = true;
    }
  }, { passive: true });
  parallaxHero();

  // ---------- 导航阴影与返回顶部 ----------
  var nav = document.querySelector(".nav");
  var toTop = document.getElementById("toTop");

  function onScrollChrome() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 10);
    if (toTop) toTop.classList.toggle("is-show", window.scrollY > 600);
  }

  window.addEventListener("scroll", onScrollChrome, { passive: true });
  onScrollChrome();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- 丝线之色：点击换色，重染整卷 ----------
  var swatches = Array.prototype.slice.call(document.querySelectorAll(".thread-swatch"));
  var note = document.getElementById("threadNote");

  swatches.forEach(function (btn) {
    btn.addEventListener("click", function () {
      swatches.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      document.documentElement.style.setProperty("--thread", btn.dataset.hex);
      if (note) note.textContent = btn.dataset.note;
    });
  });

  // ---------- 滚动进场 ----------
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------- 导航高亮 ----------
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
