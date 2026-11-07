// The hero: a carousel of featured projects. Each photo shows as normal, and around the pointer it
// breaks into a grid of particles, like a pixelating lens. Each particle carries its own piece of the
// photo, with a blurred copy of the photo behind them showing through the gaps. Changing slide swaps
// the photo for the particles full screen, without a visible seam, while they sort themselves by
// brightness into the next picture over the blurred next photo; then they fade out over the new photo.
// A click scatters the particles. Reduced motion shows the photos only.
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
  // A blurred copy of the photo behind the particles, seen through the gaps between them.
  let blurImage = null;
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
    if (particles) {
      particles.morph(slide.dataset.heroSlide);
      showParticles(1800);
    }
    backdropImage.removeAttribute('srcset');
    backdropImage.src = slide.dataset.heroImage;
    if (blurImage) {
      blurImage.src = slide.dataset.heroImage;
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
  let particleTimer = null;
  let settleTimer = null;
  // Changing slide: each particle flies to its new place on an ease-out curve, fast off the mark
  // and gentle into place, after a short random delay.
  const morphDelay = 400;
  const morphDuration = 1300;
  const morphEase = (t) => Math.sqrt(1 - (t - 1) * (t - 1)); // ease-out circ

  // Swaps the photo for the particle picture full screen while it rebuilds or scatters. The swap is
  // seamless because the particles fill their whole cells at the start and the end. Afterwards the
  // particles fade out over the photo ("settling"), then shrink back to dots inside the lens.
  function showParticles(duration) {
    particles.fillCells();
    hero.classList.remove('is-settling');
    hero.classList.add('is-morphing');
    window.clearTimeout(particleTimer);
    window.clearTimeout(settleTimer);
    particleTimer = window.setTimeout(() => {
      hero.classList.replace('is-morphing', 'is-settling');
      settleTimer = window.setTimeout(() => hero.classList.remove('is-settling'), 600);
    }, duration);
  }

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

  // The full-size photos, so each particle can carry its own piece of the picture rather than one
  // flat colour. They load in the background. Until one is ready, particles use flat colours.
  // Opened from disk, the browser will not let a canvas read a photo: the lens then shows the photo
  // through the dots instead, and the rebuild uses flat colours.
  const photos = {};
  // The pixelating lens around the pointer, in canvas pixels. The radius matches the mask in components.css.
  const lens = { x: -9999, y: -9999, radius: 9 * parseFloat(getComputedStyle(document.documentElement).fontSize), isLeaving: false };

  // Draws a photo over the whole canvas the way object-fit: cover draws the photo behind it.
  function drawCover(target, photo, width, height) {
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const drawWidth = photo.naturalWidth * scale;
    const drawHeight = photo.naturalHeight * scale;
    target.drawImage(photo, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function loadPhoto(key, onReady) {
    const slide = slides.find((other) => other.dataset.heroSlide === key);
    if (!slide || photos[key]) {
      return;
    }
    photos[key] = new Image();
    photos[key].onload = onReady;
    photos[key].src = slide.dataset.heroImage;
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
    // Position, velocity, target position, colour, target colour, size, target size, start delay, scroll spread.
    let positionX, positionY, velocityX, velocityY, targetX, targetY;
    let red, green, blue, targetRed, targetGreen, targetBlue, size, targetSize, startTime, spread;
    // Where each particle's piece of the photo sits (top-left of its cell), now and before the last morph.
    let sourceX, sourceY, oldSourceX, oldSourceY;
    // Where each particle set off from on the last slide change.
    let fromX, fromY;
    // The photo drawn at canvas size, now and before the last morph. Null means flat colours.
    let texture = null;
    let oldTexture = null;
    let textureKey = null;
    const textureCanvas = document.createElement('canvas');
    const textureContext = textureCanvas.getContext('2d', { willReadFrequently: true });
    let canReadPhotos = true;
    // How far the dots have grown to fill their cells: 1 matches the photo exactly, 0 is the halftone.
    let fill = 1;

    function readTexture(key) {
      const photo = photos[key];
      if (!canReadPhotos || !photo || !photo.complete || !photo.naturalWidth) {
        return null;
      }
      textureCanvas.width = width;
      textureCanvas.height = height;
      drawCover(textureContext, photo, width, height);
      try {
        return new Uint32Array(textureContext.getImageData(0, 0, width, height).data.buffer);
      } catch {
        canReadPhotos = false; // opened from disk: the browser blocks reading the photo
        return null;
      }
    }

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
      [sourceX, sourceY, oldSourceX, oldSourceY] = Array.from({ length: 4 }, () => new Int32Array(count));
      [fromX, fromY] = Array.from({ length: 2 }, () => new Float32Array(count));
      texture = oldTexture = null;
      textureKey = null;
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
      // Particles keep their old piece of photo until they set off, then carry the new one.
      oldTexture = texture;
      oldSourceX.set(sourceX);
      oldSourceY.set(sourceY);
      textureKey = key;
      texture = readTexture(key);
      if (!texture) {
        loadPhoto(key, () => {
          if (textureKey === key) {
            texture = readTexture(key);
          }
        });
      }
      for (let rank = 0; rank < count; rank += 1) {
        const particle = particleOrder[rank];
        const cell = cellOrder[rank];
        sourceX[particle] = (cell % columns) * cellSize;
        sourceY[particle] = Math.floor(cell / columns) * cellSize;
        targetX[particle] = sourceX[particle] + cellSize / 2;
        targetY[particle] = sourceY[particle] + cellSize / 2;
        targetRed[particle] = Math.min(255, cellRed[cell] * 1.12 + 6);
        targetGreen[particle] = Math.min(255, cellGreen[cell] * 1.12 + 6);
        targetBlue[particle] = Math.min(255, cellBlue[cell] * 1.12 + 6);
        // Brighter cells get bigger dots, like a halftone print.
        targetSize[particle] = Math.max(1.4, cellSize * (0.3 + 0.7 * cellLight[cell]));
        startTime[particle] = now + Math.random() * morphDelay;
        fromX[particle] = positionX[particle];
        fromY[particle] = positionY[particle];
      }
    }

    function step(now) {
      const scrollSpread = Motion.clamp(window.scrollY / height);
      const spring = 0.045;
      const damping = 0.84;
      // Only draw what can be seen: the whole screen while the particles rebuild or scatter, the
      // box around the lens while the pointer is over the photo, and nothing otherwise.
      let clipLeft = 0;
      let clipTop = 0;
      let clipRight = width;
      let clipBottom = height;
      const isMorphing = hero.classList.contains('is-morphing');
      const isFullScreen = isMorphing || hero.classList.contains('is-settling');
      const isDrawing = isFullScreen || hero.classList.contains('is-looking');
      // The dots fill their cells while full screen and while the lens closes, and shrink to the halftone otherwise.
      const fillTarget = isFullScreen || lens.isLeaving ? 1 : 0;
      fill = Math.abs(fillTarget - fill) < 0.02 ? fillTarget : fill + (fillTarget - fill) * 0.1;
      if (lens.isLeaving && fill === 1) {
        lens.isLeaving = false;
        hero.classList.remove('is-looking');
      }
      if (!isFullScreen) {
        const reach = lens.radius + cellSize * 2;
        clipLeft = Math.max(0, Math.floor(lens.x - reach));
        clipTop = Math.max(0, Math.floor(lens.y - reach));
        clipRight = Math.min(width, Math.ceil(lens.x + reach));
        clipBottom = Math.min(height, Math.ceil(lens.y + reach));
      }
      const hasClip = isDrawing && clipRight > clipLeft && clipBottom > clipTop;
      if (hasClip) {
        for (let row = clipTop; row < clipBottom; row += 1) {
          pixels.fill(0, row * width + clipLeft, row * width + clipRight);
        }
      }
      // In the lens the dots are smallest at the pointer and grow to fill their cells towards the
      // edge, so the lens blends into the photo by its gaps closing rather than by fading.
      const lensInner = lens.radius * 0.2;
      const lensOuter = lens.radius * 0.85;
      // A few random nudges keep the picture shimmering.
      for (let nudge = 0; nudge < 30; nudge += 1) {
        const index = Math.floor(Math.random() * count);
        velocityX[index] += Math.random() - 0.5;
        velocityY[index] += Math.random() - 0.5;
      }
      for (let index = 0; index < count; index += 1) {
        const hasStarted = now > startTime[index];
        const progress = (now - startTime[index]) / morphDuration;
        if (progress > 0 && progress < 1) {
          // Mid-flight on a slide change: follow the ease-out curve.
          const eased = morphEase(progress);
          positionX[index] = fromX[index] + (targetX[index] - fromX[index]) * eased;
          positionY[index] = fromY[index] + (targetY[index] - fromY[index]) * eased;
          velocityX[index] = 0;
          velocityY[index] = 0;
        } else {
          // At rest (or scattered): a spring holds each particle to its place.
          if (hasStarted) {
            velocityX[index] += (targetX[index] - positionX[index]) * spring;
            velocityY[index] += (targetY[index] - positionY[index]) * spring;
          }
          velocityX[index] *= damping;
          velocityY[index] *= damping;
          positionX[index] += velocityX[index];
          positionY[index] += velocityY[index];
        }
        red[index] += (targetRed[index] - red[index]) * 0.05;
        green[index] += (targetGreen[index] - green[index]) * 0.05;
        blue[index] += (targetBlue[index] - blue[index]) * 0.05;
        size[index] += (targetSize[index] - size[index]) * 0.08;

        const centreY = positionY[index] - scrollSpread * spread[index] * height * 0.9;
        let dotFill = fill;
        let drawX = positionX[index];
        let drawY = centreY;
        if (!isFullScreen) {
          const distance = Math.hypot(positionX[index] - lens.x, centreY - lens.y);
          const edge = Motion.clamp((distance - lensInner) / (lensOuter - lensInner));
          const edgeFill = edge * edge * (3 - 2 * edge);
          dotFill = Math.max(fill, edgeFill);
          // Towards the edge the dots also sit exactly in their cells, so no shimmer opens a gap there.
          if (hasStarted) {
            drawX += (targetX[index] - drawX) * edgeFill;
            drawY += (targetY[index] - scrollSpread * spread[index] * height * 0.9 - drawY) * edgeFill;
          }
        }
        const dotSize = Math.max(1, Math.min(cellSize, Math.round(size[index] + (cellSize - size[index]) * dotFill)));
        const left = Math.floor(drawX - dotSize / 2);
        const top = Math.floor(drawY - dotSize / 2);
        if (!hasClip || left < clipLeft || top < clipTop || left + dotSize > clipRight || top + dotSize > clipBottom) {
          continue;
        }
        const source = hasStarted ? texture : oldTexture;
        if (source) {
          // Copy the middle of the particle's cell from the photo, so it carries its piece of the picture.
          const inset = (cellSize - dotSize) >> 1;
          const fromX = Math.min((hasStarted ? sourceX : oldSourceX)[index] + inset, width - dotSize);
          const fromY = Math.min((hasStarted ? sourceY : oldSourceY)[index] + inset, height - dotSize);
          for (let line = 0, offset = top * width + left, from = fromY * width + fromX; line < dotSize; line += 1, offset += width, from += width) {
            for (let column = 0; column < dotSize; column += 1) {
              pixels[offset + column] = source[from + column];
            }
          }
          continue;
        }
        // Pixels are little-endian ABGR.
        const colour = 0xff000000 | (Math.floor(blue[index]) << 16) | (Math.floor(green[index]) << 8) | Math.floor(red[index]);
        for (let line = 0, offset = top * width + left; line < dotSize; line += 1, offset += width) {
          pixels.fill(colour, offset, offset + dotSize);
        }
      }
      if (hasClip) {
        context.putImageData(frameImage, 0, 0, clipLeft, clipTop, clipRight - clipLeft, clipBottom - clipTop);
        // Opened from disk: show the photo through the dots in the lens instead of their flat colours.
        const photo = photos[textureKey];
        if (!texture && !isMorphing && !canReadPhotos && photo && photo.complete) {
          context.save();
          context.beginPath();
          context.rect(clipLeft, clipTop, clipRight - clipLeft, clipBottom - clipTop);
          context.clip();
          context.globalCompositeOperation = 'source-in';
          drawCover(context, photo, width, height);
          context.restore();
        }
      }
    }

    function fillCells() {
      fill = 1;
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
          // A scattered particle leaves any slide-change flight and springs back instead.
          startTime[index] = Math.min(startTime[index], performance.now() - morphDuration);
          const push = (1 - distance / 360) * power;
          velocityX[index] += (distanceX / distance) * push;
          velocityY[index] += (distanceY / distance) * push;
        }
      }
    }

    build();
    return { build, morph, setRunning, scatter, fillCells };
  }

  function startParticles() {
    particles = createParticles();
    blurImage = document.createElement('img');
    blurImage.className = 'hero__blur';
    blurImage.alt = '';
    blurImage.setAttribute('aria-hidden', 'true');
    blurImage.src = backdropImage.currentSrc || backdropImage.src;
    hero.querySelector('.hero__canvas').before(blurImage);
    hero.classList.add('has-particles');

    hero.addEventListener('pointermove', (event) => {
      // The lens opens with the photo and pixelates as the dots shrink.
      if (!hero.classList.contains('is-looking')) {
        particles.fillCells();
      }
      lens.isLeaving = false;
      const bounds = hero.getBoundingClientRect();
      lens.x = event.clientX - bounds.left;
      lens.y = event.clientY - bounds.top;
      hero.style.setProperty('--lens-x', `${lens.x}px`);
      hero.style.setProperty('--lens-y', `${lens.y}px`);
      hero.classList.add('is-looking', 'is-paused');
    });
    // The lens closes by growing the dots back into the photo, then hides.
    hero.addEventListener('pointerleave', () => {
      hero.classList.remove('is-paused');
      lens.isLeaving = true;
      window.setTimeout(() => {
        if (lens.isLeaving) {
          lens.isLeaving = false;
          hero.classList.remove('is-looking');
        }
      }, 700);
    });
    hero.addEventListener('pointerdown', (event) => {
      if (event.target.closest('a, button')) {
        return;
      }
      const bounds = hero.getBoundingClientRect();
      particles.scatter(event.clientX - bounds.left, event.clientY - bounds.top);
      showParticles(1800);
      Achievements.unlock('shock');
    });
    window.addEventListener('hero:scatter', () => {
      particles.scatter(undefined, undefined, 70);
      showParticles(1800);
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
