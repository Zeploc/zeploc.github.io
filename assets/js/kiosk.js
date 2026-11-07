// The client kiosk: the list of client projects becomes tabs that switch the "screen".
// Without JavaScript every panel shows and each list item is an anchor link to its panel.
(() => {
  const kiosk = document.querySelector('[data-kiosk]');
  if (!kiosk) {
    return;
  }
  const tabs = [...kiosk.querySelectorAll('[data-kiosk-tab]')];
  const panels = [...kiosk.querySelectorAll('[data-kiosk-panel]')];
  kiosk.querySelector('.kiosk__tabs').setAttribute('role', 'tablist');

  tabs.forEach((tab) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.dataset.kioskTab);
  });
  panels.forEach((panel) => {
    panel.setAttribute('role', 'tabpanel');
    panel.tabIndex = -1;
  });

  function select(index, shouldFocus) {
    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === index;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[tabIndex].classList.toggle('is-active', isActive);
    });
    if (shouldFocus) {
      tabs[index].focus();
    }
  }

  kiosk.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-kiosk-tab]');
    if (tab) {
      event.preventDefault();
      select(tabs.indexOf(tab), false);
    }
    const swatch = event.target.closest('[data-paint]');
    if (swatch) {
      swatch.closest('.kiosk__view').style.setProperty('--paint', swatch.dataset.paint);
      swatch.parentElement.querySelectorAll('[data-paint]').forEach((other) => other.classList.toggle('is-active', other === swatch));
      Achievements.unlock('paint');
    }
  });

  kiosk.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) {
      return;
    }
    const moves = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (moves[event.key]) {
      event.preventDefault();
      select((current + moves[event.key] + tabs.length) % tabs.length, true);
    }
  });

  // A link to #client-<id> (for example from the archive) opens that tab.
  function selectFromHash() {
    const index = tabs.findIndex((tab) => `#${tab.dataset.kioskTab}` === window.location.hash);
    select(index >= 0 ? index : 0, false);
  }
  window.addEventListener('hashchange', selectFromHash);
  selectFromHash();
})();
