// On laptops and up, the experience section pins for one screen: scrolling down moves the jobs
// sideways, with the toolkit fixed underneath. On smaller screens the jobs simply stack.
(() => {
  const section = document.querySelector('[data-experience]');
  if (!section) {
    return;
  }
  const track = section.querySelector('[data-experience-track]');
  const rail = section.querySelector('[data-experience-rail]');
  const wideScreen = window.matchMedia('(min-width: 64rem)');
  let isQueued = false;

  function paddingTop() {
    return Number.parseFloat(window.getComputedStyle(section).paddingTop) || 0;
  }

  function overflow() {
    return Math.max(0, track.scrollWidth - window.innerWidth);
  }

  function size() {
    if (!wideScreen.matches) {
      section.style.height = '';
      track.style.transform = '';
      return;
    }
    section.style.height = `${paddingTop() + overflow() + window.innerHeight}px`;
    update();
  }

  function update() {
    isQueued = false;
    if (!wideScreen.matches) {
      return;
    }
    const start = section.offsetTop + paddingTop();
    const distance = section.offsetHeight - paddingTop() - window.innerHeight;
    const progress = distance > 0 ? Motion.clamp((window.scrollY - start) / distance) : 0;
    track.style.transform = `translateX(${-progress * overflow()}px)`;
    rail.style.transform = `scaleX(${progress})`;
  }

  // The sideways move follows the exact scroll position, so it reads it once per frame.
  window.addEventListener('scroll', () => {
    if (!isQueued) {
      isQueued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', size);
  wideScreen.addEventListener('change', size);
  size();
})();
