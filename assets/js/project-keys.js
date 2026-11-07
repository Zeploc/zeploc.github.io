// On a project page, the left and right arrow keys open the previous and next project.
(() => {
  const previous = document.querySelector('.project-pager__link:not(.project-pager__link--next)');
  const next = document.querySelector('.project-pager__link--next');
  if (!previous || !next) {
    return;
  }
  window.addEventListener('keydown', (event) => {
    if (Motion.isTyping() || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open], .dev-console.is-open')) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      window.location.href = previous.href;
    } else if (event.key === 'ArrowRight') {
      window.location.href = next.href;
    }
  });
})();
