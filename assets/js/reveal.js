// Blocks marked .reveal fade and rise into place the first time they scroll into view.
(() => {
  const blocks = document.querySelectorAll('.reveal');
  if (!blocks.length) {
    return;
  }
  if (Motion.reduceMotion || !('IntersectionObserver' in window)) {
    blocks.forEach((block) => block.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  blocks.forEach((block) => observer.observe(block));
})();
