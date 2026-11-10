// Achievements: small, hidden goals across the site. Other scripts call Achievements.unlock('id').
// Unlocked goals are remembered in local storage, and a trophy button in the header lists them.
window.Achievements = (() => {
  const storageKey = 'alex-coultas-achievements';
  const goals = [
    { id: 'start', name: 'Press Start', hint: 'Got past the title screen', medal: '🎮' },
    { id: 'warp', name: 'Engage', hint: 'Zoomed into a project from the viewscreen', medal: '🚀' },
    { id: 'console', name: 'Developer Console', hint: 'Opened the console', medal: '⌨️' },
    { id: 'project', name: 'Open Sesame', hint: 'Opened a project page', medal: '📂' },
    { id: 'all-work', name: 'Completionist', hint: 'Opened all four main projects', medal: '💯' },
    { id: 'paint', name: 'Custom Paint Job', hint: 'Repainted the car in the client kiosk', medal: '🎨' },
    { id: 'talk', name: 'Front Row Seat', hint: 'Played the NZGDC talk', medal: '🎤' },
    { id: 'query', name: 'Query Builder', hint: 'Filled every blank in the archive sentence', medal: '🧩' },
    { id: 'slomo', name: 'Time Dilation', hint: 'Ran slomo in the console', medal: '⏳' },
    { id: 'collision', name: 'Collision Detected', hint: 'Ran show collision', medal: '🟩' },
    { id: 'god', name: 'God Mode', hint: 'Entered the Konami code', medal: '⭐' },
    { id: 'end', name: 'The Long Way Round', hint: 'Scrolled to the very end', medal: '🏁' },
  ];
  const mainProjects = ['kyoryu', 'wanderer', 'mythos-party', 'httyd'];
  const unlocked = new Set(Motion.storage.read(storageKey, []));

  const toasts = document.createElement('div');
  toasts.className = 'toasts';
  toasts.setAttribute('aria-live', 'polite');
  document.body.appendChild(toasts);

  const dialog = document.createElement('dialog');
  dialog.className = 'achievements';
  dialog.setAttribute('aria-labelledby', 'achievements-title');
  dialog.innerHTML = `
    <h2 id="achievements-title">Achievements</h2>
    <div class="achievements__meter"><span data-achievements-meter></span></div>
    <ul class="achievements__list" data-achievements-list></ul>
    <button class="button achievements__close" type="button" data-achievements-close>Close</button>`;
  document.body.appendChild(dialog);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'header-button';
  button.setAttribute('aria-label', 'Achievements');
  const actions = document.querySelector('[data-header-actions]');
  if (actions) {
    actions.appendChild(button);
  }

  function render() {
    button.textContent = `🏆 ${unlocked.size}/${goals.length}`;
    dialog.querySelector('[data-achievements-meter]').style.transform = `scaleX(${unlocked.size / goals.length})`;
    dialog.querySelector('[data-achievements-list]').innerHTML = goals
      .map((goal) => {
        const isUnlocked = unlocked.has(goal.id);
        return `<li class="achievements__item${isUnlocked ? ' is-unlocked' : ''}">
          <span class="achievements__medal" aria-hidden="true">${isUnlocked ? goal.medal : '?'}</span>
          <span><span class="achievements__name">${goal.name}</span>${isUnlocked ? goal.hint : 'Hidden until unlocked'}</span></li>`;
      })
      .join('');
  }

  function unlock(id) {
    const goal = goals.find((candidate) => candidate.id === id);
    if (!goal || unlocked.has(id)) {
      return;
    }
    unlocked.add(id);
    Motion.storage.write(storageKey, [...unlocked]);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast__medal" aria-hidden="true">${goal.medal}</span>
      <span><span class="toast__label">Achievement unlocked</span><span class="toast__title">${goal.name}</span></span>`;
    toasts.appendChild(toast);
    window.setTimeout(() => toast.remove(), 4600);
    render();
  }

  function open() {
    render();
    dialog.showModal();
  }

  button.addEventListener('click', open);
  dialog.querySelector('[data-achievements-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  // A project page counts as opened as soon as it loads.
  const projectMatch = window.location.pathname.match(/projects\/([\w-]+)\.html$/);
  if (projectMatch) {
    unlock('project');
    const opened = new Set(Motion.storage.read(`${storageKey}-projects`, []));
    opened.add(projectMatch[1]);
    Motion.storage.write(`${storageKey}-projects`, [...opened]);
    if (mainProjects.every((slug) => opened.has(slug))) {
      unlock('all-work');
    }
  }

  // The last screen of any page.
  const footer = document.querySelector('.site-footer');
  if (footer) {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) {
        unlock('end');
        observer.disconnect();
      }
    }, { threshold: 0.6 }).observe(footer);
  }

  render();
  return { unlock, open };
})();
