// The hero: a carousel of featured projects, each drawn as a grid of particles.
// Changing slide sorts particles and grid cells by brightness and sends each particle to its new
// cell, so the picture rebuilds itself. The pointer pushes particles apart and opens a lens onto
// the full image underneath; a click scatters them. Reduced motion shows the photos instead.
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }
  const slides = [...hero.querySelectorAll('[data-hero-slide]')];
  const controls = hero.querySelector('[data-hero-controls]');
  const backdropImage = hero.querySelector('.hero__image');
  const slideDuration = 7000;
  let activeIndex = 0;
  let autoplayTimer = null;
  let isVisible = true;

  /* === Carousel === */

  controls.innerHTML = `
    <div class="hero-pips">${slides.map((slide, index) => `<button class="hero-pip" type="button" aria-label="Show slide ${index + 1}"><span></span></button>`).join('')}</div>
    <div class="button-row"><button class="hero-arrow" type="button" data-hero-step="-1" aria-label="Previous project">←</button><button class="hero-arrow" type="button" data-hero-step="1" aria-label="Next project">→</button></div>`;
  const pips = [...controls.querySelectorAll('.hero-pip')];

  function scheduleNext() {
    window.clearTimeout(autoplayTimer);
    if (Motion.reduceMotion) {
      return;
    }
    autoplayTimer = window.setTimeout(() => {
      if (isVisible && !hero.classList.contains('is-paused')) {
        showSlide(activeIndex + 1);
      } else {
        scheduleNext();
      }
    }, slideDuration);
  }

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    const slide = slides[activeIndex];
    slides.forEach((other) => other.classList.toggle('is-active', other === slide));
    pips.forEach((pip, pipIndex) => {
      pip.classList.remove('is-active');
      void pip.offsetWidth; // restarts the fill animation
      pip.classList.toggle('is-active', pipIndex === activeIndex);
      pip.setAttribute('aria-current', pipIndex === activeIndex ? 'true' : 'false');
    });
    if (!particles) {
      backdropImage.removeAttribute('srcset');
      backdropImage.src = slide.dataset.heroImage;
    } else {
      particles.morph(slide.dataset.heroSlide);
      lens.style.backgroundImage = `url('${slide.dataset.heroImage}')`;
    }
    scheduleNext();
  }

  controls.addEventListener('click', (event) => {
    const pip = event.target.closest('.hero-pip');
    if (pip) {
      showSlide(pips.indexOf(pip));
    }
    const step = event.target.closest('[data-hero-step]');
    if (step) {
      showSlide(activeIndex + Number(step.dataset.heroStep));
    }
  });
  window.addEventListener('hero:step', (event) => showSlide(activeIndex + event.detail));

  /* === Particles === */

  const sampleWidth = 192;
  const sampleHeight = 108;
  const samples = {};
  let particles = null;
  let lens = null;

  function loadSample(key) {
    return new Promise((resolve) => {
      const source = window.HeroSamples && window.HeroSamples[key];
      if (!source) {
        resolve();
        return;
      }
      const image = new Image();
      image.onload = () => {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = sampleWidth;
        sampleCanvas.height = sampleHeight;
        const sampleContext = sampleCanvas.getContext('2d');
        sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
        samples[key] = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
        resolve();
      };
      image.onerror = resolve;
      image.src = source;
    });
  }

  function createParticles() {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    hero.querySelector('.hero__shade').before(canvas);

    let width = 0;
    let height = 0;
    let cellSize = 8;
    let columns = 0;
    let rows = 0;
    let count = 0;
    let frameImage = null;
    let pixels = null;
    let isRunning = false;
    let pointerX = -9999;
    let pointerY = -9999;
    // Position, velocity, target position, colour, target colour, size, target size, start delay, scroll spread.
    let positionX, positionY, velocityX, velocityY, targetX, targetY;
    let red, green, blue, targetRed, targetGreen, targetBlue, size, targetSize, startTime, spread;

    function build() {
      width = canvas.width = hero.clientWidth;
      height = canvas.height = hero.clientHeight;
      cellSize = width < 700 ? 6 : width > 1900 ? 10 : 8;
      columns = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
      count = columns * rows;
      frameImage = context.createImageData(width, height);
      pixels = new Uint32Array(frameImage.data.buffer);
      [positionX, positionY, velocityX, velocityY, targetX, targetY, red, green, blue,
        targetRed, targetGreen, targetBlue, size, targetSize, startTime, spread] = Array.from({ length: 16 }, () => new Float32Array(count));
      for (let index = 0; index < count; index += 1) {
        positionX[index] = targetX[index] = Math.random() * width;
        positionY[index] = targetY[index] = Math.random() * height;
        red[index] = targetRed[index] = 40;
        green[index] = targetGreen[index] = 60;
        blue[index] = targetBlue[index] = 80;
        size[index] = targetSize[index] = 1;
        spread[index] = 0.3 + Math.random() * 0.7;
      }
    }

    function morph(key) {
      const data = samples[key];
      if (!data || !count) {
        return;
      }
      // The sample covers the canvas the way background-size: cover would.
      const scale = Math.max(width / sampleWidth, height / sampleHeight);
      const offsetX = (width - sampleWidth * scale) / 2;
      const offsetY = (height - sampleHeight * scale) / 2;
      const cellRed = new Float32Array(count);
      const cellGreen = new Float32Array(count);
      const cellBlue = new Float32Array(count);
      const cellLight = new Float32Array(count);
      const particleLight = new Float32Array(count);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const cell = row * columns + column;
          const sampleX = Motion.clamp(Math.floor((column * cellSize + cellSize / 2 - offsetX) / scale), 0, sampleWidth - 1);
          const sampleY = Motion.clamp(Math.floor((row * cellSize + cellSize / 2 - offsetY) / scale), 0, sampleHeight - 1);
          const offset = (sampleY * sampleWidth + sampleX) * 4;
          cellRed[cell] = data[offset];
          cellGreen[cell] = data[offset + 1];
          cellBlue[cell] = data[offset + 2];
          cellLight[cell] = (0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]) / 255;
        }
      }
      for (let index = 0; index < count; index += 1) {
        particleLight[index] = 0.2126 * targetRed[index] + 0.7152 * targetGreen[index] + 0.0722 * targetBlue[index];
      }
      const cellOrder = new Uint32Array(count).map((unused, index) => index).sort((a, b) => cellLight[a] - cellLight[b]);
      const particleOrder = new Uint32Array(count).map((unused, index) => index).sort((a, b) => particleLight[a] - particleLight[b]);
      const now = performance.now();
      for (let rank = 0; rank < count; rank += 1) {
        const particle = particleOrder[rank];
        const cell = cellOrder[rank];
        targetX[particle] = (cell % columns) * cellSize + cellSize / 2;
        targetY[particle] = Math.floor(cell / columns) * cellSize + cellSize / 2;
        targetRed[particle] = Math.min(255, cellRed[cell] * 1.12 + 6);
        targetGreen[particle] = Math.min(255, cellGreen[cell] * 1.12 + 6);
        targetBlue[particle] = Math.min(255, cellBlue[cell] * 1.12 + 6);
        // Brighter cells get bigger dots, like a halftone print.
        targetSize[particle] = Math.max(1.4, cellSize * (0.3 + 0.7 * cellLight[cell]));
        startTime[particle] = now + Math.random() * 600;
      }
    }

    function step(now) {
      const scrollSpread = Motion.clamp(window.scrollY / height);
      const radius = 115;
      const radiusSquared = radius * radius;
      const spring = 0.045;
      const damping = 0.84;
      pixels.fill(0);
      // A few random nudges keep the picture shimmering.
      for (let nudge = 0; nudge < 30; nudge += 1) {
        const index = Math.floor(Math.random() * count);
        velocityX[index] += Math.random() - 0.5;
        velocityY[index] += Math.random() - 0.5;
      }
      for (let index = 0; index < count; index += 1) {
        if (now > startTime[index]) {
          velocityX[index] += (targetX[index] - positionX[index]) * spring;
          velocityY[index] += (targetY[index] - positionY[index]) * spring;
        }
        const distanceX = positionX[index] - pointerX;
        const distanceY = positionY[index] - pointerY;
        if (distanceX > -radius && distanceX < radius && distanceY > -radius && distanceY < radius) {
          const distanceSquared = distanceX * distanceX + distanceY * distanceY;
          if (distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared) + 0.01;
            const push = (1 - distance / radius) * 5.5;
            velocityX[index] += (distanceX / distance) * push;
            velocityY[index] += (distanceY / distance) * push;
          }
        }
        velocityX[index] *= damping;
        velocityY[index] *= damping;
        positionX[index] += velocityX[index];
        positionY[index] += velocityY[index];
        red[index] += (targetRed[index] - red[index]) * 0.05;
        green[index] += (targetGreen[index] - green[index]) * 0.05;
        blue[index] += (targetBlue[index] - blue[index]) * 0.05;
        size[index] += (targetSize[index] - size[index]) * 0.08;

        const dotSize = Math.max(1, Math.floor(size[index]));
        const left = Math.floor(positionX[index] - dotSize / 2);
        const top = Math.floor(positionY[index] - dotSize / 2 - scrollSpread * spread[index] * height * 0.9);
        if (left < 0 || top < 0 || left + dotSize > width || top + dotSize > height) {
          continue;
        }
        // Pixels are little-endian ABGR.
        const colour = 0xff000000 | (Math.floor(blue[index]) << 16) | (Math.floor(green[index]) << 8) | Math.floor(red[index]);
        for (let line = 0, offset = top * width + left; line < dotSize; line += 1, offset += width) {
          pixels.fill(colour, offset, offset + dotSize);
        }
      }
      context.putImageData(frameImage, 0, 0);
    }

    function frame() {
      if (!isRunning) {
        return;
      }
      step(performance.now());
      requestAnimationFrame(frame);
    }

    function setRunning(shouldRun) {
      if (shouldRun && !isRunning) {
        isRunning = true;
        requestAnimationFrame(frame);
      } else if (!shouldRun) {
        isRunning = false;
      }
    }

    function scatter(centreX = width / 2, centreY = height / 2, power = 40) {
      for (let index = 0; index < count; index += 1) {
        const distanceX = positionX[index] - centreX;
        const distanceY = positionY[index] - centreY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) + 0.01;
        if (distance < 360) {
          const push = (1 - distance / 360) * power;
          velocityX[index] += (distanceX / distance) * push;
          velocityY[index] += (distanceY / distance) * push;
        }
      }
    }

    function setPointer(x, y) {
      pointerX = x;
      pointerY = y;
    }

    build();
    return { build, morph, setRunning, scatter, setPointer };
  }

  function startParticles() {
    lens = document.createElement('div');
    lens.className = 'hero__lens';
    lens.setAttribute('aria-hidden', 'true');
    hero.querySelector('.hero__shade').before(lens);
    particles = createParticles();
    hero.classList.add('has-particles');

    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      particles.setPointer(x, y);
      hero.style.setProperty('--lens-x', `${x}px`);
      hero.style.setProperty('--lens-y', `${y}px`);
      hero.classList.add('is-looking', 'is-paused');
    });
    hero.addEventListener('pointerleave', () => {
      particles.setPointer(-9999, -9999);
      hero.classList.remove('is-looking', 'is-paused');
    });
    hero.addEventListener('pointerdown', (event) => {
      if (event.target.closest('a, button')) {
        return;
      }
      const bounds = hero.getBoundingClientRect();
      particles.scatter(event.clientX - bounds.left, event.clientY - bounds.top);
      Achievements.unlock('shock');
    });
    window.addEventListener('hero:scatter', () => {
      particles.scatter(undefined, undefined, 70);
      Achievements.unlock('shock');
    });

    // Rebuild only when the width changes: phones change the height as the address bar moves.
    let lastWidth = window.innerWidth;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) {
        return;
      }
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        particles.build();
        particles.morph(slides[activeIndex].dataset.heroSlide);
      }, 200);
    });

    new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
      particles.setRunning(isVisible);
    }).observe(hero);
  }

  if (Motion.reduceMotion || !window.HeroSamples) {
    showSlide(0);
    return;
  }

  Promise.all(slides.map((slide) => loadSample(slide.dataset.heroSlide))).then(() => {
    startParticles();
    // While the title screen shows, the particles wait, then assemble as its doors open.
    if (window.TitleScreen && window.TitleScreen.isActive) {
      window.addEventListener('titlescreen:done', () => showSlide(0), { once: true });
      showSlideInfoOnly();
    } else {
      showSlide(0);
    }
  });

  function showSlideInfoOnly() {
    pips[0].classList.add('is-active');
  }
})();
