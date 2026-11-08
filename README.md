# Alex Coultas — Game Engineer

The portfolio website of Alex Coultas, a Senior Game Engineer in New Zealand. It shows my studio work, client work, side projects, apps and plugins, my NZGDC talk and my experience. It is a static site (plain HTML, CSS and JavaScript, no build step), hosted on GitHub Pages at <https://zeploc.github.io/>. It replaces my ArtStation as the home of my work.

## View it locally

Open `index.html` in a browser. Everything works from the file system, except that YouTube videos open on YouTube instead of playing in the page. To play them in the page, run `python -m http.server 8000` in this folder and open `http://localhost:8000`.

## Publish on GitHub Pages

The repository is `Zeploc/zeploc.github.io`, so GitHub Pages serves it at the root of `https://zeploc.github.io/`.

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, the branch to `main`, and the folder to `/ (root)`.
3. Push to `main`. The site updates a minute or two later.

- `.nojekyll` tells GitHub Pages to serve the files as they are, without Jekyll.
- `404.html` is the page that GitHub Pages shows for an address that does not exist.
- `pages/resources.html` keeps the address that my NZGDC slides link to. `pages/portfolio.html` sends the old portfolio address to the home page.
- `content/`, `concepts/` and `screenshots/` are in `.gitignore` and stay on this PC.

## Content still needed

Search the HTML for `TODO` to find each gap.

- [ ] **Videos** — upload these to YouTube (or similar) and add each video's ID as `data-youtube-id` on its card. Until then each card shows a still and "Video coming soon". The originals are in `content/`.
  - SuperHorse: `SuperHorse/SuperHorse Menus and Gameplay.mp4`
  - HTTYD: `HTTYD/Mountain range flying/…`, `HTTYD/Flight tests with model/…`, the four `HTTYD/Blender animation/…` clips, the two `HTTYD/Animations in editor/…` clips and the four `HTTYD/Early development/…` clips
  - Sky Engine: `Sky Engine/Sky Editor_ Sandbox_Project - Fence 2026-09-29 22-01-38.mp4`
  - Atlas: the three clips in `Atlas (Taro)/`
  - Radar: the four simulator clips in `Radar/`
- [ ] **Placeholder tiles** — project pages show dashed "Screenshot / Video / Photo coming soon" tiles (search for `data-placeholder`). Each says what to capture: Dotzi, Radar, Atlas, Sky Engine, Gameplay Flow, UnderForge and every client page.
- [ ] **Client work** (Buildmedia) — screenshots and a clip for each of the seven client pages (`projects/toyota.html` and the others).
- [ ] **University projects** — a thumbnail and screenshots for each project page (`projects/hardlight.html`, `stolen-time.html`, `tosspots.html`, `painted-wings.html`, `portal.html`), shown in Chapter 05 on the home page and in the archive.
- [ ] **Skyward Space Project** — a thumbnail for the home page and archive cards, and screenshots for `projects/skyward-space-project.html`.
- [ ] **Gameplay Flow** — a link if the GitHub repository becomes public (it is private now).
- [ ] **Kyōryū** — clips of the systems I built, once they can be shown. The key art comes from kyoryuofficial.com; check it is fine to use.
- [ ] **Mythos Party** — the development dates.
- [ ] **Skyward Studios timeline entry** — check the dates ("Since 2019"), the role, the five items and the highlighted skills (all guessed) in the experience timeline.
- [ ] **VRAF** — a clip of the physics interactions and what I built.
- [ ] **SuperHorse** — the Steam link when the store page is live.
- [ ] **Kinetic, Lifeline, Retail Simulator, Dotzi** — screenshots or clips.
- [ ] **Untitled Emu Game** — the event it was made for, the final name, the team, my role, and screenshots or a clip.
- [ ] **Cambrian Carnage** — a larger thumbnail and screenshots, the Unreal Engine version and the gameplay systems I built. The GitHub repository is empty.
- [ ] **Trithym** — the team, my role and screenshots.
- [ ] **Profit Loss Prototype** — what it is about, its final name, what I built and screenshots. The repository is one commit of a top-down template with the Sky Ability System.
- [ ] **Minigolf** — a thumbnail and screenshots.
- [ ] **Hyperion Labs** — waiting on the "KRATZ" notes in Notion.

## Add or change a project

1. Put the original images and videos in `content/<Project Name>/`.
2. For a video, add it to the list at the top of `tools/extract_frames.py` and run `tools\Extract-Frames.bat` to save stills from it.
3. Add the images (and stills) to the lists at the top of `tools/optimise_images.py`, then run `tools\Optimise-Images.bat`. It writes web-sized WebP images to `assets/img/<project-slug>/` and prints their sizes.
4. Copy an existing page in `projects/` to `projects/<project-slug>.html` and change the text and images. Use the printed sizes for each image's `width` and `height`.
5. Add the project to the home page (side projects, or the work panels), to the archive grid with its tags, and to the previous/next links of the pages either side of it. Add its slug to the `projects` list in `assets/js/dev-console.js`.
6. Run `tools\Capture-Devices.bat index.html projects\<project-slug>.html` and check the screenshots.

## Update the CV

1. Save the new CV over `content/Alex Coultas - CV - 2026.pdf` (or add the new file there).
2. Check it has **no phone number**. The email address is fine.
3. Copy it to `assets/docs/alex-coultas-cv.pdf`. Keep that file name, because every page links to it.

## Project structure

```
index.html               Home page
projects/                One page per project
pages/                   GAS talk resources, and a redirect from the old portfolio page
404.html                 "Page not found" page for GitHub Pages
assets/css/              tokens.css, base.css, layout.css, components.css
assets/js/               One script per behaviour (hero, kiosk, work panels, archive, console, …)
assets/img/              Optimised images, one folder per project, and link previews
assets/docs/             The public CV (alex-coultas-cv.pdf), linked from the header and footer
assets/fonts/            Self-hosted fonts (Space Grotesk, JetBrains Mono; SIL Open Font License)
docs/                    Coding standards and device support
tools/                   Frame extractor, image optimiser and device screenshot scripts
content/                 Original media and the source CV (not published)
concepts/                Layout concepts (not published)
```

## Standards

- [Coding Standards](docs/CodingStandards.md)
- [Device Support](docs/DeviceSupport.md)
