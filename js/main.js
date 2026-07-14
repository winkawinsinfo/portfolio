/* ============================================================
   ACE OF SPACE — main.js
   1) Scroll scene engine (index): principles → zoom out → plaster wipe
   2) Reveal-on-scroll (all pages)
   Respects prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.body.classList.add('reduced');

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // map progress p from [a,b] → [0,1]
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t * t * (3 - 2 * t); } // smoothstep

  /* ============================================================
     1) SCROLL SCENE (index only)
     timeline (scene progress 0 → 1):
       0.00–0.08  hero headline
       0.08–0.42  principles 1 → 2 → 3 (hero copy fades out)
       0.42–0.68  zoom out  HERO-01 → SCOPE-01
       0.68–0.82  scope copy rises
       0.82–1.00  plaster wipe (bottom-left → top-right)
     ============================================================ */

  var scene = document.getElementById('scene');

  if (scene && !reduced) {
    var heroLayer  = scene.querySelector('.layer-hero');
    var heroCopy   = scene.querySelector('.hero-copy');
    var heroHint   = scene.querySelector('.hero-scroll-hint');
    var principles = scene.querySelectorAll('.principle');
    var scopeLayer = scene.querySelector('.layer-scope');
    var scopeCopy  = scene.querySelector('.scope-copy');
    var wipeLayer  = scene.querySelector('.layer-wipe');

    // fixed organic jitter for the wipe's leading edge (percent units)
    var JIT = [0, 2.2, -1.7, 2.8, -1.2, 1.6, 0];

    var ticking = false;

    function update() {
      ticking = false;

      var rect = scene.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = scene.offsetHeight - vh;
      var p = clamp(-rect.top / total, 0, 1);

      /* --- hero copy --- */
      var fadeHero = 1 - ease(seg(p, 0.06, 0.11));
      heroCopy.style.opacity = fadeHero;
      heroCopy.style.transform = 'translateY(' + (-24 * (1 - fadeHero)) + 'px)';
      if (heroHint) heroHint.style.opacity = fadeHero;

      /* --- principles: 3 slots inside 0.08–0.42 --- */
      var slots = [[0.08, 0.19], [0.195, 0.305], [0.31, 0.42]];
      for (var i = 0; i < principles.length; i++) {
        var s = slots[i];
        var fadeIn  = ease(seg(p, s[0], s[0] + 0.035));
        var fadeOut = 1 - ease(seg(p, s[1] - 0.035, s[1]));
        var o = Math.min(fadeIn, fadeOut);
        principles[i].style.opacity = o;
        principles[i].style.transform = 'translateY(' + (18 * (1 - fadeIn)) + 'px)';
      }

      /* --- zoom out: hero scales up & fades, scope settles 1.18 → 1 ---
         HERO-01 and SCOPE-01 are two separate photographs, not one continuous
         dolly shot — crossfading them sharp reveals a "double exposure" (both
         sets of edges visible at once). A blur peak at the midpoint hides the
         seam: the eye reads "camera rack-focus", not "cut between two photos". */
      var z = ease(seg(p, 0.42, 0.68));
      heroLayer.style.transform = 'scale(' + (1 + 0.55 * z) + ')';
      heroLayer.style.opacity = 1 - seg(p, 0.50, 0.66);
      scopeLayer.style.opacity = ease(seg(p, 0.46, 0.62));
      scopeLayer.style.transform = 'scale(' + (1.18 - 0.18 * z) + ')';

      var BLUR_START = 0.42, BLUR_MID = 0.55, BLUR_END = 0.68, BLUR_MAX = 22;
      var blurPx = 0;
      if (p > BLUR_START && p < BLUR_END) {
        blurPx = p <= BLUR_MID
          ? BLUR_MAX * ease(seg(p, BLUR_START, BLUR_MID))
          : BLUR_MAX * (1 - ease(seg(p, BLUR_MID, BLUR_END)));
      }
      var blurCss = blurPx > 0.4 ? 'blur(' + blurPx.toFixed(1) + 'px)' : 'none';
      heroLayer.style.filter = blurCss;
      scopeLayer.style.filter = blurCss;

      /* --- scope copy --- */
      var sc = ease(seg(p, 0.68, 0.80));
      scopeCopy.style.opacity = sc;
      scopeCopy.style.transform = 'translateY(' + (24 * (1 - sc)) + 'px)';

      /* --- plaster wipe: diagonal sweep, organic edge --- */
      var w = ease(seg(p, 0.82, 0.985));
      var d = w * 240;                       // leading-edge x at bottom (percent)
      var pts = ['0% 112%'];
      // edge from (d, 112) up to (d - 78, -12), 7 jittered points
      for (var k = 0; k < 7; k++) {
        var t = k / 6;
        var x = d - 78 * t + JIT[k] * Math.min(1, w * 3);
        var y = 112 - 124 * t;
        pts.push(x.toFixed(2) + '% ' + y.toFixed(2) + '%');
      }
      pts.push('0% -12%');
      wipeLayer.style.clipPath = 'polygon(' + pts.join(',') + ')';
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ============================================================
     2) Reveal on scroll
     ============================================================ */

  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
