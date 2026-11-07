// The main projects as full-screen panels that stack. Each one sinks back as the next slides over it.
// With a mouse wheel, trackpad or keyboard, one scroll moves cleanly from the hero to the first panel,
// from each panel to the next, and from the last panel to the client work. Input that
// arrives while it is still moving (or the trackpad's momentum after it lands) is ignored, so a
// burst of scrolling moves one panel, not several. Touch screens use CSS scroll snapping instead.
(() => {
  const section = document.querySelector('[data-work-panels]');
  if (!section) {
    return;
  }
  const panels = [...section.querySelectorAll('.work-panel')];
  const inners = panels.map((panel) => panel.querySelector('[data-work-panel]'));
  const quietGap = 180;
  const arrivalTimeout = 1400;

  /* === Stacking effect === */

  // The effect follows the exact scroll position, so it reads it once per frame.
  let isQueued = false;
  function updateStack() {
    isQueued = false;
    if (Motion.reduceMotion) {
      return;
    }
    const viewportHeight = window.innerHeight;
    panels.forEach((panel, index) => {
      const next = panels[index + 1];
      if (!next) {
        return;
      }
      const covered = Motion.clamp(1 - next.getBoundingClientRect().top / viewportHeight);
      inners[index].style.transform = `scale(${1 - covered * 0.1})`;
      inners[index].style.filter = `brightness(${1 - covered * 0.6})`;
    });
  }
  window.addEventListener('scroll', () => {
    if (!isQueued) {
      isQueued = true;
      requestAnimationFrame(updateStack);
    }
  }, { passive: true });

  /* === One scroll, one panel === */

  let isMoving = false;
  let isSettling = false;
  let lastInputTime = 0;

  const hero = document.querySelector('[data-hero]');
  const after = document.querySelector('[data-work-after]');

  // The stops: the top of the hero, each panel, then the block after the panels (the stats and the
  // start of the client work), just under the header. Each panel is one screen tall, so the panel
  // tops sit one screen apart from the section top.
  function panelTops() {
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const panelHeight = panels[0].offsetHeight;
    const tops = panels.map((panel, index) => Math.round(sectionTop + index * panelHeight));
    if (hero) {
      tops.unshift(Math.round(hero.getBoundingClientRect().top + window.scrollY));
    }
    if (after) {
      const headerHeight = document.querySelector('[data-site-header]')?.offsetHeight || 0;
      tops.push(Math.round(after.getBoundingClientRect().top + window.scrollY - headerHeight - 24));
    }
    return tops;
  }

  // The panel to move to, or null when the scroll should leave the panels as normal.
  function targetFor(direction) {
    const tops = panelTops();
    const position = window.scrollY;
    const viewportHeight = window.innerHeight;
    const first = tops[0];
    const last = tops[tops.length - 1];
    if (direction > 0) {
      if (position < first - viewportHeight * 0.6 || position >= last - 2) {
        return null;
      }
      return tops.find((top) => top > position + 2);
    }
    if (position <= first + 2 || position > last + viewportHeight * 0.6) {
      return null;
    }
    return [...tops].reverse().find((top) => top < position - 2);
  }

  function moveTo(target) {
    isMoving = true;
    window.scrollTo({ top: target, behavior: Motion.reduceMotion ? 'auto' : 'smooth' });
    const startTime = performance.now();
    const waitForArrival = () => {
      const hasArrived = Math.abs(window.scrollY - target) < 2;
      if (hasArrived || performance.now() - startTime > arrivalTimeout) {
        isMoving = false;
        isSettling = true;
        return;
      }
      requestAnimationFrame(waitForArrival);
    };
    requestAnimationFrame(waitForArrival);
  }

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }
    const now = performance.now();
    const gap = now - lastInputTime;
    lastInputTime = now;
    // Swallow input while a move is under way, and the rest of the burst that started it
    // (any wheel event less than quietGap after the previous one), so momentum cannot skip ahead.
    if (isMoving || (isSettling && gap < quietGap)) {
      event.preventDefault();
      return;
    }
    isSettling = false;
    const target = targetFor(Math.sign(event.deltaY));
    if (target === null || target === undefined) {
      return;
    }
    event.preventDefault();
    moveTo(target);
  }, { passive: false });

  const keyDirections = { PageDown: 1, ArrowDown: 1, ' ': 1, PageUp: -1, ArrowUp: -1 };
  window.addEventListener('keydown', (event) => {
    const direction = event.key === ' ' && event.shiftKey ? -1 : keyDirections[event.key];
    if (!direction || Motion.isTyping() || document.querySelector('dialog[open], .dev-console.is-open')) {
      return;
    }
    if (event.key === ' ' && event.target.closest && event.target.closest('button, a, [role="listbox"]')) {
      return;
    }
    if (isMoving) {
      event.preventDefault();
      return;
    }
    const target = targetFor(direction);
    if (target === null || target === undefined) {
      return;
    }
    event.preventDefault();
    moveTo(target);
  });

  updateStack();
})();
