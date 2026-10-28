# CARD project page

Static site, no build step. Open it through a local server (ES modules do not load from `file://`). From the `CARD_website` folder:

```
python3 -I _work/scripts/rangeserver.py website 8765
# http://localhost:8765/
```

It listens on 127.0.0.1 only, answers byte-range requests (Safari needs them for video) and sends `Cache-Control: no-cache`, so a reload picks up edits.

`index.html` and `main.js` load the CSS and JS with a `?v=` tag. Bump it in both files after changing CSS or JS, so browsers that cached an older copy (GitHub Pages caches for 10 minutes) fetch the new one.

To publish, push the contents of this folder to a GitHub Pages branch (or any static host).

## Layout

| Path | What |
|---|---|
| `index.html` | All page content and copy |
| `assets/css/site.css` | Design system: liquid glass (after eigendexplore.github.io), hero (after the in-hand-assembly page), sections, components |
| `assets/css/anchor.css` | Styles for the stage 4 cost widget (`.adx-*`) |
| `assets/js/main.js` | Lazy video loading, scroll-play, synced players and transport bars, segmented controls, chart toggles, wipe slider, galleries |
| `assets/js/data.js` | Tables that drive the interactive parts: hardware tasks with their human demonstrations and paper-frame timestamps, robot hands, gallery tiles, force-chart captions, the hero montage segments |
| `assets/js/anchor.js` | Stage 4 widget: a draggable fingertip pad over one contact anchor, the contact cost E_con as a landscape and a cost-vs-rotation curve, and an animated CEM run (16 iterations) |
| `assets/js/liquid-glass.js` | Chromium-only edge refraction for small glass controls |
| `assets/js/scene3d.js` | Interactive sim scenes (three.js from the CDN via the import map): drag to rotate, scroll to zoom, linked human/robot viewers |
| `assets/3d/` | The paper's sim panels as GLB meshes plus `scenes/<section>/*.json` (object, hand, anchors, the paper panel's view). Exported on the workstation from the figure scripts' own geometry by `_work/scripts/scene3d/export_web3d.py` and `web3d_bridge.py` (outputs in `output/web3d/` there); `_work/scripts/scene3d/build_scenes.py` writes the scene files; `SCENES` in `data.js` switches a clip from its paper render to 3D |
| `assets/video/hero/` | Hero montage: card deck, Rubik's cube and Wuji mustard grasp at about 8 s each, then tongs, marker and cup (34 s; `_work/scripts/hero_montage.py` builds it) |
| `assets/video/realworld/` | The six hardware tasks of the paper's real-world figure, cut from the original Figma videos |
| `assets/video/demos/` | Human demonstrations shown next to the hardware replays (cards, marker, cube: tactile glove; mustard: motion-capture render; cup: phone video), cut from `Media_1025/` |
| `assets/video/tactile/` | Tracker on/off pairs (hammer, cup, mustard, cards), cut by `_work/scripts/tactile_pairs.py` |
| `assets/video/tracker/` | Curved-surface tracking clips (barrel pushed by hand, arm moving along the barrel) |
| `assets/img/fig/` | Figures drawn for the page: `anchor_pad*.svg` (stage 2 finger pad), `tracker*.svg` (controller diagram), `unified_closeup.webp` (stage 2 close-up fallback). Generators in `_work/scripts/figs/` (`anchor_pad_svg.py` needs the KaTeX TTFs it names) |
| `assets/video/charts/` | Result charts rendered as short clips (`_work/charts/` has the generator) |
| `assets/video/drive/`, `far/` | Clips from the group-meeting slides and the `far_intern` folder |
| `assets/img/cut/` | Paper figures cut into parts for the interactive viewers (`_work/cutter/` has the scripts) |

## Before publishing

Search `index.html` for `TODO`: the Code button stays disabled until the code URL exists. Authors, the arXiv links and the BibTeX follow https://arxiv.org/abs/2610.36539.
