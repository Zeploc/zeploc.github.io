// The stats banner: when it scrolls into view, each slot slides open in turn, then its number
// rolls up digit by digit like an odometer. The HTML already holds the final numbers.
(() => {
  const banner = document.querySelector('[data-stats]');
  if (!banner) {
    return;
  }
  const slotDelay = 120;
  const openDuration = 800;

  function buildOdometer(value) {
    const finalText = value.textContent.trim();
    const digits = value.dataset.statValue;
    const suffix = value.dataset.statSuffix || '';
    value.setAttribute('aria-label', finalText);
    value.innerHTML = '';
    const columns = [...digits].map((digit) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'stat-digit';
      wrapper.setAttribute('aria-hidden', 'true');
      const column = document.createElement('span');
      column.className = 'stat-digit__column';
      // Two runs of 0–9, so each digit spins through a full turn before it stops.
      column.innerHTML = Array.from({ length: 20 }, (unused, index) => `<span>${index % 10}</span>`).join('');
      wrapper.appendChild(column);
      value.appendChild(wrapper);
      return { column, digit: Number(digit) };
    });
    if (suffix) {
      const suffixElement = document.createElement('span');
      suffixElement.setAttribute('aria-hidden', 'true');
      suffixElement.textContent = suffix;
      value.appendChild(suffixElement);
    }
    return columns;
  }

  function open() {
    banner.classList.add('is-open');
    if (Motion.reduceMotion) {
      return;
    }
    banner.querySelectorAll('[data-stat]').forEach((slot, slotIndex) => {
      const columns = buildOdometer(slot.querySelector('[data-stat-value]'));
      window.setTimeout(() => {
        columns.forEach(({ column, digit }, digitIndex) => {
          column.style.transitionDelay = `${digitIndex * 0.12}s`;
          column.style.transform = `translateY(-${10 + digit}em)`;
        });
      }, slotIndex * slotDelay + openDuration * 0.6);
    });
  }

  if (Motion.reduceMotion || !('IntersectionObserver' in window)) {
    banner.classList.add('is-open');
    return;
  }

  new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      open();
      observer.disconnect();
    }
  }, { threshold: 0.5 }).observe(banner);
})();
