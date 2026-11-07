// The main projects as full-screen panels that stack. Each one sinks back as the next slides over it.
// With a mouse wheel, trackpad or keyboard, one scroll moves cleanly through the opening screens:
// the hero, About, the experience timeline, each panel, then the client work. Inside the timeline,
// experience-timeline.js takes over and steps role by role; leaving either end of it comes back here.
// Input that arrives while a move is under way (or the trackpad's momentum after it lands) is
// ignored, so a burst of scrolling moves one screen, not several. Touch screens use CSS scroll
// snapping instead.
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
  const about = document.querySelector('#about');
  const experience = document.querySelector('[data-timeline-section]');
  const after = document.querySelector('[data-work-after]');

  function pageTop(element) {
    return Math.round(element.getBoundingClientRect().top + window.scrollY);
  }

  function headerHeight() {
    return document.querySelector('[data-site-header]')?.offsetHeight || 0;
  }

  // The experience "zone": scroll positions this script leaves alone. On laptops it runs from the
  // first role to the last (the timeline steps between them). On smaller screens the timeline is a
  // plain list, so the zone is the whole section, scrolled as normal.
  function experienceZone() {
    const stops = window.ExperienceTimeline?.stops() || [];
    if (stops.length) {
      return [stops[0], stops[stops.length - 1]];
    }
    if (!experience) {
      return null;
    }
    const start = pageTop(experience) - headerHeight();
    const end = Math.max(start, pageTop(experience) + experience.offsetHeight - window.innerHeight);
    return [start, end];
  }

  // The stops: the top of the hero, the About screen, both ends of the experience zone, each panel,
  // then the client work just under the header. Each panel is one screen tall.
  function stopList() {
    const sectionTop = pageTop(section);
    const panelHeight = panels[0].offsetHeight;
    const tops = panels.map((panel, index) => Math.round(sectionTop + index * panelHeight));
    const zone = experienceZone();
    if (zone) {
      tops.push(...zone);
    }
    if (about) {
      tops.push(pageTop(about));
    }
    if (hero) {
      tops.push(pageTop(hero));
    }
    if (after) {
      tops.push(pageTop(after) - headerHeight() - 24);
    }
    return { tops: tops.sort((a, b) => a - b), zone };
  }

  // The stop to move to, or null when the scroll should carry on as normal (outside the stops, or
  // inside the experience zone, where the timeline handles it).
  function targetFor(direction) {
    const { tops, zone } = stopList();
    const position = window.scrollY;
    const viewportHeight = window.innerHeight;
    const first = tops[0];
    const last = tops[tops.length - 1];
    if (direction > 0) {
      if (position < first - viewportHeight * 0.6 || position >= last - 2) {
        return null;
      }
      if (zone && position >= zone[0] - 2 && position < zone[1] - 2) {
        return null;
      }
      return tops.find((top) => top > position + 2);
    }
    if (position <= first + 2 || position > last + viewportHeight * 0.6) {
      return null;
    }
    if (zone && position > zone[0] + 2 && position <= zone[1] + 2) {
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
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX) || window.ExperienceTimeline?.isGliding()) {
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

  // The timeline asks for this when you scroll past either end of it mid-glide.
  window.addEventListener('timeline:leave', (event) => {
    const { tops, zone } = stopList();
    if (!zone) {
      return;
    }
    const target = event.detail > 0
      ? tops.find((top) => top > zone[1] + 2)
      : [...tops].reverse().find((top) => top < zone[0] - 2);
    if (target !== undefined) {
      moveTo(target);
    }
  });

  const keyDirections = { PageDown: 1, ArrowDown: 1, ' ': 1, PageUp: -1, ArrowUp: -1 };
  window.addEventListener('keydown', (event) => {
    const direction = event.key === ' ' && event.shiftKey ? -1 : keyDirections[event.key];
    if (!direction || Motion.isTyping() || document.querySelector('dialog[open], .dev-console.is-open') || window.ExperienceTimeline?.isGliding()) {
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
