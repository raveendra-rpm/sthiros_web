(function () {
  try {
    var p = window.location.pathname.split('/').pop().toLowerCase();
    var isIdx = (!p || p === '/' || p === 'index.html');
    function applyPageClass() {
      if (!document.body) return;
      if (isIdx) {
        document.body.classList.add('home-index', 'home-page', 'page-index');
      } else {
        document.body.classList.add('sub-page', 'page-subpage');
      }
    }
    if (document.body) {
      applyPageClass();
    } else {
      document.addEventListener('DOMContentLoaded', applyPageClass);
    }
  } catch (e) {}
})();

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

function boot() {
  initLenis();
  // initWebGLBackground(); /* Disabled per user request */
  initHeroTrackAlign();
  initHeroSvgTrackScroll();
  initHeroLinesScroll();
  initServicesSvgTrackScroll();
  initServicesPageHeroScroll();
  initConversationSvgScroll();
  initHeroSvgTracksScroll();
  initHeroSvgTracksBtmScroll();
  initServiceLineDeliverableScroll();
  initServiceLineDeliverableBtmScroll();
  initDiffBtmSvgScroll();
  initWhenYouNeedThisSvgScroll();
  initSkipTheDeskScroll();
  initSkipTheDeskBtmScroll();
  initLetterform();
  initStrategyLineSync();
  initScrollAnimations();
  initWhySthirosScroll();
  initOurStoryScroll();
  initStatCounters();
  initCursorGlow();
  initIndustriesNewScroll();
  initTrustedIndustriesScroll();
  initOurWorkHeroScroll();
  initOurWorkPageScroll();
  initRealStoriesSlider();
  initWorkholdSlider();
  initServiceAccordion();
  initWorkspeakBtmSvgScroll();
  initRepoSvgScroll();
  initInsightIndustrySvgScroll();
  initOurTwoCentsBtmSvgScroll();
  initYoursCanTooSvgScroll();
  initProductsHeroSvgScroll();
  initComplianceSvgSequenceScroll();
  initTellUsWhatSvgSequenceScroll();
  initFloatingCurves();
  initContactUsSvgScroll();
}

let appBooted = false;
function triggerBoot() {
  if (appBooted) return;
  appBooted = true;

  // Remove loading class from body
  document.body.classList.remove('loading');

  // Fade out preloader overlay
  const preloader = document.getElementById('preloader');
  if (preloader) {
    gsap.to(preloader, {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => preloader.remove()
    });
  }

  // Boot the website and animations
  boot();
}

function initPreloader() {
  // Force scroll to top and lock it
  window.scrollTo(0, 0);
  const preventScroll = (e) => {
    if (document.body.classList.contains('loading')) {
      e.preventDefault();
    }
  };
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('loading') && ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
      e.preventDefault();
    }
  }, { passive: false });

  const video = document.getElementById('preloader-video');
  if (video) {
    // Initial big scale
    gsap.set(video, { scale: 4 });

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video playing: animate scale down to normal
        gsap.to(video, { scale: 1, duration: 1.5, ease: 'power3.out' });

        // Speed up the video in the middle
        setTimeout(() => {
          gsap.to(video, { playbackRate: 2.5, duration: 1, ease: 'none' });
        }, 1000); // 1 second after starting
      }).catch(() => {
        triggerBoot();
      });
    }

    // Shrink to zero right before it ends
    let shrinkTriggered = false;
    video.addEventListener('timeupdate', () => {
      // Start shrinking 0.8 seconds before the video ends
      if (!shrinkTriggered && video.duration && (video.duration - video.currentTime) <= 0.8) {
        shrinkTriggered = true;
        // Just scale down smoothly to 0 (no extra rotation needed as the video cube already rotates)
        gsap.to(video, { scale: 0, duration: 0.8, ease: 'power2.inOut' });
      }
    });

    video.addEventListener('ended', triggerBoot);
    setTimeout(triggerBoot, 8000);
  } else {
    triggerBoot();
  }
}

// Start preloader logic when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreloader);
} else {
  initPreloader();
}

/* ══════════════════════════════════════════
   0. LENIS SMOOTH SCROLL  (drives ScrollTrigger)
══════════════════════════════════════════ */
function initLenis() {
  if (typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  // Keep ScrollTrigger in perfect sync with Lenis' virtual scroll.
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links → smooth-scroll through Lenis.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
    });
  });

  // Handle URL hash on initial page load / navigation from another page
  if (window.location.hash) {
    const hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      setTimeout(() => {
        lenis.scrollTo(hashTarget, { offset: -70 });
      }, 400);
    }
  }
}





/* ══════════════════════════════════════════
   3b. HERO → STATS RAIL HANDOFF
   The hero background image (hero_robot.png, 1920×1080, background-size: cover)
   has 4 red rails baked into its bottom-left corner. The inline <svg> in
   .hero-svg-track must *continue* those exact rails down into the stats
   section. Because the image is cover-scaled, the baked rails shift with the
   viewport — so we reproduce the same cover math here and lock the svg's scale
   and x-position to them. Result: the line stays connected on every screen.

   Measured from the PNG:  the rails exit the image bottom between x=110 and
   x=183 (widths 24/11/5/3). The svg's viewBox rails span x 0→73 with matching
   widths, so viewBox x=0 maps to image x=110 at 1:1 pixel scale.
══════════════════════════════════════════ */
function initHeroTrackAlign() {
  const hero = document.querySelector('.section-hero');
  const track = document.querySelector('.hero-svg-track');
  const svg = track && track.querySelector('svg');
  const paths = svg ? svg.querySelectorAll('path') : null;
  const corner = document.querySelector('.hero-vec-2-corner');
  if (!hero || !track || !svg || !corner || !paths) return;

  // Store original paths for responsive recalculation
  paths.forEach(p => {
    if (!p.hasAttribute('data-original-d')) {
      p.setAttribute('data-original-d', p.getAttribute('d'));
    }
  });

  const VB_W = 891;                  // initial svg viewBox width
  const HORIZ_Y = 501;               // svg viewBox y of the top of the horizontal rail run
  const grid = document.querySelector('.stats-grid');

  function shiftPath(pathStr, shiftX) {
    const regex = /([A-Za-z])|([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
    let tokens = [];
    let match;
    while ((match = regex.exec(pathStr)) !== null) tokens.push(match[0]);

    let result = '';
    let isX = true;
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (/^[A-Za-z]$/.test(token)) {
        result += token;
        isX = true;
      } else {
        if (isX) {
          let x = parseFloat(token);
          if (x > 300) x += shiftX; // Only shift the coordinates on the right side
          if (result.length > 0 && !/^[A-Za-z]$/.test(result[result.length - 1])) {
            result += ' ';
          }
          let numStr = Number.isInteger(x) ? x.toString() : x.toFixed(3);
          if (numStr === '0.000' || numStr === '-0.000') numStr = '0';
          result += numStr;
        } else {
          result += ',' + token;
        }
        isX = !isX;
      }
    }
    return result;
  }

  function apply() {
    // 1. Get scale factor directly from the corner vector (intrinsic width = 460)
    const c = corner.getBoundingClientRect();
    const s = c.width / 460;

    // 2. The exact gap from the left edge (matches hero section's var(--rail-inset))
    const railLeft = c.left;
    const t = track.getBoundingClientRect();

    // 3. Shift the right-side drop curve to match the exact center of the screen
    svg.style.marginLeft = (railLeft - t.left) + 'px';
    const centerScreen = window.innerWidth / 2;
    // The vertical drop in original viewBox is centered at x=829
    // Current pixel position of x=829 without shift: railLeft + 829 * s
    // We want: railLeft + (829 + shiftX) * s = centerScreen
    const requiredX = (centerScreen - railLeft) / s;
    const shiftX = requiredX - 829;

    paths.forEach(p => {
      const orig = p.getAttribute('data-original-d');
      p.setAttribute('d', shiftPath(orig, shiftX));
    });

    const newVbW = VB_W + shiftX;
    svg.setAttribute('viewBox', `0 0 ${newVbW} 824`);

    svg.style.maxWidth = 'none';
    svg.style.width = (newVbW * s) + 'px';           // scale to match corner precisely

    if (grid) {
      const cards = grid.querySelectorAll('.stat-card');
      if (window.innerWidth <= 768) {
        grid.style.paddingLeft = '';
        cards.forEach((card) => { card.style.height = ''; });
      } else {
        // The rightmost rail edge in hero-svg-track's viewBox is at x=74
        const railRight = railLeft + (74 * s);
        const gridLeft = grid.getBoundingClientRect().left;
        grid.style.paddingLeft = Math.max(0, railRight + 8 - gridLeft) + 'px'; // ~touch the rail

        const horizTop = svg.getBoundingClientRect().top + window.scrollY + HORIZ_Y * s;
        cards.forEach((card) => {
          // Temporarily remove transform to get the true untranslated top
          const currentTransform = card.style.transform;
          card.style.transform = 'none';

          const cardTop = card.getBoundingClientRect().top + window.scrollY;
          card.style.height = Math.max(0, horizTop - cardTop) + 'px';

          // Restore transform
          card.style.transform = currentTransform;
        });
      }
    }
  }

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('load', apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
}

function initHeroSvgTrackScroll() {
  const trackSvg = document.querySelector('.hero-svg-track svg');
  if (trackSvg) {
    // Hide using a circle at the true starting point of the SVG path (top-left)
    gsap.set(trackSvg, { clipPath: 'circle(0% at 0% 0%)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.section-stats',
        start: 'top 55%', // Start slightly after hero SVG finishes
        end: 'bottom 75%', // Finish before the next section starts
        scrub: true, // Strict scrub to prevent overlap delay
      }
    });

    // Draw the SVG line
    tl.to(trackSvg, {
      clipPath: 'circle(150% at 0% 0%)',
      ease: 'none',
      duration: 1
    });

    // Animate the cards to load
    const cards = document.querySelectorAll('.section-stats .stat-card');
    if (cards.length) {
      gsap.fromTo(cards,
        { opacity: 0, x: 100 },
        { 
          opacity: 1, 
          x: 0, 
          stagger: 0.1, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.section-stats',
            start: 'top 90%', // Starts earlier, when section just enters viewport
            end: 'top 50%', // Finishes fully before the SVG line scrubs into them
            scrub: true
          }
        }
      );
    }
  }

  // Animate the 'WHAT WE DO' text after the SVG line finishes
  const eyebrow = document.getElementById('services-eyebrow');
  const title = document.getElementById('services-title');

  if (eyebrow && title) {
    // Helper function to split text nodes into individual letter spans
    function splitToLetters(el) {
      const fragment = document.createDocumentFragment();
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeType === 3) {
          const chars = node.textContent.split('');
          chars.forEach(char => {
            if (char.trim() === '') {
              fragment.appendChild(document.createTextNode(char));
            } else {
              const span = document.createElement('span');
              span.textContent = char;
              span.style.display = 'inline-block';
              span.className = 'letter';
              fragment.appendChild(span);
            }
          });
        } else if (node.nodeType === 1) {
          if (node.tagName !== 'BR') {
            splitToLetters(node);
          }
          fragment.appendChild(node);
        }
      });
      el.innerHTML = '';
      el.appendChild(fragment);
    }

    splitToLetters(eyebrow);
    splitToLetters(title);

    const letters = [...eyebrow.querySelectorAll('.letter'), ...title.querySelectorAll('.letter')];

    gsap.set(letters, { transformPerspective: 1000 });
    gsap.fromTo(letters,
      {
        y: 40,
        opacity: 0,
        rotationX: -45,
        scale: 0.9,
        filter: 'blur(5px)'
      },
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.6,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: eyebrow,
          start: 'top 75%',
          end: 'top 35%',
          scrub: 1
        }
      }
    );
  }
}

function initHeroLinesScroll() {
  const vec1 = document.querySelector('.hero-vec-1');
  const vec2 = document.querySelector('.hero-vec-2-wrapper');

  if (vec1 || vec2) {
    // Hide initially using a circle at top right
    if (vec1) gsap.set(vec1, { clipPath: 'circle(0% at 100% 0%)' });
    if (vec2) gsap.set(vec2, { clipPath: 'circle(0% at 100% 0%)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.section-hero',
        start: 'top top',
        end: 'bottom 55%', // Finish completely before the next section hits top 55%
        scrub: true, // Strict scrub to prevent overlap delay
      }
    });

    if (vec1) {
      tl.to(vec1, { clipPath: 'circle(150% at 100% 0%)', ease: 'none', duration: 1 });
    }
    if (vec2) {
      // vec2 connects to the end of vec1, so we start it after vec1's animation finishes
      tl.to(vec2, { clipPath: 'circle(150% at 100% 0%)', ease: 'none', duration: 0.4 });
    }
  }
}

function initContactUsSvgScroll() {
  const heroSvg = document.querySelector('#herosvgsecdivcont svg');
  const btmSvg = document.querySelector('#btmsvgsecdiv svg');

  if (heroSvg) gsap.set(heroSvg, { clipPath: 'circle(0% at 100% 0%)' });
  if (btmSvg) gsap.set(btmSvg, { clipPath: 'circle(0% at 0% 0%)' });

  if (heroSvg) {
    gsap.to(heroSvg, {
      clipPath: 'circle(150% at 100% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.contact-hero',
        start: 'top top',
        end: 'bottom top', // maximizing the scroll distance
        scrub: 2
      }
    });
  }

  if (btmSvg) {
    gsap.to(btmSvg, {
      clipPath: 'circle(150% at 0% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.contact-hero',
        start: 'bottom top', // starts immediately after heroSvg finishes
        endTrigger: '.work-section',
        end: 'bottom top', // stretches until section leaves
        scrub: 2
      }
    });
  }
}

function initServicesSvgTrackScroll() {
  if (window.innerWidth <= 768) return;
  const servicesSvg = document.querySelector('.services-rail .first-svg');
  if (servicesSvg) {
    // Initial state: hidden at the top
    gsap.set(servicesSvg, { clipPath: 'polygon(0% 0%, 16% 0%, 16% 0%, 16% 0%, 16% 0%, 0% 0%)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.services-rail',
        start: 'top 65%', // Starts drawing when rail reaches near center
        end: () => '+=' + (window.innerHeight * 1.2), // Finishes exactly when Part 1A horizontal scroll finishes
        scrub: true, // Use strict scrub (no lag) so it doesn't bleed into the logo trace sequence
      }
    });

    // Step 1: Wipe down the vertical part (approx 1/3 of the total distance)
    tl.to(servicesSvg, {
      clipPath: 'polygon(0% 0%, 16% 0%, 16% 85%, 16% 85%, 16% 100%, 0% 100%)',
      ease: 'none',
      duration: 1
    });

    // Step 2: Wipe right along the horizontal part (approx 2/3 of the total distance)
    tl.to(servicesSvg, {
      clipPath: 'polygon(0% 0%, 16% 0%, 16% 85%, 200% 85%, 200% 100%, 0% 100%)',
      ease: 'none',
      duration: 2
    });
  }
}

/* ══════════════════════════════════════════
   3. THE JOURNEY TRACK — key feature
══════════════════════════════════════════ */
function initJourneyTrack() {
  const svgEl = document.getElementById('journey-svg');
  const container = document.getElementById('svg-container');
  const railsG = document.getElementById('rails');
  const shadow = document.getElementById('path-shadow');
  const marker = document.getElementById('dot-group');
  if (!svgEl || !railsG || !shadow || !marker) return;

  // ── geometry config ──────────────────────────────────────────
  // Rail spacing/width taken from the uploaded SVG (test.svg): 3 parallel lines
  // with varying widths and offsets.
  const RAILS_CONFIG = [
    { offset: -19.66, width: 24.5 },
    { offset: 10.96, width: 12.3 },
    { offset: 28.81, width: 6.2 }
  ];
  const CORNER = 88.5;                  // turn radius (centerline)
  const SAMPLE_STEP = 7;                         // px between offset samples

  let centerLen = 0; // total length of the centerline (shadow)
  let rails = [];     // [{el, len}]
  let samples = [];   // [{l, y}] centerline length↔Y lookup
  let pageH = 0;      // full document height

  // ── helpers ──────────────────────────────────────────────────
  // Rounded polyline → path "d" (quadratic corners; works for any angle).
  function roundedPolyline(pts, radius) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const r = Math.min(radius, d1 / 2, d2 / 2);
      const c1 = { x: p1.x + (p0.x - p1.x) / d1 * r, y: p1.y + (p0.y - p1.y) / d1 * r };
      const c2 = { x: p1.x + (p2.x - p1.x) / d2 * r, y: p1.y + (p2.y - p1.y) / d2 * r };
      d += ` L ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}`;
      d += ` Q ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    return d;
  }

  // Build an offset rail by sampling the centerline along its normal.
  function offsetRailPath(centerEl, total, offset) {
    const n = Math.max(2, Math.round(total / SAMPLE_STEP));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const l = (i / n) * total;
      const p = centerEl.getPointAtLength(l);
      const pa = centerEl.getPointAtLength(Math.max(0, l - 1));
      const pb = centerEl.getPointAtLength(Math.min(total, l + 1));
      let tx = pb.x - pa.x, ty = pb.y - pa.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const nx = -ty, ny = tx; // left normal
      const x = (p.x + nx * offset).toFixed(2);
      const y = (p.y + ny * offset).toFixed(2);
      d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
    }
    return d;
  }

  // Compute the serpentine waypoints from the real section positions.
  function buildWaypoints(W, H) {
    const leftX = Math.max(56, W * 0.16);
    const rightX = Math.min(W - 70, W * 0.66);

    // Anchor Y levels where the track turns — derived from sections so the
    // track threads through the page no matter how tall the content grows.
    const ids = ['hero', 'about', 'industries', 'services', 'approach', 'contact'];
    const levels = [];
    ids.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.offsetTop;
      const h = el.offsetHeight;
      // turn roughly in the lower third of hero, centre of the rest
      levels.push(top + h * (idx === 0 ? 0.72 : 0.5));
    });

    const pts = [];
    let x = rightX;                 // hero: track enters on the right
    pts.push({ x, y: -40 });        // start just above the viewport
    levels.forEach((y) => {
      pts.push({ x, y });           // vertical run down to this level
      x = (x === leftX) ? rightX : leftX;
      pts.push({ x, y });           // horizontal jog to the other lane
    });
    pts.push({ x, y: H + 40 });     // run off the bottom
    return pts;
  }

  // ── (re)build the whole track ────────────────────────────────
  function buildTrack() {
    container.style.height = '0px';            // don't let the svg inflate the page
    const W = window.innerWidth;
    const H = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    container.style.height = H + 'px';
    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

    pageH = H;

    // 1) centerline (also the soft glow underlay)
    const centerD = roundedPolyline(buildWaypoints(W, H), CORNER);
    shadow.setAttribute('d', centerD);
    centerLen = shadow.getTotalLength();

    // length↔Y lookup so the drawn tip tracks the scroll depth (the path's
    // horizontal runs don't otherwise advance the vertical position).
    samples = [];
    const sn = Math.max(60, Math.round(centerLen / 12));
    for (let i = 0; i <= sn; i++) {
      const l = (i / sn) * centerLen;
      samples.push({ l, y: shadow.getPointAtLength(l).y });
    }

    // 2) the 3 parallel rails, sampled off the centerline normal
    railsG.innerHTML = '';
    rails = [];
    RAILS_CONFIG.forEach((config) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', offsetRailPath(shadow, centerLen, config.offset));
      p.setAttribute('class', 'rail');
      p.setAttribute('stroke', '#EC2D26');
      p.setAttribute('stroke-width', config.width);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('fill', 'none');
      p.setAttribute('opacity', '1');
      p.setAttribute('filter', 'url(#glow-red)');
      railsG.appendChild(p);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      rails.push({ el: p, len });
    });

    // 3) shadow dash
    shadow.style.strokeDasharray = centerLen;
    shadow.style.strokeDashoffset = centerLen;

    drawAt(currentProgress); // keep current scroll state after a rebuild
  }

  // centerline length at a given document Y (monotonic: the track only
  // ever travels downward, so Y increases along its length).
  function lengthAtY(ty) {
    if (!samples.length || ty <= samples[0].y) return 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i].y >= ty) {
        const a = samples[i - 1], b = samples[i];
        const f = (b.y === a.y) ? 1 : (ty - a.y) / (b.y - a.y);
        return a.l + (b.l - a.l) * f;
      }
    }
    return centerLen;
  }

  // ── draw + travel for a given scroll progress (0→1) ──────────
  let currentProgress = 0;
  function drawAt(p) {
    currentProgress = p;
    if (!centerLen || !samples.length) return; // track not built yet
    const vh = window.innerHeight;
    const scrollY = p * Math.max(1, pageH - vh);
    // draw the track to ~0.6 viewport ahead of the top edge, so the glowing
    // tip is always visible in the lower part of the screen as you scroll.
    const targetY = Math.min(pageH, scrollY + vh * 0.6);
    const targetLen = lengthAtY(targetY);
    const frac = centerLen ? targetLen / centerLen : 0;

    shadow.style.strokeDashoffset = centerLen * (1 - frac);
    rails.forEach((r) => { r.el.style.strokeDashoffset = r.len * (1 - frac); });

    const pt = shadow.getPointAtLength(Math.max(0, Math.min(centerLen, targetLen)));
    gsap.set(marker, { x: pt.x, y: pt.y });
  }

  // ── build the track first, THEN wire up the scroll scrub ─────
  buildTrack();

  // ── scrub the draw to the page scroll ────────────────────────
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,
    onUpdate(self) { drawAt(self.progress); }
  });

  // ── marker "life" ────────────────────────────────────────────
  // Anime.js drives the rotating sci-fi dashes (a child <rect>, so it never
  // fights GSAP for the group's transform). The idle scale pulse uses GSAP
  // so it composes cleanly with the getPointAtLength translate.
  if (typeof anime !== 'undefined') {
    anime({
      targets: marker.querySelector('rect[stroke]'),
      strokeDashoffset: [10, -44],
      easing: 'linear',
      duration: 2600,
      loop: true
    });
  }
  gsap.to(marker, {
    scale: 1.06,
    transformOrigin: 'center center',
    duration: 1.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  // ── rebuild on resize (debounced) ────────────────────────────
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { buildTrack(); ScrollTrigger.refresh(); }, 200);
  });
  // rebuild once images/fonts settle the layout
  window.addEventListener('load', () => { buildTrack(); ScrollTrigger.refresh(); });
}

/* ══════════════════════════════════════════
   4. LETTERFORM MOMENT — the track resolves into "S"
══════════════════════════════════════════ */
function initLetterform() {
  const letter = document.getElementById('letterform-s');
  if (!letter) return;

  gsap.fromTo(letter,
    { opacity: 0, x: -60, scale: 0.9 },
    {
      opacity: 1, x: 0, scale: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#services',
        start: 'top 70%',
        end: 'top 20%',
        scrub: 1
      }
    }
  );

  // gentle float
  gsap.to(letter, {
    y: '-=14',
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });
}

/* ══════════════════════════════════════════
   4.5 SYNC STRATEGY LINE SCALE
   The user requested that the "Strategy" line (.second-svg) and the 
   "WHAT WE DO" line (.first-svg) have exactly the same height/thickness.
   Since .first-svg scales dynamically with the screen width, we calculate 
   its scale factor and apply it perfectly to .second-svg.
══════════════════════════════════════════ */
function initStrategyLineSync() {
  const firstSvg = document.querySelector('.first-svg');
  const secondSvg = document.querySelector('.second-svg');
  const riskSection = document.querySelector('.risk-inline-section');
  const cyberSection = document.querySelector('.cyber-inline-section');
  if (!firstSvg || !secondSvg) return;

  function sync() {
    if (window.innerWidth <= 768) return;
    const firstWidth = firstSvg.getBoundingClientRect().width;
    // first-svg's viewBox width is 991
    const scale = firstWidth / 991;

    // second-svg's viewBox is 2500 x 900
    secondSvg.style.width = (2500 * scale) + 'px';
    secondSvg.style.height = (900 * scale) + 'px';

    if (riskSection) {
      // 2180 is approx the x-coordinate where the vertical lines drop in second-svg
      // 700 is the y-coordinate where they end
      riskSection.style.left = `calc(100% + 15px + ${2180 * scale}px)`;
      riskSection.style.top = `calc(3% + ${700 * scale}px)`;
    }

    if (cyberSection) {
      // risk-horiz-svg: viewBox "0 0 1500 72", lines go up to y=-600 at x≈1650
      // The risk-horiz-rail is at left: calc(100% + 15px) of risk-logo-box
      // risk-logo-box img width = 340px
      // So cyber section is positioned relative to risk-logo-box:
      //   - x: same as where the risk lines end horizontally (the leftmost upward line = x=1650 in SVG viewBox)
      //     risk-horiz-svg width = 1200px => svgScale = 1200/1500 = 0.8
      //     endpoint x in rail = 1650 * 0.8 = 1320px from rail left edge
      //     rail left = 340px (img) + 15px = 355px from risk-logo-box left
      //     So total left = 355 + 1320 = 1675px... but we want it centered on the lines
      //     Use 1650 (midpoint of the 4 upward lines) * 0.8 ≈ 1320 + 355 = 1675px
      //   - y: the upward lines end at y=-600 SVG units = -600 * 0.8 = -480px above the SVG top
      //     SVG top = risk-logo-box 50% height - svg_height/2
      //     cyber-inline-section top relative to risk-logo-box:

      const riskLogoBox = document.querySelector('.risk-logo-box');
      const riskHorizSvg = document.querySelector('.risk-horiz-svg');
      if (riskLogoBox && riskHorizSvg) {
        const boxRect = riskLogoBox.getBoundingClientRect();
        const svgRect = riskHorizSvg.getBoundingClientRect();
        const svgScale = svgRect.width / 1500;

        // Endpoint of the newly added left curve in page coords
        // The line ends at x=1480, and we want the logo center at y=-820 in the SVG viewBox to increase gap with the curve
        const endpointPageX = svgRect.left + 1480 * svgScale;
        const endpointPageY = svgRect.top + (-820 * svgScale); // negative = above SVG top

        // Convert to position relative to risk-logo-box (CSS absolute positioning)
        const cyberLeft = endpointPageX - boxRect.left;
        const cyberTop = endpointPageY - boxRect.top;

        // Place the cyber logo to the left of the endpoint, with an extra 40px gap
        cyberSection.style.left = (cyberLeft - 380) + 'px'; // -340 (logo width) - 40 (gap)
        cyberSection.style.top = (cyberTop - 170) + 'px';   // -170 to center vertically around the new -820 y-coord
      }
    }

    const aiSection = document.querySelector('.ai-inline-section');
    if (aiSection && cyberSection) {
      const cyberLogoBox = document.querySelector('.cyber-logo-box');
      const cyberHorizSvg = document.querySelector('.cyber-horiz-svg');
      if (cyberLogoBox && cyberHorizSvg) {
        const boxRect = cyberLogoBox.getBoundingClientRect();
        const svgRect = cyberHorizSvg.getBoundingClientRect();
        const svgScale = svgRect.width / 1500;

        // Endpoint of the cyber SVG curve is at X=1150, Y=966 (avg of the lines)
        const endpointPageX = svgRect.left + 1150 * svgScale;
        const endpointPageY = svgRect.top + (966 * svgScale);

        const aiLeft = endpointPageX - boxRect.left;
        const aiTop = endpointPageY - boxRect.top;

        // Place the AI logo to the left of the endpoint with a slight gap
        aiSection.style.left = (aiLeft - 360) + 'px'; // -340 logo width - 20px gap
        aiSection.style.top = (aiTop - 170) + 'px';   // -170 to center vertically
      }
    }
  }

  sync();
  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);
}

function syncRiskLogoPosition(scale) {
  // Logic removed as the Risk section is now inline horizontally with Strategy
}

/* ══════════════════════════════════════════
   5. SCROLL-TRIGGERED SECTION ANIMATIONS
══════════════════════════════════════════ */
function initScrollAnimations() {
  gsap.utils.toArray('[data-animate="fade-up"]').forEach((el) => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.9,
        delay: parseFloat(el.style.getPropertyValue('--delay')) || 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  gsap.utils.toArray('[data-animate="slide-right"]').forEach((el) => {
    gsap.fromTo(el,
      { x: -40, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.8,
        delay: parseFloat(el.style.getPropertyValue('--delay')) || 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });


  gsap.from('.industry-card', {
    y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.industries-grid', start: 'top 85%' }
  });




  function updateHeroDate() {
    const dateEl = document.getElementById('hero-date');
    if (!dateEl) return;
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const timeString = now.toLocaleTimeString('en-US');
    dateEl.textContent = `${month}/${day}, ${timeString}`;
  }
  setInterval(updateHeroDate, 1000);
  updateHeroDate();

  gsap.to('#hero-img', {
    y: -40, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Horizontal scroll animation for the services rail SVG (Desktop + Mobile matchMedia)
  const servicesRail = document.querySelector('.services-rail');
  const servicesTrack = document.querySelector('.services-track');
  const riskLogo = document.querySelector('.risk-logo');

  if (servicesRail && servicesTrack) {
    const mm = gsap.matchMedia();

    // ══════════════════════════════════════════
    // DESKTOP: (min-width: 769px) - 100% UNTOUCHED
    // ══════════════════════════════════════════
    mm.add("(min-width: 769px)", () => {
    ScrollTrigger.create({
      trigger: servicesRail,
      start: () => {
        const lineOffset = 800 * (window.innerWidth * 0.5 / 991);
        return `top+=${lineOffset - 190}px center`;
      },
      end: () => {
        const vw = window.innerWidth;
        const scale = (vw * 0.5) / 991;
        const stratLogoW = 380;
        const riskX = 1.25 * vw + 10 + stratLogoW + 15 + 2180 * scale;
        const targetX = Math.abs(-(riskX - vw / 2));
        const riskY = 700 * scale;
        const riskHorizScroll = 1159; // precise center-to-center distance
        const riskVertScrollUP = 685; // 684.8 rounded
        const cyberHorizScroll = 1170; // 210 (offset) + 960 (1200 * 0.8)
        const cyberVertScrollDOWN = 966 * scale; // Match the actual animation distance
        // Added 400 for a small pause at the end before unpinning
        return `+=${targetX + riskY + riskHorizScroll + riskVertScrollUP + cyberHorizScroll + cyberVertScrollDOWN + 400}`;
      },
      pin: true,
      animation: (() => {
        const tl = gsap.timeline();

        // Prepare Strategy animations initial states
        const sTracePath = document.querySelector('#s-trace-path');
        const strategyLogoWrapper = document.querySelector('.strategy-logo-trace-wrapper');
        const strategyContentChildren = document.querySelectorAll('.strategy-content > *');
        const strategySvg = document.querySelector('.second-svg');
        const strategyLines = document.querySelectorAll('.second-svg .strategy-line');

        if (sTracePath && strategyLogoWrapper && strategyContentChildren.length && strategySvg) {
          gsap.set(strategyLogoWrapper, { opacity: 1 });
          // Use hardcoded length (1050) because getTotalLength() inside <mask> can be unreliable in some browsers
          const pathLength = 1050;
          gsap.set(sTracePath, { strokeDasharray: pathLength + 10, strokeDashoffset: pathLength + 10 });
          gsap.set(strategyContentChildren, { opacity: 0, y: 40 });

          strategyLines.forEach(line => {
            const len = line.getTotalLength();
            gsap.set(line, { strokeDasharray: len + 10, strokeDashoffset: len + 10, opacity: 0 });
          });
        }

        // Part 1A: Horizontal scroll (move X to bring Strategy Logo precisely to center)
        tl.to(servicesTrack, {
          x: () => {
            const vw = window.innerWidth;
            const stratLogoX = 1.25 * vw + 10 + (350 / 2); // Center of logo
            return -(stratLogoX - vw / 2);
          },
          ease: 'none',
          duration: 0.6
        }, "horiz1a");

        // Part 1B: Trace Logo and Show Text (Screen X scroll is paused here!)
        tl.add("logoTrace");

        if (sTracePath && strategyContentChildren.length && strategySvg) {
          tl.to(sTracePath, { strokeDashoffset: 0, ease: 'none', duration: 0.4 }, "logoTrace")
            .to(strategyContentChildren, { opacity: 1, y: 0, duration: 0.2, stagger: 0.05, ease: 'power3.out' });
        }

        // Fade out the previous SVG track and the "Four disciplines" text WHILE the logo is tracing
        const firstSvg = document.querySelector('.services-rail .first-svg');
        const sectionCenter = document.querySelector('.section-center');
        if (firstSvg) {
          tl.to(firstSvg, { opacity: 0, ease: 'none', duration: 0.4 }, "logoTrace");
        }
        if (sectionCenter) {
          tl.to(sectionCenter, { opacity: 0, ease: 'none', duration: 0.4 }, "logoTrace");
        }

        // Part 1C: Continue Horizontal scroll to Risk vertical drop AND draw Strategy SVG line
        tl.to(servicesTrack, {
          x: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const stratLogoW = 380;
            const riskX = 1.25 * vw + 10 + stratLogoW + 15 + 2180 * scale;
            return -(riskX - vw / 2);
          },
          ease: 'none',
          duration: 0.6
        }, "horiz1b");

        if (strategySvg && strategyLines.length > 0) {
          tl.to(strategyLines, { opacity: 1, duration: 0.01 }, "horiz1b")
            .to(strategyLines, { strokeDashoffset: 0, ease: 'none', duration: 0.85 }, "horiz1b");
        }

        // PAUSE REMOVED: Strategy curve pans smoothly without stopping

        // Fix timeline gap: start vertical pan exactly when horizontal pan ends
        tl.add("vert1", "horiz1b+=0.6");

        // Part 2: Vertical pan (move Y down to exactly center the logo)
        tl.to(servicesTrack, {
          y: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const firstSvg = document.querySelector('.first-svg');
            const lineOffset = firstSvg.getBoundingClientRect().height * 0.535;
            const riskVertOffset = 120; // Pans camera UP by 120px to reveal Risk text
            return (lineOffset - 190) - (700 * scale) - riskVertOffset;
          },
          ease: 'none',
          duration: 0.8
        }, "vert1");

        // Prepare Risk animations initial states
        const riskLogo = document.querySelector('.risk-service-img');
        const riskTextBlock = document.querySelector('.risk-text-block');
        const riskHlines = document.querySelectorAll('.risk-hline');

        if (riskLogo && riskTextBlock) {
          gsap.set(riskLogo, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }); // Hidden (wipe from top to bottom)
          gsap.set(riskTextBlock.children, { opacity: 0, y: 40 });
        }
        if (riskHlines.length) {
          riskHlines.forEach(line => {
            const len = line.getTotalLength();
            gsap.set(line, { strokeDasharray: len + 10, strokeDashoffset: len + 10, opacity: 0 });
          });
        }

        // Part 2B: Trace Risk Logo and Show Text (Camera paused)
        tl.add("riskTrace");
        if (riskLogo && riskTextBlock) {
          tl.to(riskLogo, { opacity: 1, duration: 0.01 }, "riskTrace")
            .to(riskLogo, { clipPath: 'inset(0 0 0% 0)', ease: 'none', duration: 0.4 }, "riskTrace")
            .to(riskTextBlock.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power3.out' });
        }

        // Fade out previous SVG track and the Strategy logo/text WHILE the Risk logo is tracing
        const secondSvg = document.querySelector('.services-rail .second-svg');
        const strategyWrapper = document.querySelector('.strategy-logo-trace-wrapper');
        const strategyContent = document.querySelector('.strategy-content');
        if (secondSvg) {
          tl.to(secondSvg, { opacity: 0, ease: 'none', duration: 0.4 }, "riskTrace");
        }
        if (strategyWrapper) {
          tl.to(strategyWrapper, { opacity: 0, ease: 'none', duration: 0.4 }, "riskTrace");
        }
        if (strategyContent) {
          tl.to(strategyContent, { opacity: 0, ease: 'none', duration: 0.4 }, "riskTrace");
        }

        // Part 3: Horizontal scroll (move X left to pan right along Risk lines) AND draw Risk lines
        tl.to(servicesTrack, {
          x: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const stratLogoW = 380;
            const riskX = 1.25 * vw + 10 + stratLogoW + 15 + 2180 * scale;
            // Center to center distance is exactly 1159px
            return -(riskX - vw / 2 + 1159);
          },
          ease: 'none',
          duration: 1
        }, "horiz2");

        if (riskHlines.length) {
          tl.to(riskHlines, { opacity: 1, duration: 0.01 }, "horiz2")
            .to(riskHlines, { strokeDashoffset: 0, ease: 'none', duration: 1.8 }, "horiz2");
        }

        // PAUSE REMOVED: Risk curve pans smoothly without stopping

        // Fix timeline gap: start vertical pan exactly when horizontal pan ends
        tl.add("vert2", "horiz2+=1");

        // Part 4: Vertical pan (move Y down so camera follows the line UP)
        tl.to(servicesTrack, {
          y: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const firstSvg = document.querySelector('.first-svg');
            const lineOffset = firstSvg.getBoundingClientRect().height * 0.535;
            const riskVertOffset = 120;
            let cyberBonus = 0;
            if (vw <= 1366) cyberBonus = 120;
            return (lineOffset - 190) - (700 * scale) + 684.8 - riskVertOffset + cyberBonus; // Move track DOWN by exactly 684.8px to perfectly center Cyber logo
          },
          ease: 'none',
          duration: 0.8
        }, "vert2");

        // Prepare Cyber animations initial states
        const cyberLogoWrapper = document.querySelector('.cyber-logo-trace-wrapper');
        const cTracePath = document.querySelector('#c-trace-path');
        const cyberTextBlock = document.querySelector('.cyber-text-block');
        const cyberHlines = document.querySelectorAll('.cyber-hline');

        if (cTracePath && cyberLogoWrapper && cyberTextBlock) {
          const pathLength = cTracePath.getTotalLength();
          // Use a large gap to prevent round linecap from leaking backwards from the next dash
          gsap.set(cTracePath, { strokeDasharray: (pathLength + 10) + " " + (pathLength + 2000), strokeDashoffset: pathLength + 10 });
          gsap.set(cyberTextBlock.children, { opacity: 0, y: 40 });
        }
        if (cyberHlines.length) {
          cyberHlines.forEach(line => {
            const len = line.getTotalLength();
            gsap.set(line, { strokeDasharray: len + 10, strokeDashoffset: len + 10, opacity: 0 });
          });
        }

        // Part 4B: Trace Cyber Logo and Show Text (Camera paused)
        tl.add("cyberTrace");
        if (cTracePath && cyberLogoWrapper && cyberTextBlock) {
          tl.to(cTracePath, { strokeDashoffset: 0, ease: 'none', duration: 0.4 }, "cyberTrace")
            .to(cyberLogoWrapper, { opacity: 1, duration: 0.01 }, "cyberTrace")
            .to(cyberTextBlock.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power3.out' });
        }

        // Fade out previous Risk logo/text and lines WHILE Cyber logo is tracing
        const riskImg = document.querySelector('.risk-service-img');
        const riskRail = document.querySelector('.risk-horiz-rail');
        const riskText = document.querySelector('.risk-text-block');
        if (riskImg) tl.to(riskImg, { opacity: 0, ease: 'none', duration: 0.4 }, "cyberTrace");
        if (riskRail) tl.to(riskRail, { opacity: 0, ease: 'none', duration: 0.4 }, "cyberTrace");
        if (riskText) tl.to(riskText, { opacity: 0, ease: 'none', duration: 0.4 }, "cyberTrace");

        // Part 5: Horizontal scroll (move X left to pan right along Cyber lines) AND draw Cyber lines
        tl.to(servicesTrack, {
          x: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const stratLogoW = 380;
            const riskX = 1.25 * vw + 10 + stratLogoW + 15 + 2180 * scale;
            const cyberHorizScroll = 1170; // precisely to the center of the downward curve
            let aiCenterBonus = 0;
            if (vw <= 1280) {
              aiCenterBonus = 350; // Move track less to the left so AI logo is centered
            }
            return -(riskX - vw / 2 + 1159 + cyberHorizScroll) + aiCenterBonus;
          },
          ease: 'none',
          duration: 1
        }, "horiz3");

        if (cyberHlines.length > 0) {
          tl.to(cyberHlines, { opacity: 1, duration: 0.01 }, "horiz3")
            .to(cyberHlines, { strokeDashoffset: 0, ease: 'none', duration: 1.8 }, "horiz3");
        }

        // PAUSE REMOVED: before drop

        // Fix timeline gap: start vertical pan exactly when horizontal pan ends
        tl.add("vert3", "horiz3+=1");

        // Part 6: Vertical pan (move Y up so camera follows the Cyber line DOWN)
        tl.to(servicesTrack, {
          y: () => {
            const vw = window.innerWidth;
            const scale = (vw * 0.5) / 991;
            const firstSvg = document.querySelector('.first-svg');
            const lineOffset = firstSvg.getBoundingClientRect().height * 0.535;
            const riskVertOffset = 120;
            let cyberBonus = 0;
            if (vw <= 1366) cyberBonus = 120;
            let aiUpBonus = 0;
            if (vw <= 1280) aiUpBonus = 150; // Extra pan up so AI isn't cut off at the bottom
            // The vertical distance between Cyber logo and AI logo is exactly 966 * scale
            const cyberVertScrollDOWN = 966 * scale;
            return (lineOffset - 190) - (700 * scale) + 684.8 - riskVertOffset + cyberBonus - cyberVertScrollDOWN - aiUpBonus; // move track UP by exactly the distance
          },
          ease: 'none',
          duration: 0.8
        }, "vert3");

        // Prepare AI animations initial states
        const aiLogo = document.querySelector('.ai-service-img');
        const aiTextBlock = document.querySelector('.ai-text-block');

        if (aiLogo && aiTextBlock) {
          gsap.set(aiLogo, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }); // Fully hidden
          gsap.set(aiTextBlock.children, { opacity: 0, y: 40 });
        }

        // Part 7: Trace AI Logo and Show Text (Camera paused at final position)
        tl.add("aiTrace");
        if (aiLogo && aiTextBlock) {
          tl.to(aiLogo, { opacity: 1, duration: 0.01 }, "aiTrace")
            .to(aiLogo, { clipPath: 'inset(0 0 0% 0)', ease: 'none', duration: 0.4 }, "aiTrace")
            .to(aiTextBlock.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power3.out' }, "aiTrace");
        }

        // Fade out Cyber's horizontal rail while AI is tracing
        const cyberHorizRail = document.querySelector('.cyber-horiz-rail');
        if (cyberHorizRail) {
          tl.to(cyberHorizRail, { opacity: 0, ease: 'none', duration: 0.4 }, "aiTrace");
        }

        // Part 8: Wait slightly after AI text loads so user can read it before unpinning
        tl.to({}, { duration: 0.6 });

        return tl;
      })(),
      scrub: true,
      invalidateOnRefresh: true
    });

    // Fade out servicesTrack natively as the next section comes into view
    gsap.to(servicesTrack, {
      opacity: 0,
      scrollTrigger: {
        trigger: '.section-why',
        start: window.innerWidth <= 1024 ? 'top bottom-=200' : 'top bottom-=100', // Delay fade out so AI stays visible longer
        end: window.innerWidth <= 1024 ? 'top center-=100' : 'top center-=100',
        scrub: true
      }
    });
  
    });

    // ══════════════════════════════════════════
    // MOBILE: Dedicated Scroll-Track Journey
    // ══════════════════════════════════════════
    mm.add("(max-width: 768px)", () => {
      // Mobile runs its own, completely separate Four Pillars journey —
      // see initMobileServicesRail(). The desktop rail above is untouched.
      return initMobileServicesRail();
    });
  }

  gsap.from('#footer', {
    opacity: 0, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '#footer', start: 'top 95%' }
  });
}

/* ══════════════════════════════════════════
   5.5 WHY STHIROS SLIDES
══════════════════════════════════════════ */
function initWhySthirosScroll() {
  const section = document.querySelector('.section-why');
  const slides = document.querySelectorAll('.why-slide');
  if (!section || slides.length < 4) return;

  const whyLines = document.querySelectorAll('.why-line');
  whyLines.forEach(line => {
    const len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len + 10, strokeDashoffset: len + 10, opacity: 0 });
  });

  // Heading + intro paragraph start hidden and fade in slightly after the
  // line has already started drawing, so the line visibly leads in.
  const whyHeading = section.querySelector('.section-title');
  const whyDesc = section.querySelector('.why-intro-desc');
  if (whyHeading && whyDesc) {
    gsap.set([whyHeading, whyDesc], { opacity: 0, y: 30 });
    gsap.to([whyHeading, whyDesc], {
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: section,
        start: 'top 60%', // A bit after the line starts (top 75%)
        end: 'top 25%',
        scrub: 1.2
      }
    });
  }

  // ── UNPINNED TIMELINE (Draws line to 50% while scrolling into view) ──
  const tlUnpinned = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 75%', // Starts before the heading fades in
      end: 'center center',
      scrub: 1.2
    }
  });

  tlUnpinned.to(whyLines, {
    opacity: 1,
    // +150 compensates for the extra straight segment added at the path's
    // start (see index.html) so the reveal still pauses at the same point
    // behind the cards as before, just with the extension drawn in first.
    strokeDashoffset: (i, el) => el.getTotalLength() - (1150 + 150), // Pauses halfway behind the cards
    ease: "none"
  });

  // ── PINNED TIMELINE (Card slides only) ──
  const tlPinned = gsap.timeline({
    scrollTrigger: {
      id: "whyPin",
      trigger: section,
      start: 'center center',
      end: '+=2500', // Only for slide transitions
      pin: true,
      scrub: 1.2
    }
  });

  // Reset slides, fully opaque
  gsap.set(slides, { opacity: 1, y: 0, clipPath: 'none' });

  // ── INIT STATES ──
  gsap.set('#why-slide-1 .why-text-block', { clipPath: 'inset(0% 0% 0% 0%)', y: 0 });
  gsap.set('#why-slide-1 .why-image-block', { clipPath: 'inset(0% 0% 0% 0%)', x: 0 });

  gsap.set(['#why-slide-2 .why-text-block', '#why-slide-3 .why-text-block', '#why-slide-4 .why-text-block'], {
    clipPath: 'inset(100% 0% 0% 0%)',
    y: 80
  });
  gsap.set(['#why-slide-2 .why-image-block', '#why-slide-3 .why-image-block', '#why-slide-4 .why-image-block'], {
    clipPath: 'inset(0% 0% 0% 100%)',
    x: 100
  });

  function transitionSlides(outSlide, inSlide, timeLabel) {
    tlPinned.to(`${outSlide} .why-text-block`, { clipPath: 'inset(0% 0% 100% 0%)', y: -80, duration: 0.2, ease: 'power1.inOut' }, timeLabel)
      .to(`${inSlide} .why-text-block`, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 0.2, ease: 'power1.inOut' }, timeLabel);

    tlPinned.to(`${outSlide} .why-image-block`, { clipPath: 'inset(0% 100% 0% 0%)', x: -100, duration: 0.2, ease: 'power1.inOut' }, timeLabel)
      .to(`${inSlide} .why-image-block`, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 0.2, ease: 'power1.inOut' }, timeLabel);
  }

  // ── ANIMATION SEQUENCE ──
  // The SVG line stays paused behind the cards during the first 3 slides.

  tlPinned.to({}, { duration: 0.8 }, 0); // Hold Slide 1

  transitionSlides('#why-slide-1', '#why-slide-2', 't1');
  tlPinned.to({}, { duration: 0.8 }); // Hold Slide 2

  transitionSlides('#why-slide-2', '#why-slide-3', 't2');
  tlPinned.to({}, { duration: 0.8 }); // Hold Slide 3

  transitionSlides('#why-slide-3', '#why-slide-4', 't3');
  tlPinned.to({}, { duration: 0.8 }); // Hold Slide 4

  // When all 4 cards have finished scrolling, the SVG line moves forward smoothly
  // (+150 compensates for the extra segment added at the path's start,
  // same as the tlUnpinned offset above)
  tlPinned.to(whyLines, {
    strokeDashoffset: (i, el) => el.getTotalLength() - (1600 + 150),
    ease: "none",
    duration: 0.8
  });

  // ── FINAL UNPINNED TIMELINE (Draws rest of line while scrolling away) ──
  const tlUnpinnedEnd = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => {
        const pinST = ScrollTrigger.getById("whyPin");
        return pinST ? pinST.end : 0;
      },
      end: () => {
        const pinST = ScrollTrigger.getById("whyPin");
        return pinST ? pinST.end + (window.innerHeight * 1.5) : window.innerHeight * 1.5;
      },
      scrub: 1.2
    }
  });

  tlUnpinnedEnd.to(whyLines, {
    strokeDashoffset: 0,
    ease: "none"
  });
}

/* ══════════════════════════════════════════
   5.6 OUR STORY SCROLL ANIMATION
══════════════════════════════════════════ */
function initOurStoryScroll() {
  const section = document.querySelector('.section-story');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 85%',
      end: 'bottom bottom',
      scrub: 1.2
    }
  });

  // Initial states for scrubbed elements
  gsap.set(['.story-eyebrow', '.story-content p', '.story-btn-wrapper'], { opacity: 0, y: 30 });
  gsap.set(['.story-line-top', '.story-line-bottom'], { scaleX: 0, transformOrigin: 'center' });
  gsap.set('.story-svg-line svg', { clipPath: 'inset(0% 0% 100% 0%)' });

  // ── SCRUBBED TIMELINE ──
  // Animation sequence
  tl.to('.story-line-top', { scaleX: 1, duration: 0.5, ease: 'power2.out' })
    .to('.story-eyebrow', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, "-=0.3")
    .from('.story-title .word', { y: '120%', rotationZ: 10, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' }, "-=0.2")
    .to('.story-eyebrow', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, "-=0.3")
    .to('.story-content p', { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power2.out' }, "-=0.3")
    .to('.story-line-bottom', { scaleX: 1, duration: 0.5, ease: 'power2.out' }, "-=0.2")
    .to('.story-btn-wrapper', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, "-=0.3")
    .to('.story-svg-line svg', { clipPath: 'inset(0% 0% 0% 0%)', duration: 2, ease: 'none' }, "-=0.2");
}

/* ══════════════════════════════════════════
   6. STAT COUNTERS
══════════════════════════════════════════ */
function initStatCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach((el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter() {
        gsap.to(obj, {
          val: target, duration: 1.8, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });
}



/* ══════════════════════════════════════════
   8. CURSOR GLOW (desktop only)
══════════════════════════════════════════ */
function initCursorGlow() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  let cursor = document.getElementById('cursor-glow');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'cursor-glow';
    document.body.appendChild(cursor);
  }
  let mx = 0, my = 0;
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  gsap.ticker.add(() => gsap.set(cursor, { left: mx, top: my }));
}

/* ══════════════════════════════════════════
   9. WEBGL AMBIENT BACKGROUND (Three.js)
   Drifting red particle field + soft glow nebulae, with a subtle
   scroll-driven parallax. Purely atmospheric, behind all content.
══════════════════════════════════════════ */
function initWebGLBackground() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 36;

  // ── soft radial sprite texture (shared by particles + nebulae) ──
  function glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,150,90,0.8)');
    grd.addColorStop(1, 'rgba(255,80,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const tex = glowTexture();

  // ── particle field ──
  const COUNT = 650;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.55, map: tex, color: 0xEC2D26,
    transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);



  // ── interaction state ──
  let mouseX = 0, mouseY = 0, scrollY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });
  const onScroll = () => { scrollY = window.scrollY || window.pageYOffset; };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) lenis.on('scroll', ({ scroll }) => { scrollY = scroll; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;
    // parallax: drift with scroll + ease toward the cursor
    const targetY = 4 - (scrollY * 0.012);
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.x += (mouseX * 6 - camera.position.x) * 0.04;
    camera.lookAt(0, camera.position.y * 0.6, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

/* ══════════════════════════════════════════
   INDUSTRIES NEW SECTION (3D COVERFLOW CAROUSEL)
══════════════════════════════════════════ */
function initIndustriesNewScroll() {
  const section = document.querySelector('.section-industries-new');
  const cards = document.querySelectorAll('.industries-cards-track .expert-card');
  const dots = document.querySelectorAll('.industries-pagination .carousel-dot');
  const prevBtn = document.querySelector('.industries-pagination .prev-btn');
  const nextBtn = document.querySelector('.industries-pagination .next-btn');

  if (!section) return;

  // Restore original word-by-word scroll highlighting exclusively for the heading text
  const title = section.querySelector('.industries-new-title');
  if (title) {
    const childNodes = Array.from(title.childNodes);
    title.innerHTML = '';
    const spans = [];

    childNodes.forEach(node => {
      if (node.nodeType === 3) { // Text node
        const words = node.textContent.split(/(\s+)/);
        words.forEach(word => {
          if (word.trim().length > 0) {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.opacity = '0.2';
            span.style.display = 'inline-block';
            title.appendChild(span);
            spans.push(span);
          } else if (word.length > 0) {
            title.appendChild(document.createTextNode(word));
          }
        });
      } else if (node.nodeName === 'BR') {
        title.appendChild(node);
      } else if (node.nodeType === 1) { // Element node (span.text-red)
        const innerText = node.textContent;
        const spanWrapper = document.createElement('span');
        spanWrapper.className = node.className;
        spanWrapper.style.opacity = '0.2';
        spanWrapper.style.display = 'inline-block';
        spanWrapper.textContent = innerText;
        title.appendChild(spanWrapper);
        spans.push(spanWrapper);
      }
    });

    if (spans.length && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(spans, {
        opacity: 0.2,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 25%',
          scrub: 1.2
        }
      });
    }
  }

  if (!cards.length) return;

  let activeIndex = 5; // Start on BFSI & Fintech (6th card, index 5)
  const totalCards = cards.length;

  function updateCarousel() {
    const isMobile = window.innerWidth <= 768;
    const isLaptop = window.innerWidth <= 1400 && !isMobile;

    const stepX = isMobile ? 155 : isLaptop ? 200 : 240;
    const stepZ = isMobile ? -50 : -65;

    cards.forEach((card, i) => {
      let offset = i - activeIndex;

      // Direct linear offset positioning in Coverflow style
      if (offset === 0) {
        // Active center card
        card.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
        card.style.opacity = '1';
        card.style.zIndex = '20';
        card.style.filter = 'brightness(1) blur(0px)';
        card.style.pointerEvents = 'auto';
        card.classList.add('active');
      } else if (offset === -1 || offset === 1) {
        // First adjacent cards
        const xPos = offset * stepX;
        card.style.transform = `translate3d(${xPos}px, 0px, ${stepZ}px) scale(0.88)`;
        card.style.opacity = '0.85';
        card.style.zIndex = '15';
        card.style.filter = 'brightness(0.65)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('active');
      } else if (offset === -2 || offset === 2) {
        // Second adjacent cards
        const xPos = (offset > 0 ? 1.8 : -1.8) * stepX;
        card.style.transform = `translate3d(${xPos}px, 0px, ${stepZ * 2.2}px) scale(0.75)`;
        card.style.opacity = '0.5';
        card.style.zIndex = '10';
        card.style.filter = 'brightness(0.35)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('active');
      } else {
        // Hidden cards outside view
        const xPos = (offset > 0 ? 2.6 : -2.6) * stepX;
        card.style.transform = `translate3d(${xPos}px, 0px, ${stepZ * 3.5}px) scale(0.6)`;
        card.style.opacity = '0';
        card.style.zIndex = '1';
        card.style.filter = 'brightness(0)';
        card.style.pointerEvents = 'none';
        card.classList.remove('active');
      }

      // Ensure rotated inner cards reset when navigating away from them
      if (offset !== 0) {
        const inner = card.querySelector('.card-inner');
        if (inner && inner.style.transform === 'rotateY(180deg)') {
          inner.style.transform = '';
        }
      }
    });

    // Update pagination dots if they exist
    dots.forEach((dot, i) => {
      if (i === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Initialize layout
  updateCarousel();

  // Re-calculate spacing on window resize
  window.addEventListener('resize', () => {
    updateCarousel();
  });

  // Next & Previous navigation buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % totalCards;
      updateCarousel();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeIndex = (activeIndex - 1 + totalCards) % totalCards;
      updateCarousel();
    });
  }

  // Dot navigation clicks
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      activeIndex = index;
      updateCarousel();
    });
  });

  // Card clicks (clicking a side card makes it active center card)
  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (index !== activeIndex) {
        activeIndex = index;
        updateCarousel();
      } else if (window.innerWidth <= 768) {
        // Support touch click to flip on mobile devices
        const inner = card.querySelector('.card-inner');
        if (inner) {
          inner.style.transform = inner.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)';
        }
      }
    });
  });

  // Keyboard left/right arrows navigation when in viewport
  window.addEventListener('keydown', (e) => {
    const rect = section.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isInView || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight') {
      activeIndex = (activeIndex + 1) % totalCards;
      updateCarousel();
    } else if (e.key === 'ArrowLeft') {
      activeIndex = (activeIndex - 1 + totalCards) % totalCards;
      updateCarousel();
    }
  });

  // SVG Line Draw Animation using GSAP ScrollTrigger
  const btmSvg = section.querySelector('.industriessvgbtm svg');
  if (btmSvg && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.fromTo(btmSvg,
      { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
      {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        ease: 'none',
        scrollTrigger: {
          trigger: '.industriessvgbtm',
          start: 'top 85%',
          end: 'bottom 40%',
          scrub: true
        }
      }
    );
  }
}

/* ══════════════════════════════════════════
   TRUSTED INDUSTRIES SVG ANIMATION
══════════════════════════════════════════ */
function initTrustedIndustriesScroll() {
  const lines = document.querySelectorAll('.trusted-line');
  if (!lines.length) return;

  // Set initial state for all lines
  lines.forEach(line => {
    const length = line.getTotalLength();
    // Using strokeDasharray and strokeDashoffset to draw the line
    line.style.strokeDasharray = length + 10;
    line.style.strokeDashoffset = length + 10;
  });

  // Create ScrollTrigger to draw them in as user scrolls
  gsap.to(lines, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: lines[0].closest('svg'), // Trigger exactly when the SVG itself is in view
      start: 'top 50%',                 // Start drawing perfectly synchronized with the center of the screen
      end: 'bottom 50%',                // Finish exactly when SVG ends
      scrub: true
    }
  });
}


function initOurWorkHeroScroll() {
  const lines = document.querySelectorAll('.our-work-hero-line');
  if (!lines.length) return;

  // Initially hide all lines
  lines.forEach(line => {
    const length = line.getTotalLength();
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
  });

  // Draw on scroll
  gsap.to(lines, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.our-work-banner',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// ═══════════════ HEADER: HIDDEN ON LOAD, SHOWS AFTER HERO ═══════════════
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // Hero-jaisa section jo bhi page pe ho
  const heroEl = document.querySelector('.section-hero, .our-work-banner, .services-hero, .about-hero-section, .industry-hero');

  let ticking = false;

  function heroBottom() {
    if (!heroEl) return 0;
    const rect = heroEl.getBoundingClientRect();
    return rect.bottom + window.scrollY;
  }

  function update() {
    const body = document.body;

    // Menu khula ho to header ki state mat chhero
    if (body.classList.contains('menu-open')) return;

    const isPastHero = window.scrollY >= heroBottom();

    if (isPastHero) {
      // Hero cross ho gaya — header ab hamesha visible rahega
      header.classList.remove('header-hidden');
    } else {
      // Hero ke andar (ya load pe) — header hamesha hidden
      // header.classList.add('header-hidden');
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', update);

  // Load ke turant baad bhi sahi state set karo (agar scroll-restore ho)
  update();
})();

// ═══════════════ CTA CURSOR FOLLOWER BADGE ═══════════════
(function () {
  function initCtaCursor() {
    const section = document.getElementById('ctaSection');
    const badge = document.getElementById('ctaCursorBadge');
    const talkBtn = section && section.querySelector('.btn-talk-to-us');
    if (!section || !badge) return;

    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;
    let rafId = null;
    let isInside = false;
    let overBtn = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
      curX = lerp(curX, mouseX, 0.1);
      curY = lerp(curY, mouseY, 0.1);
      badge.style.left = curX + 'px';
      badge.style.top = curY + 'px';
      if (isInside) rafId = requestAnimationFrame(animate);
    }

    section.addEventListener('mouseenter', (e) => {
      isInside = true;
      const rect = section.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      curX = mouseX;
      curY = mouseY;
      badge.style.left = curX + 'px';
      badge.style.top = curY + 'px';
      if (!overBtn) section.classList.add('cursor-active');
      rafId = requestAnimationFrame(animate);
    });

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    section.addEventListener('mouseleave', () => {
      isInside = false;
      overBtn = false;
      section.classList.remove('cursor-active');
      cancelAnimationFrame(rafId);
    });

    // "TALK TO US" button pe badge hide karo
    if (talkBtn) {
      talkBtn.addEventListener('mouseenter', () => {
        overBtn = true;
        section.classList.remove('cursor-active');
      });
      talkBtn.addEventListener('mouseleave', () => {
        overBtn = false;
        if (isInside) section.classList.add('cursor-active');
      });
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCtaCursor);
  } else {
    initCtaCursor();
  }
})();

// ═══════════════ MENU OVERLAY LOGIC ═══════════════

function initServicesPageHeroScroll() {
  const heroSection = document.getElementById('services_banner');
  const svgContainer = document.getElementById('servicesherosvg');
  const svgPaths = document.querySelectorAll('#servicesherosvg path');

  if (!heroSection || !svgContainer) return;

  const svgElement = svgContainer.querySelector('svg');
  const strokedPaths = Array.from(svgPaths).filter(p => p.hasAttribute('stroke'));

  // Reset any dash offset to normal, so the paths are fully "drawn" statically
  strokedPaths.forEach(path => {
    gsap.set(path, {
      strokeDashoffset: 0,
      visibility: 'visible'
    });
  });

  // Initially hide the svg using clip-path (left 0%, right 0%)
  // We apply this to the SVG element, not the container, to avoid breaking the container's CSS mask-image
  gsap.set(svgElement, {
    clipPath: 'polygon(0% 0%, 0% 0%, 0% 60%, 0% 60%)'
  });

  const tl = gsap.timeline({
    delay: 1.5
  });

  // Step 1: Animate horizontally left to right (revealing the horizontal lines)
  tl.to(svgElement, {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 0% 60%)',
    ease: 'power2.inOut',
    duration: 1.5
  });

  // Step 2: Animate vertically top to bottom (revealing the downward curve into the fade out)
  tl.to(svgElement, {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    ease: 'power2.inOut',
    duration: 1
  });
}

// ----------------------------------------------------------------------
// sthirosconversationsec SVG Animations
// ----------------------------------------------------------------------
function initConversationSvgScroll() {
  const convSection = document.getElementById('sthirosconversationsec');
  if (!convSection) return;

  const topSvgContainer = convSection.querySelector('.conversationsvgsec');
  const bottomSvgContainer = convSection.querySelector('.conversationbottomsvg');

  const topSvgElement = topSvgContainer ? topSvgContainer.querySelector('svg') : null;
  const bottomSvgElement = bottomSvgContainer ? bottomSvgContainer.querySelector('svg') : null;

  if (topSvgElement) {
    gsap.set(topSvgElement, { clipPath: 'polygon(0% 0%, 12% 0%, 12% 0%, 0% 0%)' });
  }
  if (bottomSvgElement) {
    gsap.set(bottomSvgElement, { clipPath: 'polygon(90% 0%, 100% 0%, 100% 0%, 90% 0%)' });
  }

  // Use a single timeline bound to the entire section so the animations chain perfectly
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: convSection,
      start: 'top 60%',
      end: 'bottom 10%',
      scrub: 1
    }
  });

  if (topSvgElement) {
    // The new SVG starts at Left (X=0) -> Right -> Right Down
    tl.to(topSvgElement, { clipPath: 'polygon(0% 0%, 12% 0%, 12% 37%, 0% 37%)', ease: 'none', duration: 1 })
      .to(topSvgElement, { clipPath: 'polygon(0% 0%, 12% 0%, 12% 60%, 0% 60%)', ease: 'none', duration: 0.2 })
      .to(topSvgElement, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 0% 60%)', ease: 'none', duration: 2 })
      .to(topSvgElement, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 0.8 });
  }

  if (bottomSvgElement) {
    // Starts exactly after top SVG finishes
    tl.to(bottomSvgElement, { clipPath: 'polygon(90% 0%, 100% 0%, 100% 100%, 90% 100%)', ease: 'none', duration: 1 })
      .to(bottomSvgElement, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 2 });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const menuOverlay = document.getElementById('menuOverlay');
  const body = document.body;

  if (menuToggle && menuOverlay) {
    menuToggle.addEventListener('click', () => {
      // Toggle classes
      menuOverlay.classList.toggle('active');
      body.classList.toggle('menu-open');

      if (menuOverlay.classList.contains('active')) {
        // Menu khula — scroll bilkul band karo
        body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
      } else {
        // Menu band — scroll wapas chalu karo
        body.style.overflow = '';
        if (lenis) lenis.start();
      }
    });
  }

  // --- ACCORDION DROPDOWN LOGIC ---
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      const parentDropdown = toggle.closest('.nav-item-dropdown');

      // If it's already open, just close it
      if (parentDropdown.classList.contains('open')) {
        parentDropdown.classList.remove('open');
      } else {
        // Close all other open dropdowns at the SAME level (siblings)
        const parentContainer = parentDropdown.parentElement;
        if (parentContainer) {
          // Use Array.from to filter children since :scope > is sometimes tricky in older browsers
          Array.from(parentContainer.children).forEach(child => {
            if (child !== parentDropdown && child.classList.contains('nav-item-dropdown') && child.classList.contains('open')) {
              child.classList.remove('open');
            }
          });
        }
        // Open the clicked one
        parentDropdown.classList.add('open');
      }
    });
  });

  // ═══════════════ TOGGLE BUTTON (Light/Dark Mode) ═══════════════
  const themeToggleBtn = document.querySelector('.theme-toggle');
  
  // Set initial theme on load based on localStorage
  const currentTheme = localStorage.getItem('sthiros-theme') || 'dark';
  if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggleBtn) themeToggleBtn.classList.add('is-on');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-mode');
      if (isLight) {
        document.body.classList.remove('light-mode');
        localStorage.setItem('sthiros-theme', 'dark');
        themeToggleBtn.classList.remove('is-on');
      } else {
        document.body.classList.add('light-mode');
        localStorage.setItem('sthiros-theme', 'light');
        themeToggleBtn.classList.add('is-on');
      }
    });
  }

  // ═══════════════ HERO VIDEO SMOOTH LOOP FIX ═══════════════
  const heroVideo = document.querySelector('.hero-hand-video');
  if (heroVideo) {
    heroVideo.addEventListener('timeupdate', () => {
      // Seek back to start slightly before the actual end to avoid browser stutter
      if (heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - 0.08) {
        heroVideo.currentTime = 0;
        heroVideo.play();
      }
    });
  }
});

// ═══════════════ OUR WORK SVG SCROLL ANIMATION ═══════════════
function initOurWorkPageScroll() {
  const heroSvg = document.getElementById('our-work-hero-svg');
  if (heroSvg) {
    // Starts top-left and grows as user scrolls the hero banner
    gsap.set(heroSvg, { clipPath: 'circle(0% at 0% 0%)' });
    gsap.to(heroSvg, {
      clipPath: 'circle(150% at 0% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.our-work-banner',
        start: 'top top',
        end: '+=100%',
        scrub: true,
        pin: true,
      }
    });
  }

  const svgWrapper = document.getElementById('our-work-svgs-wrap');
  if (!svgWrapper) return;

  const svgs = svgWrapper.querySelectorAll('svg');
  if (svgs.length >= 4) {
    // 1. Vertical down
    gsap.set(svgs[0], { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svgs[0], {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: svgs[0],
        start: 'top 100%', // Start drawing as soon as it enters from the bottom to continue from hero banner
        end: 'bottom 50%',
        scrub: true,
      }
    });

    // 2. Curve from top-right to bottom-left
    gsap.set(svgs[1], { clipPath: 'circle(0% at 100% 0%)' });
    gsap.to(svgs[1], {
      clipPath: 'circle(150% at 100% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: svgs[1],
        start: 'top 50%',
        end: 'bottom 50%',
        scrub: true,
      }
    });

    // 3. Curve from top-left to bottom-right
    gsap.set(svgs[2], { clipPath: 'circle(0% at 0% 0%)' });
    gsap.to(svgs[2], {
      clipPath: 'circle(150% at 0% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: svgs[2],
        start: 'top 50%',
        end: 'bottom 50%',
        scrub: true,
      }
    });

    // 4. Curve from top-right to left
    gsap.set(svgs[3], { clipPath: 'circle(0% at 100% 0%)' });
    gsap.to(svgs[3], {
      clipPath: 'circle(150% at 100% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger: svgs[3],
        start: 'top 50%',
        end: 'bottom 50%',
        scrub: true,
      }
    });
  } else {
    // Fallback if not exactly 4 SVGs
    gsap.set(svgWrapper, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svgWrapper, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.trusted-industries',
        start: 'top 80%',
        end: 'bottom 80%',
        scrub: true,
      }
    });
  }

  // --- Card Animation Logic ---
  const statsContainer = document.getElementById('stats-cards-container');
  const cardLeft = document.querySelector('.stat-card-left');
  const cardRight = document.querySelector('.stat-card-right');

  if (statsContainer && cardLeft && cardRight) {
    gsap.set(cardLeft, { x: -150, opacity: 0 });
    gsap.set(cardRight, { x: 150, opacity: 0 });

    gsap.to([cardLeft, cardRight], {
      x: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0,
      scrollTrigger: {
        trigger: statsContainer,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  }
}

/* ════════════════════════════════════════════
   REAL STORIES SLIDER LOGIC
   ════════════════════════════════════════════ */
function initRealStoriesSlider() {
  const heading = document.querySelector('#realstoriesheading h1');
  if (heading) {
    gsap.fromTo(heading,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: '#realstoriesheading',
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // Animate the Real Stories SVG line
  const topSvg = document.querySelector('#realtopstoriessvg svg');
  if (topSvg) {
    gsap.set(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(topSvg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#realtopstoriessvg',
        start: 'top 80%',
        end: 'bottom 50%',
        scrub: true
      }
    });
  }

  const container = document.querySelector('.stories-slider-container');
  const track = document.getElementById('storiesSliderTrack');
  const prevBtn = document.getElementById('storyPrevBtn');
  const nextBtn = document.getElementById('storyNextBtn');

  if (!container || !track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll('.story-card'));
  if (slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  function updateSlider() {
    const activeSlide = slides[currentIndex];
    if (!activeSlide) return;

    slides.forEach((slide, index) => {
      if (index === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    const containerWidth = container.clientWidth || window.innerWidth;
    const cardLeft = activeSlide.offsetLeft;
    const cardWidth = activeSlide.offsetWidth;
    // Calculate translate offset so active card's center aligns with viewport/container center
    const offset = (containerWidth / 2) - (cardLeft + cardWidth / 2);

    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();
  });

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlider();
  });

  window.addEventListener('resize', updateSlider);
  // Guarantee proper alignment after DOM layout calculations
  requestAnimationFrame(updateSlider);
  setTimeout(updateSlider, 100);
  setTimeout(updateSlider, 500);

  // Support touch swipe gestures on devices
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleGesture();
  }, { passive: true });

  function handleGesture() {
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
      // Swipe left -> next slide
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlider();
    } else if (touchEndX > touchStartX + threshold) {
      // Swipe right -> prev slide
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlider();
    }
  }
}

/* ════════════════════════════════════════════
   WORK HOLDS VERTICAL SLIDING ON SCROLL (SINGLE CONTAINER)
   ════════════════════════════════════════════ */
function initWorkholdSlider() {
  const section = document.getElementById('workholdslidecont');
  const track = document.getElementById('workholdCardsTrack');
  const wrapper = document.querySelector('.workhold-pinned-wrapper');
  const heading = document.querySelector('#workholdheading h1');
  const prevBtn = document.getElementById('workholdPrevBtn');
  const nextBtn = document.getElementById('workholdNextBtn');

  if (heading) {
    gsap.fromTo(heading,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: '#workholdheading',
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // Animate top SVG (workholdssvg)
  const topSvg = document.querySelector('#workholdssvg svg');
  if (topSvg) {
    gsap.set(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(topSvg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#workholdssvg',
        start: 'top 80%',
        end: 'bottom 50%',
        scrub: true
      }
    });
  }

  // Animate bottom SVG (workholdbottomsvg)
  const bottomSvg = document.querySelector('#workholdbottomsvg svg');
  if (bottomSvg) {
    gsap.set(bottomSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(bottomSvg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#workholdbottomsvg',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: true
      }
    });
  }

  if (!section || !track) return;

  const slides = Array.from(track.querySelectorAll('.workhold-card'));
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  const mm = gsap.matchMedia();

  // Desktop (> 768px): Vertical Pinning & Sliding on Scroll
  mm.add("(min-width: 769px)", () => {
    track.style.transform = 'none';

    slides.forEach((slide, idx) => {
      if (idx === 0) slide.classList.add('active');
      else slide.classList.remove('active');
    });

    let lastIndex = -1;
    const st = ScrollTrigger.create({
      trigger: section,
      start: () => {
        const pWrapper = document.querySelector('.workhold-pinned-wrapper');
        return pWrapper ? "top " + window.getComputedStyle(pWrapper).top : "top top";
      },
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        let progress = Math.max(0, Math.min(0.9999, self.progress));
        const slideIndex = Math.floor(progress * totalSlides);

        if (slideIndex !== lastIndex) {
          lastIndex = slideIndex;
          slides.forEach((slide, idx) => {
            if (idx === slideIndex) {
              slide.classList.add('active');
            } else {
              slide.classList.remove('active');
            }
          });
        }
      }
    });

    return () => {
      st.kill();
      track.style.transform = '';
    };
  });

  // Mobile (<= 768px): Horizontal Carousel / Slider with Arrows & Touch Gestures
  mm.add("(max-width: 768px)", () => {
    let currentIndex = 0;

    function goToSlide(newIndex) {
      if (newIndex < 0) newIndex = totalSlides - 1;
      if (newIndex >= totalSlides) newIndex = 0;

      const prevSlide = slides[currentIndex];
      currentIndex = newIndex;

      // Keep incoming and outgoing slides visible during transition
      slides.forEach((slide, idx) => {
        if (idx === currentIndex) {
          slide.classList.add('active');
          slide.classList.add('is-animating');
        } else if (slide === prevSlide) {
          slide.classList.remove('active');
          slide.classList.add('is-animating');
        } else {
          slide.classList.remove('active');
          slide.classList.remove('is-animating');
        }
      });

      const containerWidth = wrapper ? wrapper.clientWidth : (section.clientWidth || window.innerWidth);
      const offset = -currentIndex * containerWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;

      setTimeout(() => {
        slides.forEach((slide, idx) => {
          if (idx !== currentIndex) {
            slide.classList.remove('is-animating');
          }
        });
      }, 520);
    }

    const onNext = () => {
      goToSlide(currentIndex + 1);
    };

    const onPrev = () => {
      goToSlide(currentIndex - 1);
    };

    if (nextBtn) nextBtn.addEventListener('click', onNext);
    if (prevBtn) prevBtn.addEventListener('click', onPrev);

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    const onTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const onTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const threshold = 40;
      if (touchEndX < touchStartX - threshold) {
        goToSlide(currentIndex + 1);
      } else if (touchEndX > touchStartX + threshold) {
        goToSlide(currentIndex - 1);
      }
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchend', onTouchEnd, { passive: true });

    const onResize = () => {
      const containerWidth = wrapper ? wrapper.clientWidth : (section.clientWidth || window.innerWidth);
      const offset = -currentIndex * containerWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };
    window.addEventListener('resize', onResize);

    // Set initial active state: only the first slide is visible
    slides.forEach((slide, idx) => {
      if (idx === 0) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
        slide.classList.remove('is-animating');
      }
    });
    track.style.transform = 'translate3d(0px, 0, 0)';

    return () => {
      if (nextBtn) nextBtn.removeEventListener('click', onNext);
      if (prevBtn) prevBtn.removeEventListener('click', onPrev);
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      track.style.transform = '';
      slides.forEach(s => {
        s.classList.remove('is-animating');
      });
    };
  });
}

// Service Lines Accordion
function initServiceAccordion() {
  const headers = document.querySelectorAll('.deliverable-header');
  if (!headers.length) return;

  // Dynamically fix the gap between Service Lines and What's Different based on item count
  const deliverableItems = document.querySelectorAll('.deliverable-item');
  const differentSection = document.getElementById('differentaboutworkingwithus');
  if (differentSection && deliverableItems.length > 0) {
    if (deliverableItems.length <= 2) {
      differentSection.style.marginTop = '-160px';
      differentSection.style.paddingTop = '60px';
    } else if (deliverableItems.length === 3) {
      differentSection.style.marginTop = '-50px';
      differentSection.style.paddingTop = '60px';
    } else {
      differentSection.style.marginTop = '20px';
      differentSection.style.paddingTop = '60px';
    }
  }

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.closest('.deliverable-item');

      // If we are opening this item, close all others in the same container first
      if (!parent.classList.contains('active')) {
        const container = header.closest('.servicelinedeliverablecont');
        if (container) {
          container.querySelectorAll('.deliverable-item').forEach(item => {
            item.classList.remove('active');
          });
        }
      }

      // Toggle the clicked item
      parent.classList.toggle('active');

      setTimeout(() => ScrollTrigger.refresh(), 550);
    });
  });

  const cont = document.querySelector('.servicelinedeliverablecont');
  const svg = document.querySelector('.servicelinedeliverable svg');
  if (cont && svg) {
    const path = svg.querySelector('path');
    const originalD = path.getAttribute('d');
    const originalViewBox = svg.getAttribute('viewBox').split(' ').map(Number);
    const baseSvgHeight = originalViewBox[3];
    let baseContHeight = null;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (baseContHeight === null) {
          baseContHeight = entry.contentRect.height;
        }
        const currentContHeight = entry.contentRect.height;
        const heightDiff = currentContHeight - baseContHeight;

        const scale = 390 / 74; // Based on width: 390px and viewBox width: 74
        const svgUnitsToAdd = heightDiff / scale;
        const newSvgHeight = baseSvgHeight + svgUnitsToAdd;

        svg.setAttribute('viewBox', `0 0 74 ${newSvgHeight}`);
        svg.setAttribute('height', newSvgHeight);

        const newBottomY = 840.55 + svgUnitsToAdd;
        const newD = originalD.replace(/840\.55/g, newBottomY.toFixed(2));
        path.setAttribute('d', newD);
      }
    });

    resizeObserver.observe(cont);
  }
}

function initHeroSvgTracksScroll() {
  const svg = document.querySelector('.herosvgtracks svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-20% -20%, -20% -20%, -20% 120%, -20% 120%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-20% -20%, 120% -20%, 120% 120%, -20% 120%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#herosvgtrack',
        start: 'top 80%',
        end: 'top 20%',
        scrub: true
      }
    });
  }
}

function initHeroSvgTracksBtmScroll() {
  const svg = document.querySelector('.herosvgtracksbtm svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.herosvgtracksbtm',
        start: 'top 85%',
        end: 'top 40%',
        scrub: true
      }
    });
  }
}

function initServiceLineDeliverableScroll() {
  const svg = document.querySelector('.servicelinedeliverable svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-500% 0%, 500% 0%, 500% 0%, -500% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-500% 0%, 500% 0%, 500% 100%, -500% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.herosvgtracksbtm',
        start: 'top 40%',
        endTrigger: '.servicelinedeliverable',
        end: 'bottom 50%',
        scrub: true
      }
    });
  }
}

function initServiceLineDeliverableBtmScroll() {
  const svg = document.querySelector('.servicelinedeliverablesvgbtm svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-500% 0%, 500% 0%, 500% 0%, -500% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-500% 0%, 500% 0%, 500% 100%, -500% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.servicelinedeliverable',
        start: 'bottom 50%',
        endTrigger: '.servicelinedeliverablesvgbtm',
        end: 'bottom 20%',
        scrub: true
      }
    });
  }
}

function initDiffBtmSvgScroll() {
  const svg = document.querySelector('.diffbtmsvg svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-20% 0%, 120% 0%, 120% 0%, -20% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-20% 0%, 120% 0%, 120% 100%, -20% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.diffbtmsvg',
        start: 'top 85%',
        end: 'bottom 20%',
        scrub: true
      }
    });
  }
}

function initWhenYouNeedThisSvgScroll() {
  const svg = document.querySelector('.whenyouneedthissvg svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-20% 0%, 120% 0%, 120% 0%, -20% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-20% 0%, 120% 0%, 120% 100%, -20% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.whenyouneedthissvg',
        start: 'top 85%',
        end: 'bottom 20%',
        scrub: true
      }
    });
  }
}

function initSkipTheDeskScroll() {
  const svg = document.querySelector('.skipthedesktop svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(-20% 0%, 120% 0%, 120% 0%, -20% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(-20% 0%, 120% 0%, 120% 100%, -20% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.skipthedesktop',
        start: 'top 85%',
        end: 'bottom 50%',
        scrub: true
      }
    });
  }
}

function initSkipTheDeskBtmScroll() {
  const svg = document.querySelector('.skipthedeskbtm svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(0% -20%, 0% -20%, 0% 120%, 0% 120%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% -20%, 100% -20%, 100% 120%, 0% 120%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.skipthedesktop',
        start: 'bottom 50%',
        endTrigger: '.skipthedeskbtm',
        end: 'bottom 20%',
        scrub: true
      }
    });
  }
}

function initWorkspeakBtmSvgScroll() {
  const svg = document.querySelector('#workspeakbtmsvg svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#workspeakbtmsvg',
        start: 'top 80%',
        end: '+=300', // Fast wipe on scroll
        scrub: 1
      }
    });
  }
}

function initRepoSvgScroll() {
  const svg = document.querySelector('#repoSvgLine svg');
  if (svg) {
    // Starts hidden at the left and wipes rightwards as user scrolls
    gsap.set(svg, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#repoSvgLine svg',
        start: 'top top',
        end: '+=200', // Very fast reveal (finishes within 200px of scrolling)
        scrub: 1
      }
    });
  }
}

function initInsightIndustrySvgScroll() {
  const svg = document.querySelector('#insightindustrysec svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#insightindustrysec',
        start: 'top 80%',
        end: '+=300', // Fast wipe on scroll
        scrub: 1
      }
    });
  }
}

function initOurTwoCentsBtmSvgScroll() {
  const svg = document.querySelector('#ourtwocentsbtmsvg svg');
  if (svg) {
    gsap.set(svg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    gsap.to(svg, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '#ourtwocentsbtmsvg',
        start: 'top 80%',
        end: '+=300', // Fast wipe on scroll
        scrub: 1
      }
    });
  }
}

function initYoursCanTooSvgScroll() {
  const topSvg = document.querySelector('.yourscantootop svg');
  const btmSvg = document.querySelector('.yourscantoobtm svg');

  if (topSvg && btmSvg) {
    // Top SVG: Vertical Wipe
    gsap.set(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
    // Bottom SVG: Horizontal Wipe (Left to Right)
    gsap.set(btmSvg, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#yourscantoosec',
        start: 'top 70%',
        end: 'bottom 20%', // Extended scroll distance for both animations
        scrub: 1
      }
    });

    // Animate top SVG first, then bottom SVG
    tl.to(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' })
      .to(btmSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' });
  }
}

// ═══════════════ PRODUCTS HERO SVG BTM ANIMATION ═══════════════
function initProductsHeroSvgScroll() {
  const svg = document.querySelector('#svgherobtm svg');
  if (svg) {
    // Clear any previous stroke properties from the old approach
    const paths = svg.querySelectorAll('path[stroke]');
    paths.forEach(p => gsap.set(p, { clearProps: 'strokeDasharray,strokeDashoffset' }));

    // Start completely hidden (width 0, left edge), starting slightly off-screen to the left
    gsap.set(svg, { clipPath: 'polygon(-20% 0%, -20% 0%, -20% 100%, -20% 100%)' });

    gsap.to(svg, {
      // Wipe to full width (left to right)
      clipPath: 'polygon(-20% 0%, 100% 0%, 100% 100%, -20% 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.products-hero-section', // Using the very top section as trigger
        start: 'top top',                  // Start exactly when scrolling begins
        end: () => `+=${document.querySelector('#svgherobtm').offsetHeight * 0.3}`,
        scrub: 1
      }
    });
  }
}

// ═══════════════ COMPLIANCE SECTION SVG SEQUENCE ═══════════════
function initComplianceSvgSequenceScroll() {
  const topSvg = document.querySelector('.topdivsvg svg');
  const midSvg = document.querySelector('.middledivsvg svg');
  const btmSvg = document.querySelector('.bottomdivsvg svg');

  if (topSvg) gsap.set(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
  if (midSvg) gsap.set(midSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
  if (btmSvg) gsap.set(btmSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });

  if (!topSvg && !midSvg && !btmSvg) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.svgconsecblc',
      start: 'top 80%',
      end: 'bottom 40%',
      scrub: 1
    }
  });

  if (topSvg) tl.to(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 2.7 });
  if (midSvg) tl.to(midSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 11.6 });
  if (btmSvg) tl.to(btmSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 6.6 });
}

// ═══════════════ TELL US WHAT SECTION SVG SEQUENCE ═══════════════
function initTellUsWhatSvgSequenceScroll() {
  const topSvg = document.querySelector('.telluswhatsvgtop svg');
  const btmSvg = document.querySelector('.telluswhatsvgbtm svg');

  if (topSvg) gsap.set(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });
  if (btmSvg) gsap.set(btmSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' });

  if (!topSvg && !btmSvg) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#Telluswhatsstillbeingdonebyhandsec',
      // Starts precisely when the previous section hits 40% (its end point)
      // This naturally sequences them while speeding up this animation!
      start: 'top 40%',
      end: 'bottom 40%',
      scrub: 1
    }
  });

  if (topSvg) tl.to(topSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 4.0 });
  if (btmSvg) tl.to(btmSvg, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 3.1 });
}

// ═══════════════ CONTINUOUS FLOATING CURVES ═══════════════
function initFloatingCurves() {
  // Vertical floating disabled per user request
  const verticalCurves = document.querySelectorAll('.topdivsvg svg, .middledivsvg svg, .bottomdivsvg svg, #svgherobtm svg');
}



// --- Set Active Nav Link Dynamically ---
document.addEventListener('DOMContentLoaded', () => {
    let rawPath = window.location.pathname.toLowerCase();
    let page = rawPath.split('/').pop();
    
    if (page === '' || page === '/') {
        page = 'index.html';
    }

    if (page.toLowerCase() === 'index.html') {
        document.body.classList.add('page-index');
    } else {
        document.body.classList.add('page-subpage');
    }

    const isServicesPage = page === 'services.html' || page === 'servicesinner.html' || rawPath.endsWith('/services') || rawPath.endsWith('/services.html');

    // --- Desktop Navigation ---
    const dNavLinks = document.querySelectorAll('.d-nav-list a');
    dNavLinks.forEach(link => link.classList.remove('active-nav'));

    dNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === page || (href === 'services.html' && isServicesPage))) {
            link.classList.add('active-nav');
            
            // Check if it's inside a mega menu, highlight the parent ONLY if allowed
            const megaMenu = link.closest('.has-mega-menu');
            if (megaMenu) {
                const parentLink = megaMenu.querySelector(':scope > a'); // The top level link
                const isWhatWeDoMega = parentLink && parentLink.textContent.includes('WHAT WE DO');
                // For WHAT WE DO, only activate top-level link when on services.html / servicesinner.html
                if (parentLink && (!isWhatWeDoMega || isServicesPage)) {
                    parentLink.classList.add('active-nav');
                }
            }
        }
    });

    // --- Mobile Navigation ---
    const mNavLinks = document.querySelectorAll('.main-nav a');
    mNavLinks.forEach(link => link.classList.remove('active'));

    mNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === page || (href === 'services.html' && isServicesPage))) {
            link.classList.add('active');
            
            // Highlight parent dropdowns if any
            let parentDropdown = link.closest('.nav-item-dropdown');
            while (parentDropdown) {
                const parentToggle = parentDropdown.querySelector('.dropdown-toggle');
                if (parentToggle) parentToggle.classList.add('active');
                parentDropdown = parentDropdown.parentElement.closest('.nav-item-dropdown'); // For nested dropdowns
            }
        }
    });

    // --- WHAT WE DO Mega Menu Category & Sidebar Active Handling ---
    initWhatWeDoMegaMenu(page);
});

function initWhatWeDoMegaMenu(currentPage) {
    const rawPath = window.location.pathname.toLowerCase();
    const page = (currentPage || rawPath.split('/').pop() || 'index.html').toLowerCase();

    // Find all WHAT WE DO mega menu containers
    const whatWeDoLis = Array.from(document.querySelectorAll('.d-nav-list > li.has-mega-menu')).filter(li => {
        const topLink = li.querySelector(':scope > a');
        return topLink && topLink.textContent.includes('WHAT WE DO');
    });

    whatWeDoLis.forEach(whatWeDoLi => {
        const megaMenu = whatWeDoLi.querySelector('.split-mega-menu');
        if (!megaMenu) return;

        const sidebarLinks = megaMenu.querySelectorAll('.mega-sidebar-link');
        const panes = megaMenu.querySelectorAll('.mega-pane');
        const whatWeDoLink = megaMenu.querySelector('.mega-sidebar-link[href*="services.html"]') || sidebarLinks[0];

        const isWhatWeDoPage = page === 'services.html' || page === 'servicesinner.html' || rawPath.endsWith('/services') || rawPath.endsWith('/services.html');
        const isStrategy = page.includes('strategy');
        const isRisk = page.includes('risk');
        const isCyber = page.includes('cyber');
        const isAi = page.includes('ai');

        let activeTarget = null;
        if (isStrategy) activeTarget = 'mega-strategy';
        else if (isRisk) activeTarget = 'mega-risk';
        else if (isCyber) activeTarget = 'mega-cyber';
        else if (isAi) activeTarget = 'mega-ai';

        function applyActiveState() {
            // Clear all active classes in sidebar links & panes
            sidebarLinks.forEach(l => l.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            if (activeTarget) {
                // One of Strategy / Risk / Cyber / AI is active
                const activeLink = megaMenu.querySelector(`.mega-sidebar-link[data-target="${activeTarget}"]`);
                if (activeLink) activeLink.classList.add('active');

                const activePane = document.getElementById(activeTarget);
                if (activePane) activePane.classList.add('active');
            } else if (isWhatWeDoPage) {
                // "WHAT WE DO" page itself is active
                if (whatWeDoLink) whatWeDoLink.classList.add('active');
                const defaultPane = document.getElementById('mega-strategy') || panes[0];
                if (defaultPane) defaultPane.classList.add('active');
            } else {
                // Other page (e.g. index, about, oriq, contactus): no sidebar link is active
                const defaultPane = document.getElementById('mega-strategy') || panes[0];
                if (defaultPane) defaultPane.classList.add('active');
            }
        }

        // Apply immediately
        applyActiveState();

        // Interactive hover switching on sidebar items
        sidebarLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                const targetId = link.getAttribute('data-target');
                if (targetId) {
                    panes.forEach(p => p.classList.remove('active'));
                    const targetPane = document.getElementById(targetId);
                    if (targetPane) targetPane.classList.add('active');
                }
            });
        });

        // Restore active state when cursor leaves mega menu or nav item
        megaMenu.addEventListener('mouseleave', applyActiveState);
        whatWeDoLi.addEventListener('mouseleave', applyActiveState);
    });
}


// --- Repository Filter Dropdowns ---
document.addEventListener('DOMContentLoaded', () => {
    const filterToggles = document.querySelectorAll('.repo-filter-toggle');
    
    filterToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentDropdown = toggle.closest('.repo-filter-dropdown');
            
            // Close other dropdowns
            document.querySelectorAll('.repo-filter-dropdown').forEach(dropdown => {
                if (dropdown !== parentDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            // Toggle the clicked one
            parentDropdown.classList.toggle('active');
        });
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.repo-filter-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Prevent closing when clicking inside the menu
    const filterMenus = document.querySelectorAll('.repo-filter-menu');
    filterMenus.forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
});

// Automatically set the active footer menu item based on the current URL
document.addEventListener('DOMContentLoaded', () => {
    let currentPath = window.location.pathname;
    let pageName = currentPath.split('/').pop() || 'index.html';
    
    // Map child pages to their main parent menu links
    let targetPage = pageName;
    if (pageName.startsWith('industry')) targetPage = 'industry.html';
    else if (pageName.startsWith('services') || pageName.startsWith('strategy') || pageName.startsWith('risk')) targetPage = 'services.html';
    
    const footerLinks = document.querySelectorAll('.footer-menu li');
    // Clear any hardcoded active classes
    footerLinks.forEach(li => li.classList.remove('active'));
    
    // Set active class on matching link
    const links = document.querySelectorAll('.footer-menu li a');
    links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href === targetPage || href === pageName)) {
            a.parentElement.classList.add('active');
        }
    });
});

/* ══════════════════════════════════════════
   5.4b MOBILE-ONLY FOUR PILLARS RAIL  (≤768px)
   A completely separate journey from the desktop .services-rail. The rail is
   the five Figma exports chained mark to mark; each logo lifts or drops the
   line between the segment that dies behind it and the one that leaves its
   front. The rail and the marks never animate — one pinned + scrubbed
   ScrollTrigger flies the camera along the path and that is the only thing
   that moves. Nothing here runs above 768px.
══════════════════════════════════════════ */

/* Every export is drawn on the same 4-line band, ~73.5 units across. Scaling
   all of them by 60/73.5 puts that band at exactly 60px, the width the rest of
   the mobile page uses (#realtopstoriessvg and friends). */
var SMR_BAND = 73.5;
var SMR_BAND_PX = 60;

/* x spans of the four bars in segment A's artboard, used to carry the entry
   rail on upward past the top of A's own artboard */
var SMR_BARS = [[0, 24.6853], [37.0032, 49.3599], [58.0653, 64.2438], [69.9469, 74.0565]];
var SMR_TAIL = 1200;   /* how far up the bars run, in artboard units */

/* Per segment: the artboard size, where the rail enters and leaves it, and the
   point it turns at — all band centres, in artboard units. Every export is one
   straight run plus one turn, and the camera route is threaded through those
   turns so the view corners where the rail corners. */
var SMR_SEGS = [
  {
    key: 'A', el: 'smrSegA', w: 1812, h: 689,         /* down, then right      */
    enter: [37.03, 0], exit: [1812, 653.03], corner: [37.03, 653.03]
  },
  {
    key: 'B', el: 'smrSegB', w: 1883, h: 673,         /* right, then down      */
    enter: [0, 36.50], exit: [1846.26, 673], corner: [1846.26, 36.50]
  },
  {
    key: 'C', el: 'smrSegC', w: 2074, h: 544,         /* right, then up        */
    enter: [0, 507.05], exit: [2036.92, 0], corner: [2036.92, 507.05]
  },
  {
    key: 'D', el: 'smrSegD', w: 1976, h: 184,         /* right, then down      */
    enter: [0, 36.50], exit: [1939.39, 184], corner: [1939.39, 36.50]
  },
  {
    key: 'E', el: 'smrSegE', w: 184, h: 1061,         /* down, then left       */
    enter: [147.28, 0], exit: [0, 1024.39], corner: [147.28, 1024.39]
  },
  {
    /* F: custom 224x254 corner curve entering from C below and turning left into Cyber */
    key: 'F', el: 'smrSegF', w: 224, h: 254,
    enter: [187.05, 254], exit: [0, 37.09], corner: [187.05, 37.09]
  }
];

/* Where each mark meets the rail, as a fraction of its own box. Strategy's pair
   is the S trace path's own start and end — the line arrives at the bottom-left
   of the mark and the S carries it up to the top-right, exactly as in the
   mobile comp. The others follow the same idea for their own shapes. */
var SMR_ANCHORS = {
  strategy: { in: [0.086, 0.868], out: [0.914, 0.132] },
  risk: { in: [0.55, 0.15], out: [1.00, 0.51] },
  cyber: { in: [1.00, 0.85], out: [1.00, 0.33] },
  ai: { in: [1.00, 0.50] }
};

/* segment -> the mark it leaves (`from`) or the segment it carries on from
   (`after`), and the mark it dies behind (`to`) */
var SMR_CHAIN = [
  { seg: 'A', to: 'strategy' },
  { seg: 'B', from: 'strategy', to: 'risk' },
  { seg: 'C', from: 'risk' },
  { seg: 'F', after: 'C', to: 'cyber' },
  { seg: 'D', from: 'cyber' },
  { seg: 'E', after: 'D', to: 'ai' }
];

/* Builds the rail, lays the marks out along it and pins the whole thing.
   Returns a teardown so it can be rebuilt on rotation. */
function smrCreateRail() {
  var root = document.getElementById('smr');
  var stage = root && root.querySelector('.smr-stage');
  var track = document.getElementById('smrTrack');
  if (!root || !stage || !track) return null;

  var stations = {};
  root.querySelectorAll('.smr-station').forEach(function (el) {
    stations[el.getAttribute('data-smr')] = el;
  });
  var segs = {};
  SMR_SEGS.forEach(function (s) { segs[s.key] = Object.create(s); segs[s.key].node = document.getElementById(s.el); });
  var tail = document.getElementById('smrSegTail');
  var sectionCenter = document.querySelector('#services .section-center');

  var K = SMR_BAND_PX / SMR_BAND;      /* artboard unit -> px */
  var stageH = stage.getBoundingClientRect().height || window.innerHeight;
  var stageW = stage.getBoundingClientRect().width || window.innerWidth;

  /* ── measure each mark and where its copy sits relative to it ──
     Offsets are read off the live boxes, so it does not matter whether a
     station puts its words under the mark or beside it. */
  var box = {};
  root.style.removeProperty('--smr-logo-h');
  function measure() {
    Object.keys(stations).forEach(function (k) {
      var r = stations[k].querySelector('.smr-logo').getBoundingClientRect();
      var t = stations[k].querySelector('.smr-text').getBoundingClientRect();
      var b = box[k] || (box[k] = {});
      b.w = r.width; b.h = r.height;
      b.dTop = t.top - r.top; b.dBottom = t.bottom - r.bottom;
    });
  }

  /* ── the vertical tails, cut back to `v` px ─────────────────────────────
     The exports each run for hundreds of units after their turn. On a phone
     the whole rail has to sit inside one screen height, so the view never has
     to ride up or down while you scroll — only the dead straight run after
     each curve is shortened, the curves themselves are untouched. Every clip
     lands behind the mark it feeds, so nothing is visibly cut. */
  function trim(v) {
    var u = v / K;
    segs.A.clip = [0, 0];

    segs.B.exit = [1846.26, Math.max(126.77, 36.50 + u)];
    segs.B.clip = [0, 673 - segs.B.exit[1]];

    /* F is custom corner SVG connecting directly to C's top exit */
    segs.C.exit = [2036.92, 0];
    segs.C.clip = [0, 0];
    segs.F.clip = [0, 0];

    /* the run down to AI is split across two exports:
       Seg D curves down and exits vertically, Seg E continues down before curving left to AI */
    segs.D.exit = [1939.39, 184];
    segs.D.clip = [0, 0];
    var restAI = Math.max(280, (Math.max(380, stageH * 0.48) - (184 - 36.50) * K) / K);
    segs.E.enter = [147.28, Math.max(0, 1024.39 - restAI)];
    segs.E.clip = [segs.E.enter[1], 0];
  }

  /* ── walk the chain: every position falls out of Strategy's box ── */
  var anchor = function (k, which) {
    var a = SMR_ANCHORS[k][which];
    return [box[k].pos[0] + a[0] * box[k].w, box[k].pos[1] + a[1] * box[k].h];
  };
  function chain() {
    Object.keys(box).forEach(function (k) { box[k].pos = null; });
    box.strategy.pos = [0, 0];
    SMR_CHAIN.forEach(function (link) {
      var s = segs[link.seg];
      if (link.from) {
        var out = anchor(link.from, 'out');
        if (link.seg === 'B') {
          s.pos = [out[0] - s.enter[0] * K, 35];
        } else if (link.seg === 'C') {
          s.pos = [1900, 345];
        } else if (link.seg === 'D') {
          s.pos = [out[0] - s.enter[0] * K, 55];
        } else {
          s.pos = [out[0] - s.enter[0] * K, out[1] - s.enter[1] * K];
        }
      } else if (link.after) {
        var prev = segs[link.after];
        if (link.seg === 'F') {
          s.pos = [segs.C.pos[0] + (2036.92 - s.enter[0]) * K, segs.C.pos[1] - s.enter[1] * K];
        } else {
          s.pos = [prev.pos[0] + prev.exit[0] * K - s.enter[0] * K,
                   prev.pos[1] + prev.exit[1] * K - s.enter[1] * K];
        }
      } else if (link.to && box[link.to].pos) {
        /* segment A: work backwards from the mark it feeds */
        var into = anchor(link.to, 'in');
        if (link.seg === 'A') {
          s.pos = [into[0] - s.exit[0] * K, -310];
        } else {
          s.pos = [into[0] - s.exit[0] * K, into[1] - s.exit[1] * K];
        }
      }
      if (link.to && !box[link.to].pos) {
        var end = [s.pos[0] + s.exit[0] * K, s.pos[1] + s.exit[1] * K];
        var a = SMR_ANCHORS[link.to].in;
        if (link.to === 'risk') {
          box[link.to].pos = [1595, 590];
        } else {
          box[link.to].pos = [end[0] - a[0] * box[link.to].w, end[1] - a[1] * box[link.to].h];
        }
      }
    });
  }

  /* how tall the laid-out rail is, copy included */
  function extent() {
    var lo = Infinity, hi = -Infinity;
    Object.keys(box).forEach(function (k) {
      lo = Math.min(lo, box[k].pos[1] + Math.min(0, box[k].dTop));
      hi = Math.max(hi, box[k].pos[1] + box[k].h + Math.max(0, box[k].dBottom));
    });
    return { lo: lo, hi: hi, h: hi - lo };
  }

  /* Measure the station boxes at their full, prominent mobile size defined by CSS,
     and trim the segments with a proportional vertical drop */
  measure();
  var V = Math.max(170, Math.min(240, stageH * 0.25));
  trim(V);
  
  chain();

  /* ── the camera settles each mark in the middle of the stage. Because the
     whole rail is trimmed to fit one stage height, that vertical settle is only
     ever a fraction of a screen — the view drifts gently down into Risk and back
     up into Cyber rather than lurching. ── */

  function layout() {
    var sr = stage.getBoundingClientRect();
    stageH = sr.height || window.innerHeight;
    stageW = sr.width || window.innerWidth;
    SMR_SEGS.forEach(function (def) {
      var s = segs[def.key];
      if (!s.node) return;
      var svg = s.node.querySelector('svg');
      s.node.style.left = s.pos[0] + 'px';
      if (def.flip) {
        /* the svg is mirrored about its own top edge, so dropping it by a full
           artboard height puts row `h` at the top of the box and row `h - show`
           at the bottom — the hook, right way up */
        s.node.style.top = s.pos[1] + 'px';
        s.node.style.width = (def.w * K) + 'px';
        s.node.style.height = (def.show * K) + 'px';
        if (svg) svg.style.top = (def.h * K) + 'px';
        return;
      }
      s.node.style.top = (s.pos[1] + s.clip[0] * K) + 'px';
      s.node.style.width = (def.w * K) + 'px';
      s.node.style.height = ((def.h - s.clip[0] - s.clip[1]) * K) + 'px';
      if (svg) svg.style.top = (-s.clip[0] * K) + 'px';
    });
    Object.keys(stations).forEach(function (k) {
      stations[k].style.left = box[k].pos[0] + 'px';
      stations[k].style.top = box[k].pos[1] + 'px';
    });
    if (tail) {
      var stops = [], prev = 0;
      SMR_BARS.forEach(function (b) {
        stops.push('transparent ' + (prev * K).toFixed(2) + 'px ' + (b[0] * K).toFixed(2) + 'px');
        stops.push('#EC2D26 ' + (b[0] * K).toFixed(2) + 'px ' + (b[1] * K).toFixed(2) + 'px');
        prev = b[1];
      });
      tail.style.background = 'linear-gradient(to right,' + stops.join(',') + ')';
      tail.style.left = segs.A.pos[0] + 'px';
      tail.style.top = (segs.A.pos[1] - SMR_TAIL * K) + 'px';
      tail.style.width = (74.0565 * K) + 'px';
      tail.style.height = (SMR_TAIL * K + 1) + 'px';   /* 1px under A, so the join leaves no hairline */
    }
  }
  layout();

  /* ── where the marks actually ended up ──────────────────────────────────
     Some marks are placed by the chain above and some are nudged into place
     by hand in the stylesheet, so the camera asks the finished boxes where
     they are rather than trusting the numbers it just computed — that is
     what used to leave AI sitting off to one side, with its copy running off
     the edge, on every width but the one the stylesheet was tuned at.
     The track is a zero-size box at the rail's origin, so subtracting its
     rect gives track coordinates whatever transform the camera is holding. */
  function locate() {
    var o = track.getBoundingClientRect();
    Object.keys(stations).forEach(function (k) {
      /* the artwork, not its box: a mark is drawn at 150% of the box height
         and Cyber is scaled on top of that, so the box alone is not the mark */
      var el = stations[k].querySelector('.smr-logo-svg, .smr-logo-img') || stations[k].querySelector('.smr-logo');
      var art = el.getBoundingClientRect();
      var txt = stations[k].querySelector('.smr-text').getBoundingClientRect();
      box[k].seen = {
        l: Math.min(art.left, txt.left) - o.left,
        r: Math.max(art.right, txt.right) - o.left,
        t: Math.min(art.top, txt.top) - o.top,
        b: Math.max(art.bottom, txt.bottom) - o.top
      };
    });
  }
  locate();

  /* ── nothing on the rail animates: the line and the marks are simply there ── */
  var copy = function (k) { return stations[k].querySelectorAll('.smr-text > *'); };
  Object.keys(stations).forEach(function (k) {
    gsap.set(stations[k], { opacity: 1 });
    gsap.set(copy(k), { opacity: 1, y: 0 });
  });

  /* ── the ride: the camera runs along the rail, settling on each mark ──
     A mark is framed on the block it actually draws — its art and its copy
     together — so the whole thing lands centred and the words never run off
     an edge. Framing on the live-measured union (`seen`) rather than the
     pre-transform chain position is what keeps Cyber's mark — which carries
     its own translateX/scale in the stylesheet — from hanging off the left
     edge on a narrow phone: since art and copy are both inside that union
     box, centring on it can never push either one past the stage edge, the
     way centring on the mark alone did on a wide phone (the copy trails to
     the lower right there and the union used to run past the right edge). */
  var focusX = function (k) {
    return (box[k].seen.l + box[k].seen.r) / 2;
  };
  var focusY = function (k) {
    return (box[k].seen.t + box[k].seen.b) / 2;
  };
  /* the point where a segment turns, in track px */
  var bend = function (k) {
    var g = segs[k];
    return { x: g.pos[0] + g.corner[0] * K, y: g.pos[1] + g.corner[1] * K };
  };

  /* ── the camera route, written as camera positions rather than focus points,
     because what matters is that each leg moves along exactly one axis:
     straight across to a bend, straight down (or up) off it, then the short
     step onto the mark. The screen never drifts sideways while it is dropping,
     or up and down while it is running across. ── */
  var camOfMark = function (k) {
    return [stageW / 2 - focusX(k), stageH / 2 - focusY(k)];
  };
  var camXofBend = function (k) {
    if (k === 'D') {
      /* push the stop past the bend's true x so the camera runs fully right
         first — far enough that the D/E curve into AI is on screen — before
         the last leg of runTo() drops back left onto the AI mark */
      return stageW / 2 - (bend(k).x - stageW * 0.28);
    }
    return stageW / 2 - bend(k).x;
  };

  var route = [];
  var go = function (cx, cy, hold) {
    var last = route[route.length - 1];
    /* a step of a few px is not worth a leg of its own */
    if (last && Math.abs(last.cx - cx) < 3 && Math.abs(last.cy - cy) < 3) {
      last.hold = Math.max(last.hold, hold || 0);
      return;
    }
    route.push({ cx: cx, cy: cy, hold: hold || 0 });
  };

  var eA = bend('A');
  /* The resting/entry position used to be a flat stageH*0.80, tuned back when
     the tail (#smrSegTail) carried the bars up to meet the heading with no gap.
     Now that the tail is hidden (removed per the user, 2026-09-11), a flat
     fraction leaves a wide dead gap between the heading's copy and segment A's
     own bars on any width where the heading wraps shorter than it was tuned
     against. Derive the entry Y instead: at this point in the build track's
     transform is still (0,0) (fresh, or cleared by teardown on a rebuild), so
     segs.A.node's own getBoundingClientRect().top is exactly its offset from
     the track's origin — solving for the trackY that puts segment A's top
     24px under the heading's own measured bottom keeps the two touching at
     every width and every heading line-wrap, without moving segment A itself
     at all. */
  var entryY = stageH * 0.80 - eA.y;
  if (sectionCenter && segs.A.node) {
    entryY = sectionCenter.getBoundingClientRect().bottom + 24 - segs.A.node.getBoundingClientRect().top;
  }
  go(stageW / 2 - eA.x, entryY, 0);                     /* the bend sits low, just under the heading */
  go(stageW / 2 - eA.x, stageH * 0.50 - eA.y, 0.35);    /* … and rides to centre */

  var sCam = camOfMark('strategy');
  go(sCam[0], route[route.length - 1].cy, 0);           /* straight across  */
  go(sCam[0], sCam[1], 0.9);                            /* settle on the S  */

  /* mark -> bend -> mark, one axis at a time */
  var runTo = function (bendKey, markKey, endHold) {
    var m = camOfMark(markKey);
    var bx = camXofBend(bendKey);
    go(bx, route[route.length - 1].cy, 0.5);            /* across to the bend, stop */
    go(bx, m[1], 0);                                    /* off it, straight down/up */
    go(m[0], m[1], endHold);                            /* the last step onto it    */
  };
  runTo('B', 'risk', 0.9);
  runTo('C', 'cyber', 0.9);
  /* D and E share an x, so one bend carries the whole drop to AI: the camera
     runs fully right first, past the bend, so the D/E curve is on screen,
     then drops down and comes back left to settle centred on the AI mark. */
  runTo('D', 'ai', 1.0);

  var look = function (wp) {
    return { x: function () { return wp.cx; }, y: function () { return wp.cy; } };
  };
  gsap.set(track, look(route[0]));

  var legs = [], total = 0, i;
  for (i = 1; i < route.length; i++) {
    legs.push(Math.hypot(route[i].cx - route[i - 1].cx, route[i].cy - route[i - 1].cy));
    total += legs[i - 1];
  }

  var tl = gsap.timeline();
  var at = 0;
  for (i = 1; i < route.length; i++) {
    var wp = route[i];
    var dur = Math.max(0.14, 8.4 * (legs[i - 1] / (total || 1)));
    var to = look(wp);
    to.ease = 'none';
    to.duration = dur;
    tl.to(track, to, at);
    if (i === 1 && sectionCenter) {
      /* the heading sits above the pinned stage, not on the rail — let it go as
         the camera leaves the elbow rather than leaving a clipped strip behind */
      tl.to(sectionCenter, { opacity: 0, ease: 'none', duration: dur * 0.7 }, at);
    }
    at += dur + wp.hold;
  }
  tl.to({}, { duration: 0.4 }, at);

  var st = ScrollTrigger.create({
    trigger: root,
    /* .smr is 100svh, so it always fits: pin it flush to the top rather than
       offsetting by the leftover, which pushes the section down whenever the
       browser chrome hides and innerHeight grows past svh */
    start: 'top top',
    end: function () { return '+=' + Math.round(stage.getBoundingClientRect().height * 6.5); },
    pin: root,
    pinSpacing: true,
    anticipatePin: 1,
    scrub: 0.6,
    invalidateOnRefresh: true,
    animation: tl,
    onRefreshInit: layout
  });

  return function () {
    st.kill();
    tl.kill();
    var els = [track];
    Object.keys(stations).forEach(function (k) { els.push(stations[k]); });
    SMR_SEGS.forEach(function (d) { if (segs[d.key].node) els.push(segs[d.key].node); });
    gsap.set(els, { clearProps: 'all' });
    if (sectionCenter) gsap.set(sectionCenter, { clearProps: 'opacity' });
    root.style.removeProperty('--smr-logo-h');
  };
}

function initMobileServicesRail() {
  var root = document.getElementById('smr');
  if (!root) return;

  var teardown = smrCreateRail();
  var lastW = window.innerWidth;
  var timer = null;

  /* The Risk and AI marks are <img>, and an image has no width until it loads;
     the copy has no final height until the webfonts land. Both feed the chain
     that places every segment and mark, so measure once more when they are in.
     (Strategy and Cyber are inline <svg> and size themselves immediately, which
     is why only the other two ever landed off-centre.) */
  var settle = function () {
    if (teardown) teardown();
    teardown = smrCreateRail();
    lastW = window.innerWidth;
    ScrollTrigger.refresh();
  };
  var waits = [];
  root.querySelectorAll('.smr-logo-img').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    waits.push(new Promise(function (done) {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }));
  });
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
  if (waits.length) Promise.all(waits).then(function () { setTimeout(settle, 0); });

  /* Only a width change (a rotation) needs the chain rebuilt; height-only
     changes — the browser chrome sliding away — are ScrollTrigger's job. */
  function onResize() {
    if (window.innerWidth === lastW) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      if (teardown) teardown();
      teardown = smrCreateRail();
      ScrollTrigger.refresh();
    }, 200);
  }
  window.addEventListener('resize', onResize);

  return function () {
    clearTimeout(timer);
    window.removeEventListener('resize', onResize);
    if (teardown) teardown();
  };
}

/**
 * In-Page Text Search (Ctrl+F behavior)
 */
function initHeaderInPageSearch() {
  const searchInput = document.querySelector('.header-search-input');
  const searchBtn = document.querySelector('.header-search-btn');
  const searchForm = document.querySelector('.header-search');
  
  if (!searchInput || !searchForm) return;

  // Create or select the counter badge
  let counterBadge = document.querySelector('.header-search-count');
  if (!counterBadge) {
    counterBadge = document.createElement('div');
    counterBadge.className = 'header-search-count';
    searchForm.insertBefore(counterBadge, searchBtn);
  }

  let matches = [];
  let currentMatchIndex = -1;
  const searchableContainer = document.body; // Search entire body

  function clearHighlights() {
    const marks = document.querySelectorAll('mark.sthiros-search-match');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize(); // Merge adjacent text nodes
    });
    matches = [];
    currentMatchIndex = -1;
    updateCounterBadge();
  }

  // Recursive text node search
  function walkAndHighlight(node, queryRegex) {
    // Skip script, style, and already highlighted nodes
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'MARK'].includes(node.nodeName)) return;
    // Skip the search input itself to avoid weird nested DOM loops
    if (node.closest && node.closest('.header-search')) return;

    if (node.nodeType === 3) { // Text node
      const text = node.nodeValue;
      if (!text.trim()) return;

      const match = queryRegex.exec(text);
      if (match) {
        const mark = document.createElement('mark');
        mark.className = 'sthiros-search-match';
        mark.textContent = match[0];

        const afterNode = node.splitText(match.index);
        afterNode.nodeValue = afterNode.nodeValue.substring(match[0].length);
        node.parentNode.insertBefore(mark, afterNode);
        
        matches.push(mark);
        
        // Reset lastIndex because exec modifies it for global regexes
        queryRegex.lastIndex = 0; 
        
        // Continue walking the rest of the text node
        walkAndHighlight(afterNode, queryRegex);
      }
    } else if (node.nodeType === 1 && node.childNodes && !(node.tagName === 'SELECT' || node.tagName === 'TEXTAREA')) {
      // Element node
      // Iterate backwards so DOM mutations don't mess up the indices
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        walkAndHighlight(node.childNodes[i], queryRegex);
      }
    }
  }

  function updateCounterBadge() {
    if (!searchInput.value.trim()) {
      counterBadge.classList.remove('is-visible', 'no-results');
      counterBadge.textContent = '';
      return;
    }

    counterBadge.classList.add('is-visible');
    
    if (matches.length === 0) {
      counterBadge.classList.add('no-results');
      counterBadge.textContent = '0/0';
    } else {
      counterBadge.classList.remove('no-results');
      counterBadge.textContent = `${currentMatchIndex + 1}/${matches.length}`;
    }
  }

  function performSearch(query) {
    clearHighlights();
    
    if (!query) return;

    // Create case-insensitive regex, escape regex specials
    const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');

    // Small delay to allow typing, but keep it responsive
    walkAndHighlight(searchableContainer, regex);
    
    // Reverse matches because our recursive walk went backwards through children
    matches.reverse();

    if (matches.length > 0) {
      currentMatchIndex = 0;
      focusMatch(currentMatchIndex);
    } else {
      updateCounterBadge();
    }
  }

  function focusMatch(index) {
    if (matches.length === 0) return;

    // Remove active class from old match
    matches.forEach(m => m.classList.remove('is-active'));

    const activeMatch = matches[index];
    activeMatch.classList.add('is-active');
    
    // Auto-expand accordions/hidden parents if needed (Optional depending on DOM structure)
    let parent = activeMatch.parentNode;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'DETAILS') {
        parent.setAttribute('open', '');
      } else if (parent.classList && parent.classList.contains('accordion-content')) {
        // Mock opening accordion if sthiros uses custom classes
        parent.style.maxHeight = 'none'; 
        parent.style.display = 'block';
      }
      parent = parent.parentNode;
    }

    // Scroll into view using Lenis or native
    const yOffset = -150; // Offset for fixed header
    const y = activeMatch.getBoundingClientRect().top + window.scrollY + yOffset;

    if (window.lenis) {
      window.lenis.scrollTo(y, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    updateCounterBadge();
  }

  // Event Listeners
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      performSearch(e.target.value.trim());
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        // Cycle to next match on enter
        currentMatchIndex = (currentMatchIndex + 1) % matches.length;
        focusMatch(currentMatchIndex);
      }
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (matches.length > 0) {
        currentMatchIndex = (currentMatchIndex + 1) % matches.length;
        focusMatch(currentMatchIndex);
      } else {
        performSearch(searchInput.value.trim());
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initHeaderInPageSearch);
