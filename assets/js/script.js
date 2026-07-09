gsap.registerPlugin(ScrollTrigger);

let lenis = null;

function boot() {
  initLenis();
  // initWebGLBackground(); /* Disabled per user request */
  initHeroTrackAlign();
  initHeroSvgTrackScroll();
  initHeroLinesScroll();
  initServicesSvgTrackScroll();
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
      tl.fromTo(cards,
        { opacity: 0, x: 100 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
        0 // Start at the same time as the SVG line
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

function initServicesSvgTrackScroll() {
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

  // Horizontal scroll animation for the services rail SVG
  const servicesRail = document.querySelector('.services-rail');
  const servicesTrack = document.querySelector('.services-track');
  const riskLogo = document.querySelector('.risk-logo');

  if (servicesRail && servicesTrack) {
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
        const strategyH2 = document.querySelector('.strategy-content h2');
        const strategyP = document.querySelector('.strategy-content p');
        const strategySvg = document.querySelector('.second-svg');
        const strategyLines = document.querySelectorAll('.second-svg .strategy-line');

        if (sTracePath && strategyLogoWrapper && strategyH2 && strategyP && strategySvg) {
          gsap.set(strategyLogoWrapper, { opacity: 1 });
          // Use hardcoded length (1050) because getTotalLength() inside <mask> can be unreliable in some browsers
          const pathLength = 1050;
          gsap.set(sTracePath, { strokeDasharray: pathLength + 10, strokeDashoffset: pathLength + 10 });
          gsap.set([strategyH2, strategyP], { opacity: 0, y: 40 });

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

        if (sTracePath && strategyH2 && strategyP && strategySvg) {
          tl.to(sTracePath, { strokeDashoffset: 0, ease: 'none', duration: 0.4 }, "logoTrace")
            .to([strategyH2, strategyP], { opacity: 1, y: 0, duration: 0.2, stagger: 0.05, ease: 'power3.out' });
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
            return (lineOffset - 190) - (700 * scale) + 684.8 - riskVertOffset; // Move track DOWN by exactly 684.8px to perfectly center Cyber logo
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
            return -(riskX - vw / 2 + 1159 + cyberHorizScroll);
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
            // The vertical distance between Cyber logo and AI logo is exactly 966 * scale
            const cyberVertScrollDOWN = 966 * scale;
            return (lineOffset - 190) - (700 * scale) + 684.8 - riskVertOffset - cyberVertScrollDOWN; // move track UP by exactly the distance
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

  // ── UNPINNED TIMELINE (Draws line to 50% while scrolling into view) ──
  const tlUnpinned = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 75%', // Starts after the heading has come up a bit
      end: 'center center',
      scrub: 1.2
    }
  });

  tlUnpinned.to(whyLines, {
    opacity: 1,
    strokeDashoffset: (i, el) => el.getTotalLength() - 1150, // Pauses halfway behind the cards
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
  
  // When the 4th card arrives, the SVG line continues to move forward
  tlPinned.to(whyLines, {
    strokeDashoffset: (i, el) => el.getTotalLength() - 1600,
    ease: "none",
    duration: 0.8
  }, 't3'); // Draws concurrently with 4th card hold

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
  const cursor = document.createElement('div');
  cursor.id = 'cursor-glow';
  Object.assign(cursor.style, {
    position: 'fixed', width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,75,26,0.07) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: '9999', transform: 'translate(-50%, -50%)',
    top: '0', left: '0'
  });
  document.body.appendChild(cursor);
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
   INDUSTRIES NEW SECTION SCROLL ANIMATION
══════════════════════════════════════════ */
function initIndustriesNewScroll() {
  const section = document.querySelector('.section-industries-new');
  const titleContainer = document.querySelector('.industries-new-container');
  const title = document.querySelector('.industries-new-title');
  if (!section || !title) return;

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

  const cards = gsap.utils.toArray('.expert-card');
  const cardInners = gsap.utils.toArray('.card-inner');

  // Scatter positions dynamically based on screen width
  let gapX = 360;
  let gapXBottom = 180;
  let gapY = -190;
  let gapYBottom = 190;

  // Reduce gap for 1366px / 1024px screens
  if (window.innerWidth <= 1400) {
    gapX = 260;
    gapXBottom = 130;
    gapY = -160;
    gapYBottom = 160;
  }

  const scatter = [
    [-gapX, gapY], [0, gapY], [gapX, gapY], [-gapXBottom, gapYBottom], [gapXBottom, gapYBottom], // Set 1
    [-gapX, gapY], [0, gapY], [gapX, gapY], [-gapXBottom, gapYBottom], [gapXBottom, gapYBottom]  // Set 2
  ];

  // Initial State for Cards
  gsap.set(cards, {
    y: window.innerHeight + 300,
    x: 0,
    rotation: 0
  });

  const verticalLines = document.querySelector('.center-vertical-lines');
  if (verticalLines) {
    gsap.set(verticalLines, { clipPath: 'inset(0% 0% 100% 0%)', opacity: 1 });
  }

  // Master Pinning Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=500%', // Reduced scroll area to bring next section faster
      scrub: 1.2,
      pin: true,
      anticipatePin: 1
    }
  });

  // 1. Text Highlight
  tl.fromTo(spans, {
    opacity: 0.2,
    y: 20
  }, {
    opacity: 1,
    y: 0,
    stagger: 0.1,
    ease: 'power1.out',
    duration: 1.5
  });

  // 2. Text Hides (moves up and fades out)
  tl.to(titleContainer, {
    y: -300,
    opacity: 0,
    ease: 'power2.in',
    duration: 1.5
  }, '+=0.2');

  // 3. Swap z-index right before cards come up so first 5 are in front
  tl.set(cards.slice(0, 5), { zIndex: 10 });
  tl.set(cards.slice(5, 10), { zIndex: 1 });

  // 4. First 5 Cards slide up to the center one by one
  tl.to(cards.slice(0, 5), {
    y: 0,
    ease: 'power3.out',
    stagger: 0.4,
    duration: 1.5
  }, '+=0.2');

  // 5. First 5 Cards Scatter (remaining 5 stay in the center deck)
  tl.to(cards.slice(0, 5), {
    x: (i) => scatter[i][0],
    y: (i) => scatter[i][1],
    rotation: 0,
    stagger: 0.2,
    ease: 'power2.inOut',
    duration: 1.5
  }, '+=0.2');

  // 5. First 5 Cards Flip (fast overlapping flip)
  tl.to(cardInners.slice(0, 5), {
    rotateY: 180,
    ease: 'power2.inOut',
    stagger: 0.2,
    duration: 0.6
  }, '+=0.1');

  // 6. Move up and wash out first 5 smoothly: Top -> Bottom
  tl.addLabel('firstWashStart', '+=0.5');

  tl.to([cards[0], cards[1], cards[2]], {
    y: (i, el) => scatter[cards.indexOf(el)][1] - window.innerHeight - 300,
    opacity: 0,
    ease: 'none',
    stagger: 0.15,
    duration: 2.5
  }, 'firstWashStart');

  tl.to([cards[3], cards[4]], {
    y: (i, el) => scatter[cards.indexOf(el)][1] - window.innerHeight - 300,
    opacity: 0,
    ease: 'none',
    stagger: 0.15,
    duration: 2.5
  }, 'firstWashStart+=1.0');

  // 7. Second 5 Cards rise up from below the fold right as the bottom pair
  // of the first 5 starts washing out, so they cross paths and are already
  // arriving by the time the bottom pair clears — no dead gap.
  tl.to(cards.slice(5, 10), {
    x: (i) => scatter[i + 5][0],
    y: (i) => scatter[i + 5][1],
    ease: 'power2.inOut',
    stagger: 0.2,
    duration: 1.5
  }, 'firstWashStart+=1.0');

  // 8. Second 5 Cards Flip (fast overlapping flip)
  tl.to(cardInners.slice(5, 10), {
    rotateY: 180,
    ease: 'power2.inOut',
    stagger: 0.2,
    duration: 0.6
  }, '+=0.1');

  // 9. Move up and wash out second 5 smoothly: Top -> Bottom
  tl.to([cards[5], cards[6], cards[7]], {
    y: (i, el) => scatter[cards.indexOf(el)][1] - window.innerHeight - 300,
    opacity: 0,
    ease: 'none',
    stagger: 0.15,
    duration: 2.5
  }, '+=0.1');

  tl.to([cards[8], cards[9]], {
    y: (i, el) => scatter[cards.indexOf(el)][1] - window.innerHeight - 300,
    opacity: 0,
    ease: 'none',
    stagger: 0.15,
    duration: 2.5
  }, '-=1.5');

  // 10. Animate the SVG lines visible when bottom cards move up
  if (verticalLines) {
    tl.to(verticalLines, {
      clipPath: 'inset(0% 0% 0% 0%)',
      ease: 'none',
      duration: 1.5
    }, '<');
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

// ═══════════════ HEADER HIDE ON SCROLL ═══════════════
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const body = document.body;

        // Menu open ho to header dikhta rahe
        if (body.classList.contains('menu-open')) {
          ticking = false;
          return;
        }

        // Top pe wapas aayein to hamesha dikhao
        if (currentScrollY <= 10) {
          header.classList.remove('header-hidden');
        } else if (currentScrollY > lastScrollY + 5) {
          // Niche scroll — hide
          header.classList.add('header-hidden');
        } else if (currentScrollY < lastScrollY - 5) {
          // Upar scroll — show
          header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
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

  // ═══════════════ TOGGLE BUTTON (sirf on/off visual) ═══════════════
  const themeToggleBtn = document.querySelector('.theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      themeToggleBtn.classList.toggle('is-on');
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
