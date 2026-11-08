// A developer console in the style of a game engine's. Press ~ (or the ~ button) to open it.
// Every command is an extra: each one does something that is also reachable from the page.
(() => {
  const projects = ['kyoryu', 'wanderer', 'mythos-party', 'vraf', 'toyota', 'te-awa-lakes', 'realspace', 'fisher-paykel',
    'spark-simulator', 'spark-boat-builder', 'wellington-digital-twin', 'superhorse', 'httyd', 'kinetic', 'lifeline',
    'retail-simulator', 'underforge', 'sky-engine', 'skyward-space-project', 'atlas', 'radar', 'dotzi',
    'sky-ability-system', 'gameplay-flow', 'sky-camera-system', 'narrative-system', 'university'];
  const sections = ['top', 'about', 'experience', 'work', 'clients', 'side', 'plugins', 'archive', 'resources', 'talk', 'end'];
  const isHome = document.body.classList.contains('page-home');

  const panel = document.createElement('div');
  panel.className = 'dev-console';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Developer console');
  panel.innerHTML = `
    <div class="dev-console__output" data-console-output aria-live="polite"></div>
    <form class="dev-console__form" data-console-form>
      <span aria-hidden="true">&gt;</span>
      <input class="dev-console__input" data-console-input autocomplete="off" spellcheck="false" aria-label="Console command">
    </form>`;
  panel.inert = true;
  document.body.appendChild(panel);

  const output = panel.querySelector('[data-console-output]');
  const input = panel.querySelector('[data-console-input]');
  const history = [];
  let historyIndex = 0;
  let fpsMeter = null;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'header-button';
  button.textContent = '~';
  button.setAttribute('aria-label', 'Open the developer console');
  document.querySelector('[data-header-actions]')?.prepend(button);

  function print(text, kind = '') {
    const line = document.createElement('div');
    if (kind) {
      line.className = `dev-console__line--${kind}`;
    }
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function setOpen(isOpen) {
    panel.classList.toggle('is-open', isOpen);
    panel.inert = !isOpen;
    if (isOpen) {
      window.setTimeout(() => input.focus(), 50);
      Achievements.unlock('console');
    } else {
      input.blur();
    }
  }

  function goTo(section) {
    if (isHome) {
      document.getElementById(section)?.scrollIntoView({ behavior: Motion.reduceMotion ? 'auto' : 'smooth' });
    } else {
      window.location.href = `${Motion.rootPath}index.html#${section}`;
    }
  }

  function toggleFps() {
    if (fpsMeter) {
      fpsMeter.remove();
      fpsMeter = null;
      return 'off';
    }
    fpsMeter = document.createElement('div');
    fpsMeter.className = 'fps-meter';
    document.body.appendChild(fpsMeter);
    let last = performance.now();
    let frames = 0;
    let elapsed = 0;
    const meter = fpsMeter;
    const tick = (now) => {
      if (meter !== fpsMeter) {
        return;
      }
      frames += 1;
      elapsed += now - last;
      last = now;
      if (elapsed > 500) {
        meter.innerHTML = `${Math.round((frames / elapsed) * 1000)} FPS<br>${(elapsed / frames).toFixed(2)} ms`;
        frames = 0;
        elapsed = 0;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return 'on';
  }

  const commands = {
    help: () => print('help · ls · open <project> · goto <section> · next · prev · warp · talk\nslomo <0.1–2> · stat fps · show collision · god · achievements · clear · exit'),
    ls: () => print(`projects: ${projects.join('  ')}\nsections: ${sections.join('  ')}`),
    open: (name) => {
      if (!projects.includes(name)) {
        print(`No project called "${name}". Type "ls".`, 'error');
        return;
      }
      window.location.href = `${Motion.rootPath}projects/${name}.html`;
    },
    goto: (name) => {
      if (!sections.includes(name)) {
        print(`No section "${name}". Type "ls".`, 'error');
        return;
      }
      setOpen(false);
      goTo(name);
    },
    next: () => window.dispatchEvent(new CustomEvent('hero:step', { detail: 1 })),
    prev: () => window.dispatchEvent(new CustomEvent('hero:step', { detail: -1 })),
    warp: () => {
      if (!window.HeroScreen) {
        print('No viewscreen on this page.', 'error');
        return;
      }
      setOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.dispatchEvent(new Event('hero:enter'));
    },
    talk: () => {
      setOpen(false);
      goTo('talk');
    },
    slomo: (value) => {
      const rate = Motion.clamp(Number.parseFloat(value) || 1, 0.1, 2);
      document.getAnimations().forEach((animation) => {
        animation.playbackRate = rate;
      });
      print(`Time dilation set to ${rate}`);
      Achievements.unlock('slomo');
    },
    stat: (value) => (value === 'fps' ? print(`stat fps ${toggleFps()}`) : print('Try: stat fps', 'error')),
    show: (value) => {
      if (value !== 'collision') {
        print('Try: show collision', 'error');
        return;
      }
      const isOn = document.body.classList.toggle('collision-view');
      print(`Collision view ${isOn ? 'on' : 'off'}`);
      Achievements.unlock('collision');
    },
    god: () => godMode(),
    achievements: () => {
      setOpen(false);
      Achievements.open();
    },
    clear: () => {
      output.textContent = '';
    },
    exit: () => setOpen(false),
    quit: () => print('Are you sure? There\'s still so much to see. (Type "exit" to close the console.)', 'command'),
  };

  function godMode() {
    const isOn = document.documentElement.classList.toggle('god-mode');
    print(`God mode ${isOn ? 'ON' : 'off'}`, 'good');
    Achievements.unlock('god');
  }

  function run(raw) {
    const [name, ...rest] = raw.trim().split(/\s+/);
    if (!name) {
      return;
    }
    print(`> ${raw}`, 'command');
    const command = commands[name.toLowerCase()];
    if (!command) {
      print(`Command not recognized: ${name}`, 'error');
      return;
    }
    command(rest.join(' ').toLowerCase());
  }

  function complete() {
    const [name] = input.value.split(' ');
    let pool = Object.keys(commands);
    if (name === 'open') {
      pool = projects.map((project) => `open ${project}`);
    } else if (name === 'goto') {
      pool = sections.map((section) => `goto ${section}`);
    }
    const matches = pool.filter((entry) => entry.startsWith(input.value));
    if (matches.length === 1) {
      input.value = `${matches[0]} `;
    } else if (matches.length) {
      print(matches.join('  '));
    }
  }

  panel.querySelector('[data-console-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    if (!value) {
      return;
    }
    history.push(value);
    historyIndex = history.length;
    input.value = '';
    run(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && historyIndex > 0) {
      historyIndex -= 1;
      input.value = history[historyIndex];
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      historyIndex = Math.min(historyIndex + 1, history.length);
      input.value = history[historyIndex] || '';
      event.preventDefault();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      complete();
    }
  });

  button.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));

  // The Konami code turns on god mode without the console.
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  window.addEventListener('keydown', (event) => {
    if (event.key === '`' || event.key === '~') {
      event.preventDefault();
      setOpen(!panel.classList.contains('is-open'));
      return;
    }
    if (event.key === 'Escape' && panel.classList.contains('is-open')) {
      setOpen(false);
      return;
    }
    if (event.key === konami[konamiIndex]) {
      konamiIndex += 1;
    } else {
      konamiIndex = event.key === konami[0] ? 1 : 0;
    }
    if (konamiIndex === konami.length) {
      konamiIndex = 0;
      godMode();
    }
  });

  print('Alex Coultas, portfolio console. Type "help" for commands.', 'good');
})();
