# Alex Coultas Portfolio — Guidance for Claude Code

This is the portfolio website of **Alex Coultas, a Senior Game Engineer** (Unreal Engine gameplay, systems and tools). It shows Alex's studio projects, client work, side projects, apps, plugins, his NZGDC talk and his experience to studios and recruiters, and it replaces his ArtStation. It is a static site: plain HTML, CSS and JavaScript, with no framework and no build step. It is **hosted on GitHub Pages** at `https://zeploc.github.io/`, so every path is relative and the site must also work when opened from disk.

The design comes from concept `05b` in `concepts/` (Showcase Particles), with the hero from concept `07c` (Viewscreen Bridge): a title screen, a hero with Alex's name and who he is beside a ship's viewscreen of featured projects in a star field, full-screen work panels (one scroll zooms into the viewscreen and lands on that project's panel, so the panels start with the project on screen), an About screen with the stats, a vertical experience timeline (one role per scroll, earlier roles stacking) with the toolkit beside it, a client kiosk, side projects, plugins, a sentence-driven archive, and resources (the talk and the things Alex recommends). One scroll moves one screen through the hero, each work panel, About and each role, then one chapter at a time to the end (a chapter taller than the window scrolls as normal until its end). A developer console (`~`) and achievements add fun extras. `README.md` lists the content that is still needed.

## Standards (authoritative)

- **[Coding Standards](docs/CodingStandards.md)** — follow these for all site code. Key points:
  - Mobile first with `min-width` breakpoints.
  - No horizontal scroll from 320px to 2560px.
  - All colours, fonts and spacing as tokens in `tokens.css`.
  - Semantic HTML, one `<h1>`, links for navigation and buttons for actions.
  - Light BEM class names and `data-` hooks for JS.
  - Hover effects in `@media (hover: hover)` and nothing behind hover only.
  - 44px touch targets and visible focus.
  - Images with `srcset`, `width`, `height`, `alt` and lazy loading.
  - `prefers-reduced-motion` respected.
  - Plain JavaScript, one file per behaviour.
  - WCAG 2.2 AA.
- **[Device Support](docs/DeviceSupport.md)** — the browsers and device sizes we support and how to check a change. Key points:
  - Last two versions of Chrome, Edge, Firefox, Safari and Samsung Internet.
  - Nine check sizes from 320 × 568 to 2560 × 1440.
  - Run `tools\Capture-Devices.bat` and look at every image before you call a change done.

## Project layout

- `index.html`, `projects/`, `pages/`, `404.html` — the live site pages.
- `assets/` — CSS, JS, optimised images and fonts. See [Coding Standards → Project Structure](docs/CodingStandards.md#project-structure).
- `content/` — Alex's original media (photos, screen recordings, project media) and his source CV. Not published. The public copy of the CV is `assets/docs/alex-coultas-cv.pdf`. **Never publish a phone number.** Before you copy a new CV over the public one, read it and check it has no phone number. The email address in the CV is fine, but do not add it to the site pages unless Alex asks. Run `tools\Extract-Frames.bat` (for videos) and `tools\Optimise-Images.bat` after a change here.
- `concepts/` — layout concepts. Reference designs, not the live site. Not published.
- `docs/` — the coding standards and device support docs.
- `tools/` — developer scripts. `tools/README.md` lists them.
- `screenshots/` — output of `Capture-Devices`. Do not publish it.

## Building and checking

- **There is no build.** Open `index.html` in a browser, or run `python -m http.server 8000` and open `http://localhost:8000`.
- **Videos are not in the repository.** They are too large for git. Each video card shows a still until it has a `data-youtube-id`.
- **Check each change on the device sizes.** Run `tools\Capture-Devices.bat <changed pages>` and look at each screenshot before you report the change as done. Report what you checked and anything that looked wrong.

## Commits

- **Commit only when the user asks.**
- **Short messages.** One imperative title line that says what the commit does. Add a few bullet points only if the change needs them.

## Decisions

- **A design choice is asked, not made.** When a request leaves more than one reasonable approach open, give the options and a recommendation, and wait for the user to choose. Routine calls that the standards already settle are not design choices.
- **A new library, framework, build tool or third-party service is always a design choice.**
- **Content is Alex's.** Do not invent project facts, studios, dates, numbers or quotes for the live site. Take facts only from Alex's CV in `content/`, his messages, the project folders he points to, and each project's official page. Mark each gap with a `TODO` comment, add it to the "Content still needed" list in `README.md`, and list it in the report.
- **No ArtStation links.** This site replaces it.

## Writing style

- **Plain English, British spelling** in docs, comments, commit messages and site text.
- **Short sentences, active voice.** One instruction per sentence in the docs.
- **No semicolons in writing.** Use a full stop, a comma or a joining word (and, but, so) instead. This covers site text, docs and code comments.
- **Site text speaks as Alex,** in the first person: friendly and confident, not jokey. Plain labels (Work, About, Experience) are easier for recruiters to scan, and the playful extras (console, achievements) stay optional.

---

When a request touches code, use the conventions above, not generic defaults. Where this file and a doc disagree, the doc wins.
