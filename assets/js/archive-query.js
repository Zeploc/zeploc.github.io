// The archive filter: finish a sentence ("Show me ... for ... about ..., made by ...") and the
// grid filters to match. Beside it, the sentence is shown as the Unreal gameplay tag query it
// stands for, and the lines that change light up. Without JavaScript the full grid shows.
(() => {
  const root = document.querySelector('[data-archive-query]');
  const archive = document.querySelector('[data-archive]');
  if (!root || !archive) {
    return;
  }
  const items = [...archive.querySelectorAll('[data-archive-item]')];
  const count = document.querySelector('[data-archive-count]');
  const slots = {
    type: [['', 'everything'], ['Type.Project', 'games & tools'], ['Type.App', 'apps & gadgets'], ['Type.Role', 'roles'],
      ['Type.Talk', 'talks'], ['Type.Plugin', 'plugins'], ['Type.Video', 'videos']],
    platform: [['', 'any platform'], ['Platform.VR', 'VR'], ['Platform.PC', 'PC'], ['Platform.Touchscreen', 'touchscreens'],
      ['Platform.Mobile', 'mobile'], ['Platform.Hardware', 'custom hardware']],
    topic: [['', 'anything'], ['Topic.Gameplay', 'gameplay'], ['Topic.Tools', 'tools'], ['Topic.GAS', 'the Gameplay Ability System'],
      ['Topic.Visualisation', 'visualisation'], ['Topic.Engine', 'engine tech']],
    source: [['', 'anyone'], ['Source.Mine', 'me'], ['Source.Recommended', 'other people']],
  };
  const presets = {
    'Everything VR': { platform: 'Platform.VR' },
    'All things GAS': { topic: 'Topic.GAS' },
    'My side projects': { type: 'Type.Project', source: 'Source.Mine' },
  };
  const query = { type: '', platform: '', topic: '', source: '' };
  let previousLines = [];

  root.innerHTML = `
    <div>
      <p class="query__sentence" data-query-sentence>Show me <span class="query__slot" data-slot="type"></span> for
        <span class="query__slot" data-slot="platform"></span> about <span class="query__slot" data-slot="topic"></span>,
        made by <span class="query__slot" data-slot="source"></span>.</p>
      <div class="query__tools">
        ${Object.keys(presets).map((name) => `<button class="query__tool" type="button" data-preset="${name}">${name}</button>`).join('')}
        <button class="query__tool" type="button" data-random>🎲 Random</button>
        <button class="query__tool" type="button" data-reset>Reset</button>
      </div>
    </div>
    <pre class="query__code" aria-label="The sentence as a gameplay tag query"><code data-query-code></code></pre>`;

  const tagsOf = (item) => item.dataset.tags.split(' ');
  const matches = (item, conditions) => Object.values(conditions).every((tag) => !tag || tagsOf(item).includes(tag));
  const countWith = (key, tag) => items.filter((item) => matches(item, { ...query, [key]: tag })).length;
  const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function renderSlots() {
    root.querySelectorAll('[data-slot]').forEach((slot) => {
      const key = slot.dataset.slot;
      const current = slots[key].find(([tag]) => tag === query[key]);
      slot.innerHTML = `
        <button class="query__choice${query[key] ? ' is-set' : ''}" type="button" aria-haspopup="listbox" aria-expanded="false">${escapeHtml(current[1])}</button>
        <span class="query__menu" role="listbox" aria-label="${key}" hidden>
          ${slots[key].map(([tag, label]) => `<button class="query__option" type="button" role="option" data-value="${tag}" aria-selected="${tag === query[key]}">${escapeHtml(label)}<small>${countWith(key, tag)}</small></button>`).join('')}
        </span>`;
    });
  }

  function highlight(line) {
    return escapeHtml(line)
      .replace(/(\/\/.*)$/, '<span class="code-comment">$1</span>')
      .replace(/\b(FGameplayTagQuery|FGameplayTagQueryExpression|FGameplayTagContainer|FPortfolioItem|TArray)\b/g, '<span class="code-type">$1</span>')
      .replace(/\b(const|for|if)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/(TEXT\(&quot;[^&]*&quot;\)|TEXT\("[^"]*"\))/g, '<span class="code-string">$1</span>')
      .replace(/(\.|::)(\w+)\(/g, '$1<span class="code-function">$2</span>(');
  }

  function renderCode(resultCount) {
    const conditions = Object.values(query).filter(Boolean);
    const lines = ['// The sentence, as an Unreal gameplay tag query.'];
    if (!conditions.length) {
      lines.push('FGameplayTagQuery Query =', '    FGameplayTagQuery::MakeQuery_MatchNoTags(FGameplayTagContainer());', '// No conditions yet, so every item passes.');
    } else {
      lines.push('FGameplayTagQuery Query = FGameplayTagQuery::BuildQuery(', '    FGameplayTagQueryExpression()', '        .AllTagsMatch()');
      conditions.forEach((tag, index) => lines.push(`        .AddTag(TEXT("${tag}"))${index === conditions.length - 1 ? ');' : ''}`));
    }
    lines.push('', 'TArray<FPortfolioItem> Results;', `for (const FPortfolioItem& Item : Archive)   // ${items.length} items`, '{',
      '    if (Query.Matches(Item.Tags)) { Results.Add(Item); }', '}', `// Results.Num() == ${resultCount}`);
    root.querySelector('[data-query-code]').innerHTML = lines
      .map((line, index) => {
        const changed = previousLines.length && previousLines[index] !== line ? ' is-changed' : '';
        return `<span class="query__line${changed}">${highlight(line) || ' '}</span>`;
      })
      .join('');
    previousLines = lines;
  }

  function apply() {
    const before = new Map(items.map((item) => [item, item.getBoundingClientRect()]));
    let resultCount = 0;
    items.forEach((item) => {
      const isMatch = matches(item, query);
      item.classList.toggle('is-hidden', !isMatch);
      resultCount += isMatch ? 1 : 0;
    });
    // Cards that stay glide to their new places; new ones fade in.
    if (!Motion.reduceMotion) {
      items.forEach((item) => {
        if (item.classList.contains('is-hidden')) {
          return;
        }
        const from = before.get(item);
        const to = item.getBoundingClientRect();
        if (!from.width) {
          item.animate([{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
        } else if (from.left !== to.left || from.top !== to.top) {
          item.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: 'none' }],
            { duration: 480, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
        }
      });
    }
    count.textContent = `${resultCount} of ${items.length} items`;
    renderSlots();
    renderCode(resultCount);
    if (Object.values(query).every(Boolean)) {
      Achievements.unlock('query');
    }
  }

  function closeMenus() {
    root.querySelectorAll('.query__menu').forEach((menu) => {
      menu.hidden = true;
      menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  }

  function setQuery(next) {
    Object.assign(query, { type: '', platform: '', topic: '', source: '' }, next);
    apply();
  }

  root.addEventListener('click', (event) => {
    const option = event.target.closest('[data-value]');
    if (option) {
      const key = option.closest('[data-slot]').dataset.slot;
      query[key] = option.dataset.value;
      apply();
      root.querySelector(`[data-slot="${key}"] .query__choice`).focus();
      return;
    }
    const choice = event.target.closest('.query__choice');
    if (choice) {
      const menu = choice.nextElementSibling;
      const willOpen = menu.hidden;
      closeMenus();
      if (willOpen) {
        menu.hidden = false;
        choice.setAttribute('aria-expanded', 'true');
        (menu.querySelector('[aria-selected="true"]') || menu.querySelector('button')).focus();
      }
      return;
    }
    const preset = event.target.closest('[data-preset]');
    if (preset) {
      setQuery(presets[preset.dataset.preset]);
    }
    if (event.target.closest('[data-reset]')) {
      setQuery({});
    }
    if (event.target.closest('[data-random]')) {
      // Keep rolling until the sentence has at least one result.
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const roll = {};
        Object.entries(slots).forEach(([key, options]) => {
          roll[key] = Math.random() < 0.55 ? options[1 + Math.floor(Math.random() * (options.length - 1))][0] : '';
        });
        if (Object.values(roll).some(Boolean) && items.some((item) => matches(item, roll))) {
          setQuery(roll);
          return;
        }
      }
    }
  });

  root.addEventListener('keydown', (event) => {
    const option = event.target.closest('.query__option');
    if (event.key === 'Escape') {
      const menu = event.target.closest('.query__menu');
      closeMenus();
      menu?.previousElementSibling.focus();
      return;
    }
    if (option && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const options = [...option.parentElement.children];
      const next = options[(options.indexOf(option) + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length];
      next.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-slot]')) {
      closeMenus();
    }
  });

  apply();
})();
