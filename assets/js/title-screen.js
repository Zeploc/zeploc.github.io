// A game-style title screen on the first visit of each session: a warp-speed starfield, a loading
// bar and "press any key". Any key, a click or the skip button opens the doors onto the site.
// It is skipped when the visitor prefers reduced motion, and on later pages of the same visit.
window.TitleScreen = (() => {
  const sessionKey = 'alex-coultas-title-seen';
  let hasSeen = false;
  try {
    hasSeen = window.sessionStorage.getItem(sessionKey) === '1';
  } catch {
    hasSeen = true;
  }
  // ?skip opens the page without it (used by tools/Capture-Devices).
  const skipRequested = new URLSearchParams(window.location.search).has('skip');
  if (Motion.reduceMotion || hasSeen || skipRequested || !document.querySelector('[data-hero]')) {
    return { isActive: false };
  }

  const screen = document.createElement('div');
  screen.className = 'title-screen';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-label', 'Title screen');
  screen.innerHTML = `
    <span class="title-screen__door title-screen__door--top"></span>
    <span class="title-screen__door title-screen__door--bottom"></span>
    <canvas class="title-screen__canvas" aria-hidden="true"></canvas>
    <div class="title-screen__inner">
      <p class="title-screen__logo">ALEX<span>COULTAS</span></p>
      <p class="title-screen__sub">GAME ENGINEER · UNREAL ENGINE</p>
      <div class="title-screen__load"><span data-title-status>Compiling shaders… 0 / 2026</span><div class="title-screen__bar"><span data-title-bar></span></div></div>
      <p class="title-screen__press">PRESS ANY KEY</p>
    </div>
    <button class="title-screen__skip" type="button">Skip intro ↵</button>`;
  document.body.appendChild(screen);
  document.body.style.overflow = 'hidden';

  const canvas = screen.querySelector('canvas');
  const context = canvas.getContext('2d');
  const stars = Array.from({ length: 500 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
  let speed = 0.6;
  let isRunning = true;
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth * window.devicePixelRatio;
    height = canvas.height = window.innerHeight * window.devicePixelRatio;
  }

  function drawFrame() {
    if (!isRunning) {
      return;
    }
    context.fillStyle = 'rgba(11, 13, 15, 0.35)';
    context.fillRect(0, 0, width, height);
    stars.forEach((star) => {
      const previousZ = star.z;
      star.z -= 0.004 * speed;
      if (star.z <= 0.01) {
        Object.assign(star, { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 1 });
        return;
      }
      const toScreenX = (z) => width / 2 + (star.x / z) * width * 0.5;
      const toScreenY = (z) => height / 2 + (star.y / z) * height * 0.5;
      context.strokeStyle = `rgba(${star.x > 0 ? '120, 170, 220' : '90, 220, 160'}, ${1 - star.z})`;
      context.lineWidth = (1 - star.z) * 3 * window.devicePixelRatio;
      context.beginPath();
      context.moveTo(toScreenX(previousZ), toScreenY(previousZ));
      context.lineTo(toScreenX(star.z), toScreenY(star.z));
      context.stroke();
    });
    requestAnimationFrame(drawFrame);
  }

  const total = 2026;
  let loaded = 0;
  const loader = window.setInterval(() => {
    loaded = Math.min(total, loaded + Math.ceil(Math.random() * 140));
    screen.querySelector('[data-title-bar]').style.transform = `scaleX(${loaded / total})`;
    screen.querySelector('[data-title-status]').textContent = loaded < total ? `Compiling shaders… ${loaded} / ${total}` : 'Ready';
    if (loaded >= total) {
      window.clearInterval(loader);
      screen.classList.add('is-ready');
    }
  }, 45);

  const state = { isActive: true };

  function leave() {
    if (screen.classList.contains('is-leaving')) {
      return;
    }
    window.clearInterval(loader);
    speed = 14;
    window.removeEventListener('keydown', onKey);
    try {
      window.sessionStorage.setItem(sessionKey, '1');
    } catch {
      // Storage is blocked, so the screen shows again next time.
    }
    window.setTimeout(() => {
      screen.classList.add('is-leaving');
      document.body.style.overflow = '';
      state.isActive = false;
      Achievements.unlock('start');
      window.dispatchEvent(new Event('titlescreen:done'));
    }, 380);
    window.setTimeout(() => {
      isRunning = false;
      screen.remove();
    }, 1500);
  }

  function onKey(event) {
    if (event.key !== '`' && event.key !== '~') {
      leave();
    }
  }

  resize();
  window.addEventListener('resize', resize);
  drawFrame();
  screen.addEventListener('click', leave);
  window.addEventListener('keydown', onKey);
  screen.querySelector('.title-screen__skip').focus();
  return state;
})();
