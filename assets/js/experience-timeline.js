// The experience timeline. On laptops and up, one wheel notch (or arrow key) glides the next role
// into the middle of the screen. More input during the glide moves the target on again, so fast
// scrolling chains through roles and is never blocked. Earlier cards scroll up as normal and stack
// at the top of the window once they reach it. The line fills down to the current role, and the
// toolkit beside it lights the skills that role used (on the About screen above, it lights them all).
// On phones and tablets it is a plain timeline.
(() => {
  const layout = document.querySelector('[data-timeline]');
  if (!layout) {
    return;
  }
  const list = layout.querySelector('[data-timeline-list]');
  const rows = [...list.querySelectorAll('[data-timeline-row]')];
  const dots = rows.map((row) => row.querySelector('.timeline__dot'));
  const kit = layout.querySelector('[data-timeline-kit]');
  const tiles = [...kit.querySelectorAll('[data-skill]')];
  const hint = layout.querySelector('[data-timeline-hint]');
  const hintText = {
    all: 'Everything I work with. Scroll on to see what I used where.',
    role: 'Lit: the skills I used in the role in view.',
  };
  const header = document.querySelector('[data-site-header]');
  const wideScreen = window.matchMedia('(min-width: 64rem)');
  const pileGap = 32; // px between stacked cards
  const stepSize = 60; // px of wheel movement that counts as one step (a mouse notch is about 100)

  let stops = []; // scroll positions that put each role in the middle of the screen
  let naturalTops = [];
  let stackTop = 0;
  let activeIndex = -1;
  let isQueued = false;

  function headerHeight() {
    return header ? header.getBoundingClientRect().height : 0;
  }

  function size() {
    rows.forEach((row) => {
      row.style.transform = '';
    });
    if (!wideScreen.matches) {
      stops = [];
      update();
      return;
    }
    const gap = Number.parseFloat(window.getComputedStyle(list).rowGap) || 0;
    const top = headerHeight();
    const centre = Math.max(top + 16, (window.innerHeight - rows[0].offsetHeight) / 2 + top / 2);
    stackTop = top + 16;
    let y = list.getBoundingClientRect().top + window.scrollY;
    naturalTops = rows.map((row) => {
      const natural = y;
      y += row.offsetHeight + gap;
      return natural;
    });
    stops = naturalTops.map((natural) => Math.round(natural - centre));
    update();
  }

  function centreOf(element) {
    const box = element.getBoundingClientRect();
    return box.top + box.height / 2;
  }

  function update() {
    isQueued = false;
    const y = window.scrollY;
    let active = 0;
    let progress = 0; // 0–1 on the way to the next role
    if (stops.length) {
      stops.forEach((stop, i) => {
        if (y >= stop - 1) {
          active = i;
        }
      });
      if (active < stops.length - 1) {
        progress = Motion.clamp((y - stops[active]) / (stops[active + 1] - stops[active]));
      }
      // A card keeps its normal scroll position until it reaches its place in the stack at the
      // top. After the last role, the stack scrolls away with the page.
      const over = Math.max(0, y - stops[stops.length - 1]);
      rows.forEach((row, i) => {
        const natural = naturalTops[i] - y;
        const slot = stackTop + i * pileGap - over;
        const shift = Math.max(0, slot - natural);
        row.style.transform = shift ? `translateY(${shift.toFixed(1)}px)` : '';
        row.classList.toggle('is-stacked', shift > 0.5);
      });
    } else {
      const middle = window.innerHeight * 0.55;
      dots.forEach((dot, i) => {
        if (dot.getBoundingClientRect().top < middle) {
          active = i;
        }
      });
    }
    rows.forEach((row, i) => {
      row.classList.toggle('is-past', i < active);
      row.classList.toggle('is-active', i === active);
      row.style.setProperty('--depth', Math.max(0, active - i));
    });

    // The line fills down to the current dot, and on towards the next one as it arrives.
    let end = centreOf(dots[active]);
    if (progress > 0) {
      end += (centreOf(dots[active + 1]) - end) * progress;
    }
    list.style.setProperty('--timeline-fill', `${Math.max(0, end - list.getBoundingClientRect().top)}px`);

    // Up on the About screen every skill is lit; from the timeline on, only the role in view's.
    const isOnAbout = stops.length > 0 && y < stops[0] - window.innerHeight * 0.5;
    const state = isOnAbout ? 'all' : active;
    kit.classList.toggle('is-filtering', stops.length > 0);
    if (state !== activeIndex) {
      activeIndex = state;
      const uses = isOnAbout ? null : new Set(rows[active].dataset.uses.split(' '));
      tiles.forEach((tile) => tile.classList.toggle('is-lit', !uses || uses.has(tile.dataset.skill)));
      if (hint) {
        hint.textContent = isOnAbout ? hintText.all : hintText.role;
      }
    }
  }

  // --- Gliding between roles ---
  let target = -1; // index being glided to, or -1 when idle
  let frame = 0;
  let lastFrameTime = 0;
  let wheelTotal = 0;
  let lastWheelTime = 0;

  function nearest() {
    const y = window.scrollY;
    let best = 0;
    stops.forEach((stop, i) => {
      if (Math.abs(stop - y) < Math.abs(stops[best] - y)) {
        best = i;
      }
    });
    return best;
  }

  function glide(now) {
    const goal = stops[target];
    const y = window.scrollY;
    const elapsed = Math.min(64, now - (lastFrameTime || now));
    lastFrameTime = now;
    // Ease out, but always move at least a pixel: the scroll position rounds to whole pixels, so
    // tiny steps near the end would otherwise never arrive.
    const distance = goal - y;
    const move = distance * (1 - Math.exp(-elapsed / 110));
    const next = y + Math.sign(distance) * Math.max(1, Math.abs(move));
    if (Math.abs(distance) <= 1) {
      window.scrollTo({ top: goal, behavior: 'instant' });
      target = -1;
      frame = 0;
      return;
    }
    window.scrollTo({ top: next, behavior: 'instant' });
    frame = requestAnimationFrame(glide);
  }

  function stopGlide() {
    cancelAnimationFrame(frame);
    frame = 0;
    target = -1;
  }

  function moveTo(index) {
    target = index;
    if (Motion.reduceMotion) {
      window.scrollTo({ top: stops[index], behavior: 'instant' });
      target = -1;
      return;
    }
    if (!frame) {
      lastFrameTime = 0;
      frame = requestAnimationFrame(glide);
    }
  }

  // The timeline owns the scroll from its first role to its last. work-panels.js brings the page
  // in from About or from the Kyōryū panel, and takes it on again past either end.
  function isInside() {
    const y = window.scrollY;
    return target !== -1 || (y >= stops[0] - 2 && y <= stops[stops.length - 1] + 2);
  }

  // Moves one role in the given direction. Returns false when the page should scroll as normal.
  function step(direction) {
    if (!stops.length || !isInside()) {
      return false;
    }
    const y = window.scrollY;
    let from = target !== -1 ? target : nearest();
    if (target === -1) {
      if (direction > 0 && y < stops[from] - 2) {
        from -= 1; // part-way between roles: finish the move in that direction
      } else if (direction < 0 && y > stops[from] + 2) {
        from += 1;
      }
    }
    const next = from + direction;
    if (next < 0 || next >= stops.length) {
      if (target === -1) {
        return false; // sitting on an end role: work-panels.js has already taken this one
      }
      // Mid-glide past either end: hand straight over to the screen before or after the timeline.
      stopGlide();
      window.dispatchEvent(new CustomEvent('timeline:leave', { detail: direction }));
      return true;
    }
    moveTo(next);
    return true;
  }

  window.addEventListener('wheel', (event) => {
    // work-panels.js runs first and cancels the event when it has used it (or is swallowing momentum).
    if (event.defaultPrevented || !stops.length || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX) || !isInside()) {
      return;
    }
    const now = performance.now();
    if (now - lastWheelTime > 220) {
      wheelTotal = 0;
    }
    lastWheelTime = now;
    const lineHeight = 16;
    const delta = event.deltaY * (event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? window.innerHeight : 1);
    wheelTotal += delta;
    // A trackpad sends many small movements: they add up until they are worth one step.
    if (Math.abs(wheelTotal) < stepSize) {
      const y = window.scrollY;
      if (target !== -1 || (y >= stops[0] - 2 && y <= stops[stops.length - 1] + 2)) {
        event.preventDefault();
      }
      return;
    }
    const direction = Math.sign(wheelTotal);
    wheelTotal = 0;
    if (step(direction)) {
      event.preventDefault();
    }
  }, { passive: false });

  const keyDirections = { PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  window.addEventListener('keydown', (event) => {
    const direction = keyDirections[event.key];
    if (event.defaultPrevented || !direction || Motion.isTyping() || document.querySelector('dialog[open], .dev-console.is-open')) {
      return;
    }
    if (step(direction)) {
      event.preventDefault();
    }
  });

  // For work-panels.js: where the timeline's roles sit, and whether it is mid-glide.
  window.ExperienceTimeline = {
    stops: () => stops,
    isGliding: () => target !== -1,
  };

  // Dragging the scrollbar or touching the screen takes over from a glide.
  window.addEventListener('mousedown', stopGlide);
  window.addEventListener('touchstart', stopGlide, { passive: true });

  window.addEventListener('scroll', () => {
    if (!isQueued) {
      isQueued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', size);
  // Anything above changing height (fonts, images) moves the stops, so measure again.
  new ResizeObserver(() => size()).observe(document.body);
  window.addEventListener('load', size);
  wideScreen.addEventListener('change', size);
  size();
})();
