# Coding Standards

How we write the HTML, CSS and JavaScript for Alex's portfolio site, published on GitHub Pages at zeploc.github.io. The site is a static site with no build step and no framework. These standards keep the code clean, and they make sure that every page works on phones, tablets, laptops and desktops.

The standards are based on the [MDN guidelines](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide), the [Google HTML/CSS style guide](https://google.github.io/styleguide/htmlcssguide.html) and [WCAG 2.2 AA](https://www.w3.org/WAI/WCAG22/quickref/). Where this document and a source disagree, this document wins.

> **Devices and testing:** for the devices and browsers we support, and how to check a change on them, see [Device Support](DeviceSupport.md).

---

## Contents

1. [Guiding Principles](#guiding-principles)
2. [Project Structure](#project-structure)
3. [Formatting and Naming](#formatting-and-naming)
4. [HTML](#html)
5. [CSS](#css)
6. [Responsive Layout](#responsive-layout)
7. [Touch, Hover and Keyboard](#touch-hover-and-keyboard)
8. [Images, Video and Fonts](#images-video-and-fonts)
9. [JavaScript](#javascript)
10. [Accessibility](#accessibility)
11. [Performance](#performance)
12. [Comments](#comments)
13. [Checklist](#checklist)

---

## Guiding Principles

- **Mobile first.** Write the phone layout first. Add to it for larger screens with `min-width` media queries.
- **Content works without JavaScript.** Every project, link and piece of text is in the HTML. JavaScript adds polish; it does not hold content.
- **Readable over clever.** The next person to edit the site may not be a web developer. Plain, obvious code wins.
- **One source of truth.** A colour, a font size or a spacing value is defined once, as a token, and used everywhere.
- **Keep it light.** No framework, library or build tool without agreement. Each one is a design decision (see [CLAUDE.md](../CLAUDE.md#decisions)).

---

## Project Structure

```
index.html                      Home page: hero, work panels, client kiosk, side projects, about, experience, archive, made & found
404.html                        "Page not found" page for GitHub Pages (self-contained styles)
projects/<project-slug>.html    One page per project ("open the piece")
pages/resources.html            GAS talk resources (kept at the address the talk slides link to)
pages/portfolio.html            Redirect from the old Jekyll site's portfolio page
assets/
  css/
    tokens.css                  Colours, fonts, spacing, radii, breakpoints (custom properties only)
    base.css                    Reset, element defaults, typography, page transition
    layout.css                  Page shell: header, footer, containers, section spacing
    components.css              Reusable parts: buttons, cards, hero, kiosk, timeline, archive, galleries
  js/
    motion.js                   Shared helpers (reduced motion, storage, root path). Loads first.
    achievements.js             Shared achievements (window.Achievements). Loads second.
    <behaviour>.js              One file per behaviour: hero.js, kiosk.js, archive-query.js
  img/<project-slug>/           Optimised images for one project (made by tools/optimise_images.py)
  img/previews/                 Link previews (og:image)
  fonts/                        Self-hosted WOFF2 fonts
content/                        Original media and the full CV. Not published (in .gitignore).
concepts/                       Layout concepts. Reference only, not published (in .gitignore).
docs/                           These standards
tools/                          Developer scripts
```

- **File and folder names are lowercase, with hyphens:** `mythos-party.html`, `hero-1600.webp`. No spaces, no capitals, no underscores.
- **A project slug is the project name in kebab case.** The same slug names the page and its image folder.
- **No grab-bag files.** No `misc.css`, `utils.js` or `helpers.js`. Name the file for what it holds.
- **Load order of the CSS:** `tokens.css`, `base.css`, `layout.css`, `components.css`. Each page loads the same files.
- **All paths are relative:** `assets/css/base.css` from the home page, `../assets/css/base.css` from a project page. Never start a path with `/`. GitHub Pages can serve the site from a sub-folder (`username.github.io/repository/`), where a path from the root breaks.

---

## Formatting and Naming

`.editorconfig` holds the formatting settings. Most editors apply it automatically.

- **Indent with 2 spaces.** No tabs.
- **Lines at most 120 characters,** where the content allows.
- **Lowercase** element names, attribute names and CSS properties.
- **Double quotes** for HTML attributes. **Single quotes** for JavaScript strings.
- **Use British spelling for names we define and for site text:** `colour` in prose and comments. CSS and browser names keep their own spelling (`color`, `center`).

### Class names

Use a light **BEM** style: `block`, `block__element`, `block--modifier`.

```html
<article class="project-card project-card--featured">
  <img class="project-card__image" ...>
  <h3 class="project-card__title">Sunken Bastion</h3>
</article>
```

- **Name for what the thing is, not how it looks:** `.project-card`, not `.orange-box`.
- **Full words:** `.timeline__entry`, not `.tl-ent`.
- **State classes start with `is-` or `has-`:** `.is-open`, `.is-active`, `.has-video`.
- **JavaScript hooks use `data-` attributes, not classes:** `data-carousel`, `data-count-to="14"`. A designer can then rename a class without breaking a script.
- **No IDs for styling.** IDs are for anchor links and `aria-*` references only.

---

## HTML

- **Every page starts with the same head:**

  ```html
  <!doctype html>
  <html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SuperHorse — Alex Coultas, Game Engineer</title>
    <meta name="description" content="One sentence about this page.">
    ...
  </head>
  ```

- **Never block zoom.** Do not add `maximum-scale` or `user-scalable=no` to the viewport tag.
- **Use landmarks:** one `<header>`, one `<nav>` for the main menu, one `<main>`, one `<footer>`. Put each content block in a `<section>` with a heading.
- **One `<h1>` per page.** Headings go in order: do not skip from `<h2>` to `<h4>`.
- **A link goes somewhere; a button does something.** Use `<a href>` for navigation and `<button type="button">` for actions. Never put a click handler on a `<div>`.
- **Use native elements first.** `<details>`/`<summary>` for "View details" toggles, `<dialog>` for pop-ups, `<video>` for clips.
- **External links** that open a new tab use `target="_blank" rel="noopener"`. Use a new tab only for external sites and PDFs.
- **No inline styles** and **no inline event handlers** (`onclick=""`). Styles go in CSS, behaviour in JS files. Scripts may set custom properties and transforms on elements at run time.
- **Illustrations are inline SVG** with classes, styled in `components.css` (for example the client kiosk drawings).
- **The page must validate** in the [W3C validator](https://validator.w3.org/) with no errors.

---

## CSS

### Tokens

All design values are custom properties in `tokens.css`. Components use the tokens, never raw values.

```css
:root {
  --colour-bg: #0a0a0b;
  --colour-text: #f4f4f5;
  --colour-accent: #ff6a2b;

  --font-display: 'Anton', Impact, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --space-xs: 0.25rem;
  --space-s: 0.5rem;
  --space-m: 1rem;
  --space-l: 2rem;
  --space-xl: 4rem;

  --radius-m: 12px;
}
```

- **A hex value or a font name outside `tokens.css` is a defect.**
- **Spacing comes from the spacing scale.** If no step fits, add a step; do not invent a one-off value.

### Rules

- **Use `rem` for font sizes and spacing,** so the site follows the user's browser text size. Use `px` only for borders and shadows.
- **Use `clamp()` for headings** that scale with the screen: `font-size: clamp(2.5rem, 8vw, 6rem);`.
- **Body text is at least `1rem` (16px).** Small labels are at least `0.75rem` (12px).
- **Lay out with Flexbox and Grid.** No floats for layout, no absolute positioning for page structure.
- **Keep selectors short and flat:** at most two levels (`.project-card__title`, `.timeline .is-open`). No element chains such as `main section div ul li a`.
- **No `!important`.** If you need it, the selectors are fighting. Fix the selectors.
- **Group properties in this order:** layout and position, box (size, margin, padding), typography, visual (colour, background, border), then animation.
- **Animations use `transform` and `opacity` only,** so they stay smooth on phones.

---

## Responsive Layout

The site must work from **320px wide** (small phones and 400% zoom) up to **2560px wide** (large desktop monitors), in portrait and landscape. [Device Support](DeviceSupport.md) lists the sizes we check.

### Breakpoints

Use these breakpoints, mobile first. They are named in `tokens.css` as comments, because custom properties do not work inside media queries.

| Name | Query | Typical devices |
|---|---|---|
| (base) | no query | Phones, 320–639px |
| `tablet` | `@media (min-width: 40rem)` | Large phones in landscape, small tablets, 640px+ |
| `laptop` | `@media (min-width: 64rem)` | Tablets in landscape, laptops, 1024px+ |
| `desktop` | `@media (min-width: 80rem)` | Desktop monitors, 1280px+ |

- **Use `min-width` queries only.** Do not mix `min-width` and `max-width` in one file.
- **Add a breakpoint where the content breaks,** not for a specific device. If a component needs its own breakpoint, use a container query on the component.

### Rules

- **No horizontal scrolling** at any width from 320px. Check this first on every change.
- **No fixed widths on containers.** Use `max-width` with a percentage or `min()`: `width: min(100% - 2rem, 75rem);`.
- **Grids collapse to one column on phones.** Use `repeat(auto-fit, minmax(min(100%, 18rem), 1fr))` so cards wrap without a query.
- **Full-height sections use `svh`/`dvh`**, with a `vh` fallback. On phones, `100vh` is taller than the visible screen.

  ```css
  .hero {
    min-height: 100vh;
    min-height: 100svh;
  }
  ```

- **Long words must wrap.** Set `overflow-wrap: break-word;` on headings, so a big project title does not push the page wider.
- **Media never overflows.** `base.css` sets `img, video, svg, iframe { max-width: 100%; height: auto; }`.
- **Respect the notch.** A fixed header or footer adds `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` to its padding.
- **Sticky sidebars** (such as concept 06) become normal blocks on phones. A sticky element that is taller than the screen hides content.

---

## Touch, Hover and Keyboard

Phones and tablets have no hover and no cursor. Some laptops have both touch and a mouse. Each interaction must work with a finger, a mouse and a keyboard.

- **Touch targets are at least 44 × 44px.** Use padding to grow a small link or icon. Leave at least 8px between targets.
- **Never hide content or actions behind hover only.** A hover preview is an extra; the same content must be reachable with a tap or a focus.
- **Put hover effects inside a hover query,** so a tap does not leave a "stuck" hover state on a phone:

  ```css
  @media (hover: hover) and (pointer: fine) {
    .project-card:hover {
      transform: translateY(-4px);
    }
  }
  ```

- **Every interactive element shows a focus outline.** Style `:focus-visible`; never set `outline: none` without a replacement.
- **Tab order follows the visual order.** Do not use a positive `tabindex`.
- **Keyboard shortcuts** (such as the arrow keys in concept 02) are extras. The same action needs a visible control.
- **Horizontal carousels** support swipe, buttons and the keyboard. They use `scroll-snap`, not a JavaScript drag library.

---

## Images, Video and Fonts

Images and video are most of the page weight. On a phone, they decide whether the page feels fast.

### Images

- **Use modern formats:** AVIF or WebP, with a JPEG fallback in a `<picture>` element where needed.
- **Give each image several sizes** with `srcset` and `sizes`, so a phone does not download a desktop image:

  ```html
  <img
    src="assets/img/spaceship-level/shot-27-1280.webp"
    srcset="assets/img/spaceship-level/shot-27-640.webp 640w,
            assets/img/spaceship-level/shot-27-1280.webp 1280w,
            assets/img/spaceship-level/shot-27-1920.webp 1920w"
    sizes="(min-width: 64rem) 60vw, 100vw"
    width="1920" height="1080"
    alt="The flooded courtyard of Sunken Bastion, lit by a single lantern"
    loading="lazy" decoding="async">
  ```

- **Always set `width` and `height`.** The browser then saves the space, and the page does not jump while images load.
- **Lazy-load every image below the first screen** (`loading="lazy"`). The main hero image loads at once and uses `fetchpriority="high"`.
- **Image size limits:** at most 1920px wide, and at most 300 KB for a full-width image.
- **Make web images with `tools\Optimise-Images.bat`.** Never publish the originals in `content/`.
- **Animated clips are animated WebP** with a still poster. Show the poster when the user prefers reduced motion:

  ```html
  <picture>
    <source srcset="../assets/img/solace/tile-animation.webp" type="image/webp" media="(prefers-reduced-motion: no-preference)">
    <img src="../assets/img/solace/tile-animation-poster.webp" width="800" height="552" alt="...">
  </picture>
  ```

- **Level maps and diagrams are SVG** where possible. They stay sharp at every size.
- **Every image has an `alt` text.** It describes what the image shows for this project. A decorative image has `alt=""`.

### Video

- **Host the showreel on YouTube or Vimeo,** and embed it behind a poster image with a play button. The player loads only when the user taps play.
- **Self-hosted clips** (short gameplay loops) are MP4 (H.264), at most 10 s and 3 MB, with `muted loop playsinline` and a `poster`. They use `preload="none"` below the first screen.
- **Never autoplay with sound.**
- **Pause autoplaying loops** when the user prefers reduced motion (see [Accessibility](#accessibility)).

### Fonts

- **At most two font families,** with only the weights we use.
- **Self-host the fonts as WOFF2** in `assets/fonts/`, with `font-display: swap`. Self-hosting removes a third-party request and works offline.
- **Always give a system fallback** in the font stack.

---

## JavaScript

- **Plain JavaScript, no libraries.** A library is a design decision.
- **One file per behaviour,** loaded at the end of `<body>` with `<script src="..." defer>`, after `motion.js`.
- **Plain scripts, not modules.** Browsers do not load modules from `file://`, and the site must open straight from disk. Each script wraps its code in a function, `(() => { ... })();`, so nothing leaks into the global scope. `motion.js` is the one shared global (`window.Motion`).
- **The only inline script** is the one-line `js` class in the `<head>`. It must run before the first paint, so content that animates in does not flash.
- **Find elements by `data-` attribute:** `document.querySelectorAll('[data-carousel]')`. Do nothing if the element is not on the page.
- **Use `const` by default, `let` when the value changes.** Never `var`.
- **Use `addEventListener`.** No inline handlers.
- **Use full, descriptive names:** `activeSlideIndex`, not `i` or `idx`. Booleans read as a question: `isOpen`, `hasPlayed`.
- **Small functions that do one thing,** with guard clauses instead of deep nesting.
- **Use `IntersectionObserver`** for scroll effects that start or stop (reveals, the stats banner, highlighting the menu). Do not listen to `scroll` for this.
- **Effects that follow the exact scroll position** (the stacked work panels, the experience timeline, the reading progress bar) may listen to `scroll`, as a passive listener that does its work at most once per frame with `requestAnimationFrame`. Say so in a comment.
- **Canvas effects** (the hero star field, the title screen starfield) stop when they are off screen and do not run when the visitor prefers reduced motion.
- **No errors in the console** on any page, on any device.
- **Store user choices only for convenience** (for example, the last open tab), and wrap `localStorage` in `try`/`catch`. The site must work when storage is blocked.

```js
// carousel.js
const carousels = document.querySelectorAll('[data-carousel]');

carousels.forEach((carousel) => {
  const slides = carousel.querySelectorAll('[data-carousel-slide]');
  if (slides.length < 2) {
    return;
  }
  setUpCarousel(carousel, slides);
});
```

---

## Accessibility

The target is **WCAG 2.2 level AA**. Most of it comes from the rules above. The rest:

- **Colour contrast:** at least 4.5:1 for body text, 3:1 for large headings and UI parts. Check each new colour pair with a contrast checker.
- **Colour is never the only signal.** An active menu item also has a line, a weight change or an icon.
- **Reduced motion:** every animation, autoplaying loop and smooth scroll stops or simplifies when the user asks for it:

  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

  This block in `base.css` is the one allowed use of `!important`.
- **Icon-only buttons have a label:** `<button aria-label="Next project">`.
- **Add a "Skip to content" link** as the first element on each page.
- **Use ARIA only when HTML cannot say it.** A native `<button>` needs no `role="button"`.

---

## Performance

Many people will see the site on a phone, on mobile data, from a link in a job application. The page must be fast there.

| Measure | Target, on a mid-range phone on 4G |
|---|---|
| Largest Contentful Paint (LCP) | under 2.5 s |
| Cumulative Layout Shift (CLS) | under 0.1 |
| Interaction to Next Paint (INP) | under 200 ms |
| First load, without video | under 1.5 MB |
| Lighthouse (mobile), every category | 90 or more |

- Check these with Lighthouse in Chrome DevTools, in **mobile** mode. See [Device Support](DeviceSupport.md#automated-checks).
- If a change makes a target fail, fix it before the change is done.

---

## Comments

- **Comment only what the code cannot say:** a browser bug, a value that looks random but is not, an order that matters.
- **Do not narrate the code.** `/* Make the button orange */` above `background: var(--colour-accent);` adds nothing.
- **Use section headings in long CSS files:** `/* === Timeline === */`.
- **No change history in comments** ("changed from…", "previously…"). Git holds the history.

---

## Checklist

Check each change against this list:

- [ ] No horizontal scroll from 320px to 2560px wide, in portrait and landscape.
- [ ] Mobile-first CSS with `min-width` breakpoints only.
- [ ] Colours, fonts and spacing come from `tokens.css`.
- [ ] Hover effects are inside `@media (hover: hover)`; nothing depends on hover only.
- [ ] Touch targets are at least 44 × 44px; focus is visible; the keyboard reaches everything.
- [ ] Images have `srcset`, `width`, `height`, `alt` and lazy loading below the first screen.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] The HTML validates; one `<h1>`; headings in order.
- [ ] No inline styles or handlers; JS uses `data-` hooks; no console errors.
- [ ] No new library, framework or build tool without agreement.
- [ ] The [device checks](DeviceSupport.md#checks-for-each-change) pass.
