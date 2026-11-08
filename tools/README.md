# Tools

Developer scripts for the portfolio site. Each script has a `.bat` file that runs it, so you can double-click it or run it from any shell.

| Script | What it does |
|---|---|
| `Extract-Frames` | Saves still frames from the videos in `content/` (in a `frames` folder beside each video), so the site can show them as images and video posters. The video list and the points to capture are at the top of `extract_frames.py`. There is no ffmpeg here, so headless Chrome or Edge decodes the videos. Needs Python 3. |
| `Optimise-Images` | Makes the web images in `assets/img` from the originals in `content/`: WebP stills at 640, 1280 and 1920px wide, animated WebP files with a still poster for each GIF, transparent 64 and 128px company logos (from `content/Logos`) for the timeline dots, and a 1200 × 630 JPG link preview (`og:image`) for each page. The file lists are at the top of `optimise_images.py`. Needs Python 3 with Pillow. |
| `Capture-Devices` | Takes a screenshot of one or more pages at each standard device size, with headless Chrome or Edge. The images go to `screenshots\<page>\<device>.png`. Name the pages after the script, separated by spaces: `Capture-Devices.bat index.html projects\superhorse.html` (default: `index.html`). `-FullPage` also takes an 8000px tall image. |

- Run them in this order after you add media: `Extract-Frames` (for videos), `Optimise-Images`, then `Capture-Devices` to check the pages.
- `Capture-Devices` and `Extract-Frames` need Chrome or Edge installed in the usual folder.
- The device list in `Capture-Devices.ps1` matches the table in [docs/DeviceSupport.md](../docs/DeviceSupport.md#device-sizes). Change both together.
- To view the site locally, open `index.html` in a browser. YouTube videos only play inline from a web server: run `python -m http.server 8000` in the project folder and open `http://localhost:8000`.
