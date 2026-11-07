// The header: on the home page it slides in once the hero has scrolled away. It shows reading
// progress, and the menu marks the section in view.
(() => {
  const header = document.querySelector('[data-site-header]');
  if (!header) {
    return;
  }
  const hero = document.querySelector('[data-hero]');
  const progress = header.querySelector('[data-scroll-progress]');

  if (hero) {
    new IntersectionObserver((entries) => {
      header.classList.toggle('is-shown', !entries[0].isIntersecting);
    }, { rootMargin: '-70% 0px 0px 0px' }).observe(hero);
  }

  // Progress needs the exact scroll position, so this one effect listens to scroll (once per frame).
  let isQueued = false;
  function updateProgress() {
    isQueued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
  }
  window.addEventListener('scroll', () => {
    if (!isQueued) {
      isQueued = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  // Only the home page has the sections the menu points at.
  const links = [...header.querySelectorAll('.site-nav__link')].filter((link) => link.hash && link.getAttribute('href').startsWith('#'));
  const sections = links.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  if (!sections.length) {
    return;
  }
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      links.forEach((link) => {
        const isCurrent = link.hash === `#${entry.target.id}`;
        link.classList.toggle('is-active', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((section) => spy.observe(section));
})();
