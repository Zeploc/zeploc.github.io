// Gallery lightbox. Each gallery link points at the full-size image, so without JavaScript
// the link still opens the image. With JavaScript, it opens in a <dialog> with previous and next.
(() => {
  const links = [...document.querySelectorAll('[data-lightbox]')];
  if (!links.length) {
    return;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Image viewer');
  dialog.innerHTML = `
    <img class="lightbox__image" alt="">
    <div class="lightbox__bar">
      <button class="lightbox__button" type="button" data-step="-1" aria-label="Previous image">←</button>
      <p class="lightbox__caption" aria-live="polite"></p>
      <button class="lightbox__button" type="button" data-step="1" aria-label="Next image">→</button>
    </div>
    <button class="lightbox__button lightbox__close" type="button" aria-label="Close">✕</button>`;
  document.body.appendChild(dialog);

  const image = dialog.querySelector('.lightbox__image');
  const caption = dialog.querySelector('.lightbox__caption');
  let currentIndex = 0;

  // Only the links in the same gallery as the opened one take part in previous and next.
  let currentGroup = links;

  function show(index) {
    currentIndex = (index + currentGroup.length) % currentGroup.length;
    const link = currentGroup[currentIndex];
    const thumbnail = link.querySelector('img');
    image.src = link.href;
    image.alt = thumbnail ? thumbnail.alt : '';
    caption.textContent = `${link.dataset.lightbox || ''} · ${currentIndex + 1} / ${currentGroup.length}`;
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const gallery = link.closest('[data-gallery]');
      currentGroup = gallery ? links.filter((other) => gallery.contains(other)) : links;
      show(currentGroup.indexOf(link));
      dialog.showModal();
    });
  });

  dialog.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => show(currentIndex + Number(button.dataset.step)));
  });
  dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());

  // A click on the dark area around the image closes the viewer.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      show(currentIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      show(currentIndex - 1);
    }
  });

  // Swipe left or right on touch screens.
  let touchStartX = null;
  dialog.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener('touchend', (event) => {
    if (touchStartX === null) {
      return;
    }
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) {
      show(currentIndex + (distance < 0 ? 1 : -1));
    }
    touchStartX = null;
  });
})();
