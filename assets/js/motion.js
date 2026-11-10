// Shared helpers. Load this before the other scripts.
// Plain scripts, not modules: modules do not load from file://, and the site must open from disk.
window.Motion = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // The path from this page back to the site root: '' on the home page, '../' on a project page.
  const brandLink = document.querySelector('.site-header__brand');
  const rootPath = brandLink ? brandLink.getAttribute('href').replace('index.html', '') : '';

  function clamp(value, low = 0, high = 1) {
    return Math.min(high, Math.max(low, value));
  }

  // Storage can be blocked (private windows, strict settings). The site works without it.
  const storage = {
    read(key, fallback) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage is blocked, so there is nothing to remember.
      }
    },
  };

  function isTyping() {
    const active = document.activeElement;
    return Boolean(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable));
  }

  return { reduceMotion, canHover, rootPath, clamp, storage, isTyping };
})();
