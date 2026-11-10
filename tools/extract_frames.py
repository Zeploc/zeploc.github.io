"""Saves still frames from the videos in content/, so the site can show them as images and posters.

Each video in FRAMES gets one PNG for each point in its list. A point is a fraction of the video's
length (0.5 is the middle). The frames go to a "frames" folder beside the video, named after the
video and the frame number. Run tools/optimise_images.py afterwards to make the web images.

There is no ffmpeg on this machine, so headless Chrome or Edge decodes each video and takes a
screenshot of the frame. Needs Python 3 and Chrome or Edge in the usual folder.
"""

import os
import shutil
import struct
import subprocess
import tempfile
import uuid
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT = PROJECT_ROOT / 'content'
MAX_WIDTH = 1920

# Video (relative to content/), output name, and the points to capture as fractions of its length.
FRAMES = [
    ('Atlas (Taro)/Atlas-Restarting.mp4', 'atlas-restarting', (0.3,)),
    ('Atlas (Taro)/Screen Recording 2026-11-01 001720.mp4', 'atlas-demo', (0.4,)),
    ('Atlas (Taro)/Screen Recording 2026-11-01 165045.mp4', 'atlas-idle', (0.4,)),
    ('Radar/Screen Recording 2026-10-19 010639.mp4', 'radar-1', (0.5,)),
    ('Radar/Screen Recording 2026-10-19 190227.mp4', 'radar-2', (0.3,)),
    ('Radar/Screen Recording 2026-10-19 190506.mp4', 'radar-3', (0.5,)),
    ('Radar/Screen Recording 2026-10-19 202640.mp4', 'radar-4', (0.5,)),
    ('HTTYD/Early development/Screen Recording 2026-04-10 215218.mp4', 'early-1', (0.5,)),
    ('HTTYD/Early development/Screen Recording 2026-04-10 215342.mp4', 'early-2', (0.5,)),
    ('HTTYD/Early development/HTTYD-Flight1.mp4', 'flight-1', (0.5,)),
    ('HTTYD/Early development/HTTYD-Flight2-Turning.mp4', 'flight-2', (0.2, 0.6)),
    ('HTTYD/Blender animation/Screen Recording 2026-04-11 213903.mp4', 'blender-1', (0.5,)),
    ('HTTYD/Blender animation/Screen Recording 2026-04-11 213954.mp4', 'blender-2', (0.5,)),
    ('HTTYD/Blender animation/Screen Recording 2026-04-11 214953.mp4', 'blender-3', (0.5,)),
    ('HTTYD/Blender animation/Screen Recording 2026-04-11 220946.mp4', 'blender-4', (0.5,)),
    ('HTTYD/Animations in editor/Screen Recording 2026-04-12 000949.mp4', 'editor-1', (0.5,)),
    ('HTTYD/Animations in editor/Screen Recording 2026-04-12 173235.mp4', 'editor-2', (0.5,)),
    ('HTTYD/Flight tests with model/Screen Recording 2026-04-12 001130.mp4', 'flight-test', (0.5,)),
    ('HTTYD/Mountain range flying/HTTYD Mountain Range Flying.mp4', 'mountains', (0.12, 0.35, 0.55, 0.8)),
    ('SuperHorse/SuperHorse Menus and Gameplay.mp4', 'gameplay', (0.08, 0.3, 0.5, 0.7, 0.9)),
    ('Sky Engine/Sky Editor_ Sandbox_Project - Fence 2026-09-29 22-01-38.mp4', 'showcase', (0.1, 0.35, 0.6, 0.85)),
]


def mp4_boxes(file, start, end):
    position = start
    while position < end - 8:
        file.seek(position)
        size, kind = struct.unpack('>I4s', file.read(8))
        header = 8
        if size == 1:
            size = struct.unpack('>Q', file.read(8))[0]
            header = 16
        elif size == 0:
            size = end - position
        yield kind.decode('latin1'), position + header, position + size
        position += size


def mp4_size_and_length(path):
    """Width, height and length in seconds, read from the MP4 header."""
    width = height = length = None
    with open(path, 'rb') as file:
        for kind, start, end in mp4_boxes(file, 0, os.path.getsize(path)):
            if kind != 'moov':
                continue
            for inner, inner_start, inner_end in mp4_boxes(file, start, end):
                if inner == 'mvhd':
                    file.seek(inner_start)
                    version = file.read(1)[0]
                    file.seek(inner_start + (20 if version == 1 else 12))
                    scale = struct.unpack('>I', file.read(4))[0]
                    duration = struct.unpack('>Q' if version == 1 else '>I', file.read(8 if version == 1 else 4))[0]
                    length = duration / scale
                if inner == 'trak' and width is None:
                    for track, _, track_end in mp4_boxes(file, inner_start, inner_end):
                        if track == 'tkhd':
                            file.seek(track_end - 8)
                            track_width, track_height = struct.unpack('>II', file.read(8))
                            if track_width and track_height:
                                width, height = track_width >> 16, track_height >> 16
    return width, height, length


def find_browser():
    candidates = [
        Path(os.environ.get('ProgramFiles', '')) / 'Google/Chrome/Application/chrome.exe',
        Path(os.environ.get('ProgramFiles(x86)', '')) / 'Google/Chrome/Application/chrome.exe',
        Path(os.environ.get('LOCALAPPDATA', '')) / 'Google/Chrome/Application/chrome.exe',
        Path(os.environ.get('ProgramFiles(x86)', '')) / 'Microsoft/Edge/Application/msedge.exe',
        Path(os.environ.get('ProgramFiles', '')) / 'Microsoft/Edge/Application/msedge.exe',
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    raise SystemExit('Chrome or Edge not found.')


def capture(browser, video, output, seconds, width, height):
    work = Path(tempfile.mkdtemp(prefix='frames-'))
    page = work / 'frame.html'
    page.write_text(
        '<!doctype html><style>html,body{margin:0;background:#000;overflow:hidden}'
        f'video{{display:block;width:{width}px;height:{height}px;object-fit:contain}}</style>'
        f'<video id="v" muted preload="auto" src="{video.as_uri()}"></video>'
        f'<script>const v=document.getElementById("v");'
        f'v.addEventListener("loadedmetadata",()=>{{v.currentTime={seconds:.2f};}});</script>',
        encoding='utf-8')
    subprocess.run([
        browser, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
        '--allow-file-access-from-files', f'--user-data-dir={work / "profile"}',
        f'--window-size={width},{height}', '--virtual-time-budget=6000',
        f'--screenshot={output}', page.as_uri(),
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    shutil.rmtree(work, ignore_errors=True)


def main():
    browser = find_browser()
    for source, name, points in FRAMES:
        video = CONTENT / source
        width, height, length = mp4_size_and_length(video)
        scale = min(1, MAX_WIDTH / width)
        # Even sizes, because odd ones leave a one-pixel seam in some screenshots.
        width, height = round(width * scale / 2) * 2, round(height * scale / 2) * 2
        target = video.parent / 'frames'
        target.mkdir(exist_ok=True)
        for number, point in enumerate(points, start=1):
            output = target / f'{name}-{number}.png'
            capture(browser, video, output, min(length * point, length - 0.2), width, height)
            print(f'{output.relative_to(CONTENT)}  ({width}x{height}, {length * point:.1f} s)')


if __name__ == '__main__':
    main()
