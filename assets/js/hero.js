// The hero: my name and who I am beside a ship's viewscreen of featured projects. A star field fills
// the hero and streams out of the viewscreen, and each project arrives in it with a warp jump. Previous,
// next and project buttons pick one, and it moves on by itself every few seconds. Opening a project
// warps into it, and a click on the viewscreen moves on to the work panels.
// work-panels.js asks for the zoom (window.HeroScreen) when one scroll takes the viewscreen to the
// project's work panel. Reduced motion shows still stars and plain fades.
window.HeroScreen = (() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return null;
  }
  const screen = hero.querySelector('[data-viewscreen]');
  const frame = screen.querySelector('[data-viewscreen-frame]');
  const view = screen.querySelector('[data-viewscreen-view]');
  const images = [...view.querySelectorAll('[data-viewscreen-image]')];
  const slides = [...screen.querySelectorAll('[data-hero-slide]')];
  const beacons = [...screen.querySelectorAll('[data-hero-beacon]')];
  const marks = [...screen.querySelectorAll('[data-viewscreen-mark]')];
  const pauseButton = screen.querySelector('[data-hero-pause]');
  const flash = screen.querySelector('[data-viewscreen-flash]');
  const counter = screen.querySelector('[data-viewscreen-count]');
  const gauge = screen.querySelector('[data-viewscreen-gauge]');
  const warpReadout = screen.querySelector('[data-viewscreen-warp]');
  const receding = [...hero.querySelectorAll('[data-hero-recede]')];
  const shields = [...hero.querySelectorAll('[data-hero-shield]')];
  const slideDuration = 7000;
  const zoomDuration = 650;
  let activeIndex = 0;
  let jumpTimers = [];
  let autoplayTimer = null;
  let isUserPaused = false;
  let isHovering = false;
  let hasKeyboardFocus = false;
  let isVisible = true;
  let isZooming = false;
  let isEngaging = false;
  // True while the visitor is on the work panels after the zoom, so the carousel holds still.
  let isAway = false;

  /* === Star field === */

  // Stars stream out from a focus point (the middle of the viewscreen). At rest they drift slowly. A
  // warp ramps the speed up and stretches each star into a streak, and most of them drop out so the
  // streaks stay sparse. Behind the text, a soft-edged mask dims every star (streaks included) to half.
  const stars = (() => {
    const canvas = hero.querySelector('[data-hero-stars]');
    const context = canvas.getContext('2d');
    const colours = ['201, 216, 233', '201, 216, 233', '241, 245, 248', '106, 163, 212', '123, 224, 165'];
    const restSpeed = 0.3;
    const shieldStrength = 0.5;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let field = [];
    let shieldBoxes = [];
    let shieldFade = 1;
    let mask = null;
    let speed = restSpeed;
    let boostSpeed = 0;
    let boostUntil = 0;
    let isRunning = false;
    let focusX = 0.5;
    let focusY = 0.5;
    let aimX = 0.5;
    let aimY = 0.5;

    // rank decides which stars stay at warp speed: only the lowest ranks are drawn when moving fast.
    const spawn = (depth) => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: depth,
      rank: Math.random(),
      colour: colours[Math.floor(Math.random() * colours.length)],
    });

    function buildMask() {
      if (!shieldBoxes.length) {
        mask = null;
        return;
      }
      mask = mask || document.createElement('canvas');
      mask.width = width;
      mask.height = height;
      const maskContext = mask.getContext('2d');
      maskContext.fillStyle = '#000';
      maskContext.shadowColor = '#000';
      maskContext.shadowBlur = 60 * ratio;
      shieldBoxes.forEach((box) => {
        maskContext.fillRect(box.left * ratio, box.top * ratio, box.width * ratio, box.height * ratio);
      });
    }

    function resize() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.round(canvas.clientWidth * ratio);
      height = canvas.height = Math.round(canvas.clientHeight * ratio);
      const count = Math.round(Math.min(900, (canvas.clientWidth * canvas.clientHeight) / 1600));
      field = Array.from({ length: count }, () => spawn(0.05 + Math.random() * 0.95));
      buildMask();
      draw(0);
    }

    function draw(step) {
      context.clearRect(0, 0, width, height);
      focusX += (aimX - focusX) * 0.06;
      focusY += (aimY - focusY) * 0.06;
      const originX = focusX * width;
      const originY = focusY * height;
      const spread = Math.max(width, height) * 0.5;
      const tail = step * (2 + speed * 0.35);
      const rush = Motion.clamp((speed - restSpeed) / 12);
      const density = 1 - 0.82 * rush;
      context.lineCap = 'round';
      field.forEach((star) => {
        star.z -= step;
        const headX = originX + (star.x / star.z) * spread;
        const headY = originY + (star.y / star.z) * spread;
        if (star.z <= 0.03 || headX < -50 || headX > width + 50 || headY < -50 || headY > height + 50) {
          Object.assign(star, spawn(1));
          return;
        }
        if (star.rank > density) {
          return;
        }
        const tailZ = star.z + tail;
        const nearness = 1 - star.z;
        context.strokeStyle = `rgba(${star.colour}, ${Math.min(1, nearness * 1.3)})`;
        context.lineWidth = (nearness * 2.2 + 0.4) * ratio;
        context.beginPath();
        context.moveTo(originX + (star.x / tailZ) * spread, originY + (star.y / tailZ) * spread);
        context.lineTo(headX + 0.01, headY);
        context.stroke();
      });
      if (mask && shieldFade > 0) {
        context.globalCompositeOperation = 'destination-out';
        context.globalAlpha = shieldStrength * shieldFade;
        context.drawImage(mask, 0, 0);
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
      }
    }

    function frameLoop(now) {
      if (!isRunning) {
        return;
      }
      const target = now < boostUntil ? Math.max(restSpeed, boostSpeed) : restSpeed;
      speed += (target - speed) * (target > speed ? 0.12 : 0.045);
      draw(0.0012 * speed);
      updateGauge(speed - restSpeed);
      requestAnimationFrame(frameLoop);
    }

    window.addEventListener('resize', resize);
    resize();

    return {
      start() {
        if (!isRunning && !Motion.reduceMotion) {
          isRunning = true;
          requestAnimationFrame(frameLoop);
        }
      },
      stop() {
        isRunning = false;
      },
      warp(duration = 650, peak = 32) {
        boostUntil = performance.now() + duration;
        boostSpeed = peak;
      },
      aim(x, y) {
        aimX = x;
        aimY = y;
        if (Motion.reduceMotion) {
          focusX = x;
          focusY = y;
          draw(0);
        }
      },
      shield(boxes) {
        shieldBoxes = boxes;
        buildMask();
        draw(0);
      },
      // 1 dims the stars behind the text fully. The zoom fades it out as the text fades away.
      fadeShield(amount) {
        shieldFade = amount;
      },
    };
  })();

  // The warp gauge on the right rail follows the star speed.
  let shownWarp = '';
  function updateGauge(boost) {
    const level = Motion.clamp(boost / 34);
    gauge.style.transform = `scaleY(${0.05 + level * 0.95})`;
    const value = (1 + level * 8.9).toFixed(1);
    if (value !== shownWarp) {
      warpReadout.textContent = value;
      shownWarp = value;
    }
  }

  /* === Layout === */

  // The stars stream from the middle of the viewscreen, and dim behind the text. The frame's resting
  // box is kept for the zoom.
  let focus = { x: 0.5, y: 0.5 };
  let frameBox = null;
  function measure() {
    if (isZooming) {
      return;
    }
    frame.style.transform = '';
    const heroBox = hero.getBoundingClientRect();
    const viewBox = view.getBoundingClientRect();
    focus = {
      x: (viewBox.left + viewBox.width / 2 - heroBox.left) / heroBox.width,
      y: (viewBox.top + viewBox.height / 2 - heroBox.top) / heroBox.height,
    };
    stars.aim(focus.x, focus.y);
    frameBox = { left: viewBox.left - heroBox.left, top: viewBox.top - heroBox.top, width: viewBox.width, height: viewBox.height };
    stars.shield(shields.map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left - heroBox.left, top: box.top - heroBox.top, width: box.width, height: box.height };
    }));
  }
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  hero.addEventListener('pointermove', (event) => {
    if (isZooming || isEngaging || event.pointerType === 'touch') {
      return;
    }
    const box = hero.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    stars.aim(focus.x + (x - focus.x) * 0.08, focus.y + (y - focus.y) * 0.08);
  });
  hero.addEventListener('pointerleave', () => stars.aim(focus.x, focus.y));

  // Moves the frame toward filling the window: 0 is at rest, 1 fills it (with a little to spare, so
  // its edges are off screen). The hero is at the top of the window whenever this runs.
  function zoomFrame(amount) {
    if (!frameBox || amount <= 0) {
      frame.style.transform = '';
      return;
    }
    const fill = Math.max(hero.clientWidth / frameBox.width, window.innerHeight / frameBox.height) * 1.06;
    const moveX = hero.clientWidth / 2 - (frameBox.left + frameBox.width / 2);
    const moveY = window.innerHeight / 2 - (frameBox.top + frameBox.height / 2);
    frame.style.transform = `translate(${moveX * amount}px, ${moveY * amount}px) scale(${1 + (fill - 1) * amount})`;
  }

  /* === Carousel === */

  // The hidden pictures load after the page, so the first one has the network to itself.
  function loadImage(image) {
    if (!image.dataset.src) {
      return;
    }
    image.srcset = image.dataset.srcset;
    image.src = image.dataset.src;
    delete image.dataset.src;
    delete image.dataset.srcset;
  }
  if (document.readyState === 'complete') {
    images.forEach(loadImage);
  } else {
    window.addEventListener('load', () => images.forEach(loadImage));
  }

  function restartFill(beacon) {
    beacon.setAttribute('aria-current', 'false');
    void beacon.offsetWidth; // restarts the fill animation
    beacon.setAttribute('aria-current', 'true');
  }

  // isInstant swaps the picture with no jump (used when zooming back out to the hero).
  function showSlide(index, isInstant = false) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === activeIndex || isEngaging) {
      return;
    }
    jumpTimers.forEach((timer) => window.clearTimeout(timer));
    jumpTimers = [];
    const leaving = images[activeIndex];
    const arriving = images[nextIndex];
    loadImage(arriving);
    images.forEach((image) => {
      if (image !== leaving) {
        image.classList.remove('is-active', 'is-leaving');
      }
    });
    leaving.classList.remove('is-active');
    if (Motion.reduceMotion || isInstant) {
      arriving.classList.add('is-active');
    } else {
      leaving.classList.add('is-leaving');
      screen.classList.add('is-jumping');
      stars.warp();
      jumpTimers.push(window.setTimeout(() => {
        flash.classList.remove('is-on');
        void flash.offsetWidth; // restarts the flash
        flash.classList.add('is-on');
        arriving.classList.add('is-active');
        screen.classList.remove('is-jumping');
      }, 380));
      jumpTimers.push(window.setTimeout(() => leaving.classList.remove('is-leaving'), 900));
    }
    activeIndex = nextIndex;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === nextIndex));
    marks.forEach((mark, markIndex) => mark.classList.toggle('is-on', markIndex === nextIndex));
    beacons.forEach((beacon) => beacon.setAttribute('aria-current', 'false'));
    restartFill(beacons[nextIndex]);
    counter.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    window.dispatchEvent(new CustomEvent('hero:change', { detail: slides[nextIndex].dataset.heroSlide }));
    scheduleNext();
  }

  const isPaused = () => isUserPaused || isHovering || hasKeyboardFocus || !isVisible || document.hidden
    || isZooming || isEngaging || isAway || Boolean(window.TitleScreen && window.TitleScreen.isActive);

  function scheduleNext() {
    window.clearTimeout(autoplayTimer);
    screen.classList.toggle('is-paused', isPaused());
    if (Motion.reduceMotion || isPaused()) {
      return;
    }
    autoplayTimer = window.setTimeout(() => showSlide(activeIndex + 1), slideDuration);
  }

  // The fill bar restarts after a pause, so the timer does too.
  function resume() {
    restartFill(beacons[activeIndex]);
    scheduleNext();
  }

  screen.style.setProperty('--slide-duration', `${slideDuration}ms`);
  beacons.forEach((beacon, beaconIndex) => beacon.addEventListener('click', () => showSlide(beaconIndex)));
  screen.querySelectorAll('[data-hero-step]').forEach((button) => {
    button.addEventListener('click', () => showSlide(activeIndex + Number(button.dataset.heroStep)));
  });
  window.addEventListener('hero:step', (event) => showSlide(activeIndex + event.detail));
  pauseButton.addEventListener('click', () => {
    isUserPaused = !isUserPaused;
    pauseButton.setAttribute('aria-pressed', String(isUserPaused));
    pauseButton.setAttribute('aria-label', isUserPaused ? 'Play the slideshow' : 'Pause the slideshow');
    pauseButton.textContent = isUserPaused ? '▶︎' : '❚❚';
    if (isUserPaused) {
      scheduleNext();
    } else {
      resume();
    }
  });
  if (Motion.canHover) {
    view.addEventListener('pointerenter', () => {
      isHovering = true;
      scheduleNext();
    });
    view.addEventListener('pointerleave', () => {
      isHovering = false;
      resume();
    });
  }
  // Keyboard focus pauses the carousel, but a mouse click on a button does not.
  screen.addEventListener('focusin', (event) => {
    if (event.target.matches(':focus-visible')) {
      hasKeyboardFocus = true;
      scheduleNext();
    }
  });
  screen.addEventListener('focusout', (event) => {
    if (!screen.contains(event.relatedTarget)) {
      hasKeyboardFocus = false;
      resume();
    }
  });
  screen.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      showSlide(activeIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      showSlide(activeIndex - 1);
    }
  });

  // A click on the viewscreen does what a scroll does: on to the work panels (work-panels.js).
  view.addEventListener('click', () => window.dispatchEvent(new Event('hero:enter')));

  /* === Engage: opening a project warps into it, then follows the link === */

  screen.querySelectorAll('[data-hero-open]').forEach((link) => link.addEventListener('click', (event) => {
    if (Motion.reduceMotion || isEngaging || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    isEngaging = true;
    hero.classList.add('is-engaging');
    scheduleNext();
    stars.warp(2000, 45);
    zoomFrame(1);
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 820);
  }));
  // Coming back with the Back button shows the hero as it was.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      return;
    }
    isEngaging = false;
    hero.classList.remove('is-engaging');
    zoomFrame(0);
    scheduleNext();
  });

  /* === The zoom to the work panels (driven by work-panels.js) === */

  function setRecede(amount) {
    stars.fadeShield(1 - amount);
    receding.forEach((element) => {
      element.style.opacity = amount ? String(1 - amount) : '';
      element.style.transform = amount ? `translateY(${amount * -24}px)` : '';
    });
  }

  // 0 is the hero at rest, 1 is the project filling the window. The zoom starts gently and rushes in
  // at the end (zooming out, it starts fast and settles). The panel's shade fades in on the way.
  function zoomStep(amount) {
    frame.style.setProperty('--takeover', amount.toFixed(3));
    zoomFrame(amount * amount * amount);
    setRecede(Motion.clamp(amount * 3));
  }

  // A timer finishes the move too, in case the browser stops sending frames (a background tab).
  function play(from, to) {
    return new Promise((resolve) => {
      const start = performance.now();
      let isFinished = false;
      const finish = () => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        zoomStep(to);
        resolve();
      };
      const fallback = window.setTimeout(finish, zoomDuration + 200);
      const tick = (now) => {
        if (isFinished) {
          return;
        }
        const progress = Motion.clamp((now - start) / zoomDuration);
        zoomStep(from + (to - from) * progress);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          window.clearTimeout(fallback);
          finish();
        }
      };
      tick(start);
    });
  }

  // Zooms until the project fills the window, then land() moves the page to its panel and the hero
  // resets out of sight.
  async function zoomIn(land) {
    isZooming = true;
    scheduleNext();
    stars.warp(zoomDuration + 200, 28);
    Achievements.unlock('warp');
    await play(0, 1);
    land();
    zoomStep(0);
    isZooming = false;
    isAway = true;
    scheduleNext();
  }

  // Shows the project whose panel you left, fills the window with it, jump() moves the page back to
  // the hero, then it zooms out.
  async function zoomOut(key, jump) {
    isZooming = true;
    const keyIndex = slides.findIndex((slide) => slide.dataset.heroSlide === key);
    if (keyIndex >= 0) {
      showSlide(keyIndex, true);
    }
    scheduleNext();
    zoomStep(1);
    jump();
    await play(1, 0);
    isZooming = false;
    isAway = false;
    resume();
  }

  /* === Start === */

  // A stardate for the viewscreen: the year and the day of the year.
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  screen.querySelector('[data-viewscreen-stardate]').textContent = `Stardate ${today.getFullYear()}.${String(dayOfYear).padStart(3, '0')}`;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stars.stop();
    } else if (isVisible) {
      stars.start();
    }
    scheduleNext();
  });
  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    // Back on the hero by any route (Home key, the scroll bar): the carousel carries on.
    if (entry.intersectionRatio > 0.5 && !isZooming) {
      isAway = false;
    }
    if (isVisible) {
      stars.start();
    } else {
      stars.stop();
    }
    scheduleNext();
  }, { threshold: [0, 0.5] }).observe(hero);

  measure();
  window.dispatchEvent(new CustomEvent('hero:change', { detail: slides[0].dataset.heroSlide }));
  // While the title screen shows, the carousel waits. As its doors open, the stars jump.
  if (window.TitleScreen && window.TitleScreen.isActive) {
    window.addEventListener('titlescreen:done', () => {
      stars.warp(500, 28);
      resume();
    }, { once: true });
  }

  return {
    canZoom: () => !Motion.reduceMotion,
    activeKey: () => slides[activeIndex].dataset.heroSlide,
    zoomIn,
    zoomOut,
  };
})();
