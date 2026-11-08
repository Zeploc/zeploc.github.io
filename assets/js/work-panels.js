// The main projects as full-screen panels that stack. Each one sinks back as the next slides over it.
// With a mouse wheel, trackpad or keyboard, one scroll moves cleanly through the opening screens:
// the hero, each panel, About, the experience timeline, then each chapter after it (client work to
// resources). Inside the timeline, experience-timeline.js takes over and steps role by role; leaving
// either end of it comes back here. A chapter taller than the window scrolls as normal until its end
// is in view, then the next scroll moves on to the next chapter (and the same going up).
// Between the hero and the first panel the move is a zoom (hero.js): the viewscreen grows until its
// project fills the window, and the page lands on that project's panel. So the panels start with
// the project on the viewscreen, and wrap round. A click on the viewscreen takes the same route.
// Input that arrives while a move is under way (or the trackpad's momentum after it lands) is
// ignored, so a burst of scrolling moves one screen, not several. Touch screens use CSS scroll
// snapping instead.
(() => {
  const section = document.querySelector('[data-work-panels]');
  if (!section) {
    return;
  }
  // In page order at the start; currentPanels() gives the order after the hero has rearranged them.
  const panels = [...section.querySelectorAll('.work-panel')];
  const currentPanels = () => [...section.querySelectorAll('.work-panel')];
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
    const ordered = currentPanels();
    ordered.forEach((panel, index) => {
      const next = ordered[index + 1];
      const inner = panel.querySelector('[data-work-panel]');
      const covered = next ? Motion.clamp(1 - next.getBoundingClientRect().top / viewportHeight) : 0;
      inner.style.transform = covered ? `scale(${1 - covered * 0.1})` : '';
      inner.style.filter = covered ? `brightness(${1 - covered * 0.6})` : '';
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
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const chapterGap = 24; // px between the header and a chapter's heading, and below a chapter's end

  function pageTop(element) {
    return Math.round(element.getBoundingClientRect().top + window.scrollY);
  }

  function headerHeight() {
    return document.querySelector('[data-site-header]')?.offsetHeight || 0;
  }

  function maxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  // Each chapter after the timeline: where it starts (its heading just under the header, above its
  // top padding) and, when it is taller than the window, where it ends (its last content in view).
  // Between the two it scrolls as normal.
  function chapterSpans() {
    const last = maxScroll();
    return chapters.map((chapter, index) => {
      const padding = Number.parseFloat(window.getComputedStyle(chapter).paddingTop) || 0;
      const start = Math.min(last, pageTop(chapter) + padding - headerHeight() - chapterGap);
      const next = chapters[index + 1];
      const end = next ? pageTop(next) + chapterGap - window.innerHeight : last;
      return [start, Math.min(last, Math.max(start, end))];
    });
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

  // The hero is a stop when it fits the window (laptops). On smaller windows it is taller, so it
  // scrolls as normal and the first stop is the first panel.
  function heroFits() {
    return Boolean(hero) && hero.offsetHeight <= window.innerHeight + 2;
  }

  // The stops: the top of the hero, each panel, the About screen, both ends of the experience zone,
  // then the start (and, for a tall chapter, the end) of each chapter after it. Each panel is one
  // screen tall. A tall chapter is a zone of its own, like the experience zone.
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
    if (heroFits()) {
      tops.push(pageTop(hero));
    }
    const chapterZones = [];
    chapterSpans().forEach(([start, end]) => {
      tops.push(start);
      if (end > start + 2) {
        tops.push(end);
        chapterZones.push([start, end]);
      }
    });
    return { tops: [...new Set(tops)].sort((a, b) => a - b), zone, chapterZones };
  }

  // The stop to move to, or null when the scroll should carry on as normal (outside the stops, or
  // inside a zone: the experience zone, where the timeline handles it, or a tall chapter). A scroll
  // of `delta` px that would carry past either end of a tall chapter lands on that end instead.
  function targetFor(direction, delta) {
    const { tops, zone, chapterZones } = stopList();
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
      const chapter = chapterZones.find(([start, end]) => position >= start - 2 && position < end - 2);
      if (chapter) {
        return position + delta >= chapter[1] - 2 ? chapter[1] : null;
      }
      return tops.find((top) => top > position + 2);
    }
    if (position <= first + 2 || position > last + viewportHeight * 0.6) {
      return null;
    }
    if (zone && position > zone[0] + 2 && position <= zone[1] + 2) {
      return null;
    }
    const chapter = chapterZones.find(([start, end]) => position > start + 2 && position <= end + 2);
    if (chapter) {
      return position + delta <= chapter[0] + 2 ? chapter[0] : null;
    }
    return [...tops].reverse().find((top) => top < position - 2);
  }

  // How far a wheel event or key would scroll the page, in px.
  function wheelDistance(event) {
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    return event.deltaY * scale;
  }

  function keyDistance(key, direction) {
    return direction * (key.startsWith('Arrow') ? 40 : window.innerHeight * 0.85);
  }

  // The zoom between the hero and the first panel, when the hero is at the top of the window.
  const canZoom = () => Boolean(window.HeroScreen) && window.HeroScreen.canZoom() && heroFits();

  async function zoomToPanels() {
    isMoving = true;
    const first = currentPanels()[0];
    await window.HeroScreen.zoomIn(() => {
      // The panel shows the same picture as the full viewscreen, so the jump does not show.
      first.classList.add('is-arriving');
      window.scrollTo({ top: pageTop(section), behavior: 'instant' });
      void first.offsetWidth; // starts the arrival from its first frame
      first.classList.remove('is-arriving');
    });
    isMoving = false;
    isSettling = true;
  }

  async function zoomToHero() {
    isMoving = true;
    const key = currentPanels()[0].dataset.workKey;
    await window.HeroScreen.zoomOut(key, () => window.scrollTo({ top: pageTop(hero), behavior: 'instant' }));
    isMoving = false;
    isSettling = true;
  }

  function moveTo(target) {
    const position = window.scrollY;
    if (canZoom() && Math.abs(position - pageTop(hero)) < 2 && Math.abs(target - pageTop(section)) < 2) {
      zoomToPanels();
      return;
    }
    if (canZoom() && Math.abs(position - pageTop(section)) < 2 && Math.abs(target - pageTop(hero)) < 2) {
      zoomToHero();
      return;
    }
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
    const target = targetFor(Math.sign(event.deltaY), wheelDistance(event));
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
    // A control that used the key already (the kiosk tabs, the archive menus) has cancelled it.
    if (event.defaultPrevented || !direction || Motion.isTyping() || document.querySelector('dialog[open], .dev-console.is-open') || window.ExperienceTimeline?.isGliding()) {
      return;
    }
    if (event.key === ' ' && event.target.closest && event.target.closest('button, a, [role="listbox"]')) {
      return;
    }
    if (isMoving) {
      event.preventDefault();
      return;
    }
    const target = targetFor(direction, keyDistance(event.key, direction));
    if (target === null || target === undefined) {
      return;
    }
    event.preventDefault();
    moveTo(target);
  });

  /* === The panels follow the hero === */

  // They start with the project on the viewscreen and wrap round. They only move while they are
  // out of sight below, so nothing jumps in view.
  function orderPanels(key) {
    const startIndex = panels.findIndex((panel) => panel.dataset.workKey === key);
    if (startIndex < 0 || section.getBoundingClientRect().top < window.innerHeight - 2) {
      return;
    }
    for (let offset = 0; offset < panels.length; offset += 1) {
      const panel = panels[(startIndex + offset) % panels.length];
      panel.querySelector('.work-panel__index b').textContent = String(offset + 1).padStart(2, '0');
      section.appendChild(panel);
    }
  }
  window.addEventListener('hero:change', (event) => orderPanels(event.detail));
  if (window.HeroScreen) {
    orderPanels(window.HeroScreen.activeKey());
  }

  // A click on the viewscreen: on to the work, the same way a scroll goes.
  window.addEventListener('hero:enter', () => {
    if (!isMoving) {
      moveTo(pageTop(section));
    }
  });

  updateStack();
})();
