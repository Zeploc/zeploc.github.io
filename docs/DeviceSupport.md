# Device Support

The devices and browsers that the portfolio site supports, and how to check a change on them. Read this with the [Coding Standards](CodingStandards.md), which say how to write code that works on all of them.

---

## Contents

1. [Supported Browsers](#supported-browsers)
2. [Device Sizes](#device-sizes)
3. [Checks for Each Change](#checks-for-each-change)
4. [Automated Checks](#automated-checks)
5. [Before a Release](#before-a-release)
6. [Known Device Behaviour](#known-device-behaviour)

---

## Supported Browsers

The last two versions of each browser:

| Browser | Platforms |
|---|---|
| Chrome | Windows, macOS, Android |
| Edge | Windows |
| Firefox | Windows, macOS |
| Safari | macOS, iPhone, iPad |
| Samsung Internet | Android |

- **All iPhone and iPad browsers use Safari's engine.** Chrome on an iPhone behaves like Safari, not like Chrome on a PC.
- **Use a CSS or JS feature only if it is in all of these browsers.** Check on [Can I use](https://caniuse.com/). If a feature is newer, the page must still work without it.

---

## Device Sizes

Every page must work at every width from **320px** to **2560px**. These sizes are the ones we check. They are CSS pixels, as the browser reports them, not the screen resolution.

| Name | Size (W × H) | Example devices |
|---|---|---|
| `phone-small` | 320 × 568 | iPhone SE (1st gen), small Android phones, 400% zoom |
| `phone` | 375 × 667 | iPhone SE (2nd/3rd gen), most Android phones are 360–412 wide |
| `phone-large` | 430 × 932 | iPhone Pro Max, large Android phones |
| `phone-landscape` | 844 × 390 | Any phone turned on its side |
| `tablet` | 768 × 1024 | iPad mini, small Android tablets, portrait |
| `tablet-landscape` | 1180 × 820 | iPad Air, landscape |
| `laptop` | 1366 × 768 | Small laptops, most common low-cost screen |
| `desktop` | 1920 × 1080 | Most desktop monitors |
| `desktop-wide` | 2560 × 1440 | Large monitors |

- **Phone landscape is the size most often broken.** The screen is wide but very short. A full-height hero or a fixed header can fill all of it.
- **Wide screens:** content stops growing at the container `max-width`. Text lines stay at most about 75 characters.

---

## Checks for Each Change

Do these before you call a change done. They take a few minutes.

1. **Run the screenshots** (`tools\Capture-Devices.bat`, see [Automated Checks](#automated-checks)) and look at each image. Look for:
   - content cut off at the right edge, or a horizontal scroll bar,
   - text that overlaps other text or images,
   - buttons that are too small or too close together,
   - a hero that hides all content on `phone-landscape`.
2. **Drag the browser window** from narrow to wide. The layout must not break between the breakpoints.
3. **Use the keyboard only.** Press Tab through the page. Each link and button must show a focus outline, in a sensible order.
4. **Turn on reduced motion** (Windows: *Settings → Accessibility → Visual effects → Animation effects* off). Animations must stop.
5. **Open the browser console.** There must be no errors.

---

## Automated Checks

### Device screenshots

`tools\Capture-Devices.bat` takes a screenshot of a page at each size in the [Device Sizes](#device-sizes) table, with headless Chrome or Edge.

```
tools\Capture-Devices.bat
tools\Capture-Devices.bat index.html projects\superhorse.html
tools\Capture-Devices.bat -FullPage index.html
```

- The images go to `screenshots\<page>\<device>.png`. The folder is for checks only; do not publish it.
- **The screenshots use reduced motion,** so each one shows the page after its entrance animations. Check the animations themselves in a normal browser.
- **The screenshots show the CSS layout only.** They do not show touch, Safari, the phone's browser bars or the pixel density. Use DevTools and a real device for those.
- **Headless Chrome may not load `loading="lazy"` images in time,** so a thumbnail can look empty in a full-page image. If one does, check that page in a normal browser before you treat it as a bug.
- **`-FullPage` makes the window 8000px tall.** A section that uses `100vh` or `100svh` then becomes 8000px tall too. Use the full-page images to check the sections below the hero, not the hero itself.

### Chrome DevTools device mode

Press **F12**, then **Ctrl + Shift + M**. Pick a device or type a size. Device mode copies touch, the pixel density and the mobile user agent, so it shows hover problems that the screenshots do not.

### Lighthouse

In DevTools, open **Lighthouse**, choose **Mobile**, and run it on each changed page. Every category must score 90 or more. See [Coding Standards → Performance](CodingStandards.md#performance).

### Validators

- HTML: [W3C Markup Validator](https://validator.w3.org/). Paste the file or upload it. No errors.
- Accessibility: the [axe DevTools](https://www.deque.com/axe/devtools/) browser extension. No serious or critical issues.

---

## Before a Release

Before the site goes live, and after a large change:

- [ ] All [checks for each change](#checks-for-each-change) on every page.
- [ ] Lighthouse mobile 90+ on every page.
- [ ] HTML validates and axe shows no serious issues on every page.
- [ ] **On a real iPhone** (Safari): open each page, rotate the phone, play a video, swipe through the work panels.
- [ ] **On a real Android phone** (Chrome): the same.
- [ ] On a slow connection (DevTools → Network → *Slow 4G*): the first screen shows in under 3 s.
- [ ] All placeholder text, images and links are replaced. Search the code for `placeholder`, `Lorem` and `href="#"`.
- [ ] The page `<title>` and `<meta name="description">` are correct on every page.

Record the result here:

| Date | Pages | Devices | Result |
|---|---|---|---|
| — | — | — | Not yet released |

---

## Known Device Behaviour

- **The hero star field is the heaviest part of the site.** Check the frame rate on a mid-range phone (console: `stat fps`). Smaller screens draw fewer stars.
- **One scroll from the hero zooms into the viewscreen** and lands on that project's work panel; one scroll up from the first panel zooms back out. It only runs when the hero fits the window (laptops); smaller windows scroll the hero as normal. Check both ways.
- **The work panels step one screen per scroll with a wheel or trackpad.** Touch screens use CSS scroll snapping instead. Check both.

- **iPhone Safari zooms in on a form field** with text smaller than 16px. Form fields use at least `1rem`.
- **iPhone Safari does not autoplay video** unless it is `muted` and `playsinline`.
- **`100vh` on phones is taller than the visible screen,** because the browser bar slides away. Use `svh` or `dvh` (see [Coding Standards → Responsive Layout](CodingStandards.md#responsive-layout)).
- **A tap on a phone triggers `:hover`,** and the hover state stays until the user taps somewhere else. Put hover effects in `@media (hover: hover)`.
- **Notched phones in landscape** put the notch over the left or right edge of the page. Fixed bars use `env(safe-area-inset-*)`.
- **Headless Chrome will not make a window narrower than 500px, and its viewport is shorter than the window.** `Capture-Devices` loads each page in an iframe of the exact device size and crops the image, so each screenshot is the true device size.
