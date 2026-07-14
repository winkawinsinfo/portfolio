/* ============================================================
   ACE OF SPACE — main-video.js  (Option B: scroll-scrubbed video)

   S1→S2 is ONE continuous dolly shot (macro joint → wide interior),
   scrubbed frame-by-frame against scroll position. The video file is
   encoded ALL-INTRA (keyframe every frame, -g 1) — without that,
   currentTime seeking snaps between sparse keyframes and stutters.

   timeline (scene progress 0 → 1, scene = 360vh → 260vh of travel):
     0.00–0.08  hero headline           (video holds frame 0)
     0.10–0.50  principles 1 → 2 → 3   (video holds frame 0)
     0.50–0.78  VIDEO SCRUB 0 → end    (footage finishes BEFORE S2 begins)
     0.79–0.875 S2 scope copy + scrim rise (video holds last frame)
     0.88–0.99  EXIT: video fades, paper panel slides up — S3's
                Selected Works heading + grid sit right at the scene's
                end in normal flow, so S2→S3 is about one viewport
   ============================================================ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.body.classList.add('reduced');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t * t * (3 - 2 * t); }

  var scene = document.getElementById('scene');
  var video = document.getElementById('zoomVideo');

  if (scene && video && !reduced) {
    var heroLayer  = scene.querySelector('.layer-hero');
    var heroCopy   = scene.querySelector('.hero-copy');
    var heroHint   = scene.querySelector('.hero-scroll-hint');
    var principles = scene.querySelectorAll('.principle');
    var scopeLayer = scene.querySelector('.layer-scope');
    var scopeCopy  = scene.querySelector('.scope-copy');
    var scopeScrim = scene.querySelector('.scope-scrim');
    var wipeLayer  = scene.querySelector('.layer-wipe');

    var videoLayer = scene.querySelector('.layer-video');
    var headBrand  = document.getElementById('headBrand');
    var heroLogo   = scene.querySelector('.hero-logo-center');
    var dur = 0;

    function initDur() {
      if (video.duration && !dur) { dur = video.duration; video.currentTime = 0; }
    }
    video.addEventListener('loadedmetadata', initDur);
    if (video.readyState >= 1) initDur();   // metadata may already be in before the listener attached
    // iOS/Safari won't decode frames until a play() has happened once
    video.addEventListener('canplay', function primer() {
      video.removeEventListener('canplay', primer);
      video.play().then(function () { video.pause(); video.currentTime = 0; }).catch(function () {});
    });

    var ticking = false;

    function update() {
      ticking = false;

      var rect = scene.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = scene.offsetHeight - vh;
      var p = clamp(-rect.top / total, 0, 1);

      /* --- hero copy (big logo + headline) · header brand crossfades in --- */
      var fadeHero = 1 - ease(seg(p, 0.06, 0.11));
      heroCopy.style.opacity = fadeHero;
      heroCopy.style.transform = 'translateY(' + (-24 * (1 - fadeHero)) + 'px)';
      if (heroHint) heroHint.style.opacity = fadeHero;
      if (heroLogo) heroLogo.style.opacity = fadeHero;
      if (headBrand) headBrand.style.opacity = 1 - fadeHero;

      /* --- principles --- */
      var slots = [[0.10, 0.23], [0.235, 0.365], [0.37, 0.50]];
      for (var i = 0; i < principles.length; i++) {
        var s = slots[i];
        var fadeIn  = ease(seg(p, s[0], s[0] + 0.035));
        var fadeOut = 1 - ease(seg(p, s[1] - 0.035, s[1]));
        var o = Math.min(fadeIn, fadeOut);
        principles[i].style.opacity = o;
        principles[i].style.transform = 'translateY(' + (18 * (1 - fadeIn)) + 'px)';
      }

      /* --- VIDEO SCRUB: footage completes before the S2 copy arrives --- */
      if (!dur) initDur();
      if (dur) {
        var z = ease(seg(p, 0.50, 0.78));
        // leave a hair below duration — seeking exactly to the end can show black
        var target = Math.min(z * dur, dur - 0.05);
        if (Math.abs(video.currentTime - target) > 0.033) {
          video.currentTime = target;
        }
      }

      /* --- EXIT (S2→S3): compressed tail — video fades, paper panel slides up --- */
      var ex     = ease(seg(p, 0.88, 0.99));    // panel travel
      var exFade = ease(seg(p, 0.89, 0.97));    // video fade

      /* --- scope copy + scrim (fade out again as the exit begins) --- */
      var sc = ease(seg(p, 0.79, 0.875)) * (1 - exFade);
      scopeLayer.style.opacity = 1;               /* layer is transparent overlay */
      if (scopeScrim) scopeScrim.style.opacity = sc;
      scopeCopy.style.opacity = sc;
      scopeCopy.style.transform = 'translateY(' + (24 * (1 - sc)) + 'px)';

      if (videoLayer) videoLayer.style.opacity = 1 - exFade;
      /* panel is 170vh with a 55vh gradient head: travel 103% → -38% so the
         solid region (not the gradient) is what fills the viewport at the end */
      wipeLayer.style.transform = 'translateY(' + (103 - 141 * ex) + '%)';
      wipeLayer.style.pointerEvents = ex > 0.5 ? 'auto' : 'none';
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  } else if (video) {
    // reduced motion: show the final wide frame as a still
    video.addEventListener('loadedmetadata', function () {
      video.currentTime = Math.max(0, video.duration - 0.05);
    });
  }

  /* --- reveal on scroll (same as main.js) --- */
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
