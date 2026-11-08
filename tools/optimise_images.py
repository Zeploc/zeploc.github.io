"""Makes the web images in assets/img from the original files in content/.

Each still image gets one WebP for each width in STILL_WIDTHS that is not wider than the original,
plus one at the original width if that is smaller than the largest step. Each GIF becomes an
animated WebP and a still poster from its first frame. Each page gets a 1200 x 630 JPG link
preview.

Run it after you add or change a file in content/ (and after tools/extract_frames.py for video
frames), then copy the printed sizes into the HTML. Needs Python 3 with Pillow (pip install pillow).
"""

from pathlib import Path

from PIL import Image, ImageSequence

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT = PROJECT_ROOT / 'content'
OUTPUT = PROJECT_ROOT / 'assets' / 'img'

STILL_WIDTHS = (640, 1280, 1920)
STILL_QUALITY = 80
ANIMATION_MAX_WIDTH = 800
ANIMATION_QUALITY = 70
# Ability clips show as small tiles, so they are smaller to keep the page light.
ABILITY_WIDTH = 520
MYTHOS = 'Mythos Party'
MYTHOS_EARLY = 'Mythos Party/Old Content (from uni)'
HTTYD = 'HTTYD'
NARRATIVE = 'Narrative System'

# Output folder, output name, source file (relative to content/), and optional widths.
STILLS = [
    ('about', 'headshot', 'Headshot.jpg', (400, 800)),
    # The YouTube thumbnail of the NZGDC talk, cropped to remove its black bars.
    ('talk', 'poster', 'Talk/talk-poster.png', (640, 720)),
    ('gameplay-flow', 'example', 'Gameplay Flow/GameplayFlowExample.png'),
    ('kyoryu', 'key-art', 'Kyoryu/Kyoryu-Sakuras-Fight.webp'),
    ('wanderer', 'key-art', 'Wanderer/Wanderer_KeyArt_16_9.png'),
    ('wanderer', 'canal', 'Wanderer/Wanderer_Canal.jpg'),
    ('wanderer', 'mayan', 'Wanderer/Wanderer_Mayan.jpg'),
    ('wanderer', 'moon', 'Wanderer/Wanderer_Moon.jpg'),
    ('wanderer', 'tesla', 'Wanderer/Wanderer_Tesla.jpg'),
    ('wanderer', 'underwater', 'Wanderer/Wanderer_Underwater.jpg'),
    ('wanderer', 'vb', 'Wanderer/Wanderer_VB.jpg'),
    ('wanderer', 'woodstock', 'Wanderer/Wanderer_Woodstock.jpg'),
    ('mythos-party', 'capsule-art', f'{MYTHOS}/Mythos_Party_Capsule_Art_Revised.png'),
    ('mythos-party', 'trailer-poster', f'{MYTHOS}/video-FwoVMOu09Bg.jpg', (640, 1280)),
    ('mythos-party', 'trailer-2019-poster', f'{MYTHOS}/video-eAPEBaGp2xk.jpg', (640, 1280)),
    ('mythos-party', 'pre-alpha-poster', f'{MYTHOS}/video-4_IFLiO7ObI.jpg', (640, 1280)),
    ('mythos-party', 'early-hud-1', f'{MYTHOS_EARLY}/Desktop Screenshot 2019.11.15 - 13.35.36.74.png'),
    ('mythos-party', 'early-hud-2', f'{MYTHOS_EARLY}/Desktop Screenshot 2019.11.15 - 13.36.39.49.png'),
    ('mythos-party', 'early-hud-3', f'{MYTHOS_EARLY}/Desktop Screenshot 2019.11.15 - 13.39.51.75.png'),
] + [
    ('mythos-party', f'gameplay-{number}', f'{MYTHOS}/alex-coultas-highresscreenshot{number}.jpg')
    for number in ('00003', '00004', '00007', '00010', '00013', '00015', '00018')
] + [
    ('mythos-party', f'early-{number}', f'{MYTHOS_EARLY}/HighresScreenshot{number}.png')
    for number in ('00008', '00025', '00029', '00031', '00032', '00033', '00034', '00035', '00036', '00037')
] + [
    ('superhorse', 'splash', 'SuperHorse/SuperHorse_Splash.jpg'),
] + [
    ('superhorse', f'blockout-{number}', f'SuperHorse/HighresScreenshot{number}.png')
    for number in ('00002', '00014', '00017', '00024', '00029', '00033')
] + [
    ('superhorse', f'gameplay-{number}', f'SuperHorse/frames/gameplay-{number}.png') for number in range(1, 6)
] + [
    ('kinetic', 'splash', 'Kinetic/Kinetic_Splash.png'),
    ('httyd', 'early-1', f'{HTTYD}/Early development/frames/early-1-1.png'),
    ('httyd', 'early-2', f'{HTTYD}/Early development/frames/early-2-1.png'),
    ('httyd', 'flight-1', f'{HTTYD}/Early development/frames/flight-1-1.png'),
    ('httyd', 'flight-2', f'{HTTYD}/Early development/frames/flight-2-1.png'),
    ('httyd', 'flight-3', f'{HTTYD}/Early development/frames/flight-2-2.png'),
    ('httyd', 'blender-1', f'{HTTYD}/Blender animation/frames/blender-1-1.png'),
    ('httyd', 'blender-2', f'{HTTYD}/Blender animation/frames/blender-2-1.png'),
    ('httyd', 'blender-3', f'{HTTYD}/Blender animation/frames/blender-3-1.png'),
    ('httyd', 'blender-4', f'{HTTYD}/Blender animation/frames/blender-4-1.png'),
    ('httyd', 'editor-1', f'{HTTYD}/Animations in editor/frames/editor-1-1.png'),
    ('httyd', 'editor-2', f'{HTTYD}/Animations in editor/frames/editor-2-1.png'),
    ('httyd', 'flight-test', f'{HTTYD}/Flight tests with model/frames/flight-test-1.png'),
] + [
    ('httyd', f'mountains-{number}', f'{HTTYD}/Mountain range flying/frames/mountains-{number}.png')
    for number in range(1, 5)
] + [
    ('sky-engine', 'editor', 'Sky Engine/Sky Engine - Editor.png'),
    ('sky-engine', 'custom-meshes', 'Sky Engine/Sky Engine - First custom meshes.png'),
    ('sky-engine', 'mesh-editing', 'Sky Engine/Sky Engine - Mesh Editing.png'),
    ('sky-engine', 'engine-structure', 'Sky Engine/Sky Engine - Engine Structure Overview.png'),
    ('sky-engine', 'editor-structure', 'Sky Engine/Sky Engine - Editor Structure Overview.png'),
] + [
    ('sky-engine', f'showcase-{number}', f'Sky Engine/frames/showcase-{number}.png') for number in range(1, 5)
] + [
    ('atlas', 'restarting', 'Atlas (Taro)/frames/atlas-restarting-1.png'),
    ('atlas', 'demo', 'Atlas (Taro)/frames/atlas-demo-1.png'),
    ('atlas', 'idle', 'Atlas (Taro)/frames/atlas-idle-1.png'),
] + [
    ('radar', f'simulator-{number}', f'Radar/frames/radar-{number}-1.png', (640, 1280)) for number in range(1, 5)
] + [
    ('radar', 'display-screens', 'Radar/Docs/display-screens.png', (640, 1280)),
    ('radar', 'clock-faces', 'Radar/Docs/clock-faces.png', (640, 1028)),
    ('radar', 'web-ui', 'Radar/Docs/web-ui-main-tabs.png', (640, 1280)),
    ('radar', 'first-run-setup', 'Radar/Docs/first-run-setup.png', (640, 1280)),
] + [
    ('narrative-system', name, f'{NARRATIVE}/{name}.png') for name in (
        'plan', 'early-graph', 'node-design', 'edge-labels', 'early-details', 'custom-nodes', 'node-data-asset',
        'progress-notes', 'code-active-quest', 'code-branch-indexes', 'toolbar', 'edit-node', 'overall-graph',
        'side-quests', 'start-quests-wip', 'start-quests-linked', 'side-quest-linked', 'progress-nodes-details')
]

ANIMATIONS = [
    ('mythos-party', 'ability-ares', f'{MYTHOS}/ARESwithparticlewEAS.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-artemis', f'{MYTHOS}/ArtemisNewhegsss.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-bubble-bomb', f'{MYTHOS}/BubbleBombThin!.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-link', f'{MYTHOS}/DogCollar3.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-geyser', f'{MYTHOS}/GyserVFX.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-hercules', f'{MYTHOS}/HerculesDoneF.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-home-run', f'{MYTHOS}/HomeRun.gif', ABILITY_WIDTH),
    ('mythos-party', 'ability-nyx', f'{MYTHOS}/NyxApbea.gif', ABILITY_WIDTH),
    ('mythos-party', 'peaceful-day', f'{MYTHOS}/PeacefuldayVol2smol.gif'),
]

# Square company and school logos for the timeline dots. They keep their transparency.
# The Boundary's is not here: assets/img/logos/the-boundary.svg is drawn by hand from its wordmark.
LOGO_WIDTHS = (64, 128)
LOGOS = [
    ('floating-rock', 'Logos/floating-rock.png'),
    ('mighty-eyes', 'Logos/mighty-eyes.jpg'),
    ('buildmedia', 'Logos/buildmedia.png'),
    ('skyward-studios', 'Logos/skyward-studios.png'),
    ('media-design-school', 'Logos/media-design-school.png'),
]

# Link preview images (og:image), one per page. JPG, because some sites do not show WebP previews.
PREVIEW_SIZE = (1200, 630)
PREVIEW_QUALITY = 85
PREVIEWS = [
    ('home', 'Wanderer/Wanderer_KeyArt_16_9.png'),
    ('kyoryu', 'Kyoryu/Kyoryu-Sakuras-Fight.webp'),
    ('wanderer', 'Wanderer/Wanderer_KeyArt_16_9.png'),
    ('mythos-party', f'{MYTHOS}/Mythos_Party_Capsule_Art_Revised.png'),
    ('superhorse', 'SuperHorse/SuperHorse_Splash.jpg'),
    ('httyd', f'{HTTYD}/Mountain range flying/frames/mountains-2.png'),
    ('kinetic', 'Kinetic/Kinetic_Splash.png'),
    ('sky-engine', 'Sky Engine/Sky Engine - Editor.png'),
    ('atlas', 'Atlas (Taro)/frames/atlas-restarting-1.png'),
    ('radar', 'Radar/Docs/display-screens.png'),
    ('narrative-system', f'{NARRATIVE}/custom-nodes.png'),
]

def resized(image, width):
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS)


def covered(image, size):
    """The image scaled to cover the size and cropped to its centre."""
    target_width, target_height = size
    scale = max(target_width / image.width, target_height / image.height)
    scaled = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left = (scaled.width - target_width) // 2
    top = (scaled.height - target_height) // 2
    return scaled.crop((left, top, left + target_width, top + target_height))


def save_still(folder, name, source, step_widths=STILL_WIDTHS):
    image = Image.open(CONTENT / source).convert('RGB')
    widths = [width for width in step_widths if width < image.width]
    widths.append(min(image.width, step_widths[-1]))
    widths = sorted(set(widths))

    target = OUTPUT / folder
    target.mkdir(parents=True, exist_ok=True)
    for width in widths:
        resized(image, width).save(target / f'{name}-{width}.webp', 'WEBP', quality=STILL_QUALITY, method=6)
    largest = resized(image, widths[-1])
    print(f'{folder}/{name}: widths {widths}, largest {largest.width}x{largest.height}')


def save_animation(folder, name, source, max_width=ANIMATION_MAX_WIDTH):
    animation = Image.open(CONTENT / source)
    width = min(animation.width, max_width)
    frames, durations = [], []
    for frame in ImageSequence.Iterator(animation):
        durations.append(frame.info.get('duration', 70))
        frames.append(resized(frame.convert('RGB'), width))

    target = OUTPUT / folder
    target.mkdir(parents=True, exist_ok=True)
    output = target / f'{name}.webp'
    frames[0].save(output, 'WEBP', save_all=True, append_images=frames[1:], duration=durations,
                   loop=0, quality=ANIMATION_QUALITY, method=4)
    frames[0].save(target / f'{name}-poster.webp', 'WEBP', quality=STILL_QUALITY, method=6)
    size_mb = output.stat().st_size / 1_000_000
    print(f'{folder}/{name}: {frames[0].width}x{frames[0].height}, {len(frames)} frames, {size_mb:.1f} MB')


def save_logo(name, source):
    image = Image.open(CONTENT / source).convert('RGBA')
    target = OUTPUT / 'logos'
    target.mkdir(parents=True, exist_ok=True)
    for width in LOGO_WIDTHS:
        image.resize((width, width), Image.LANCZOS).save(
            target / f'{name}-{width}.webp', 'WEBP', quality=90, method=6)
    print(f'logos/{name}: widths {list(LOGO_WIDTHS)}')


def save_preview(name, source):
    image = Image.open(CONTENT / source)
    image.seek(0)
    target = OUTPUT / 'previews'
    target.mkdir(parents=True, exist_ok=True)
    covered(image.convert('RGB'), PREVIEW_SIZE).save(
        target / f'{name}.jpg', 'JPEG', quality=PREVIEW_QUALITY, optimize=True, progressive=True)
    print(f'previews/{name}.jpg')


def main():
    for still in STILLS:
        save_still(*still)
    for animation in ANIMATIONS:
        save_animation(*animation)
    for logo in LOGOS:
        save_logo(*logo)
    for name, source in PREVIEWS:
        save_preview(name, source)


if __name__ == '__main__':
    main()
