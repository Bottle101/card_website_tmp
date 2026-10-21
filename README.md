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
| `assets/js/main.js` | Lazy video loading, scroll-play, synced players and transport bars, segmented controls, chart toggles, wipe slider, galleries |
| `assets/js/data.js` | Tables that drive the interactive parts: hardware tasks and the paper-frame timestamps, extra replays, robot hands, gallery tiles, result sentences, hero montage labels |
| `assets/js/anchor.js` | The draggable contact-anchor / friction-cone demo |
| `assets/js/liquid-glass.js` | Chromium-only edge refraction for small glass controls |
| `assets/js/scene3d.js` | Interactive sim scenes (three.js from the CDN via the import map): drag to rotate, scroll to zoom, linked human/robot viewers |
| `assets/3d/` | The paper's sim panels as GLB meshes plus `scenes/<section>/*.json` (object, hand, anchors, the paper panel's view). Exported on the workstation from the figure scripts' own geometry by `_work/scripts/scene3d/export_web3d.py` and `web3d_bridge.py` (outputs in `output/web3d/` there); `_work/scripts/scene3d/build_scenes.py` writes the scene files; `SCENES` in `data.js` switches a clip from its paper render to 3D |
| `assets/video/hero/` | Hero montage: card deck, Rubik's cube and Wuji mustard grasp at about 8 s each, then tongs, marker and cup (34 s; `_work/scripts/hero_montage.py` builds it) |
| `assets/video/realworld/` | The six hardware tasks of the paper's real-world figure, cut from the original Figma videos |
| `assets/video/charts/` | Result charts rendered as short clips (`_work/charts/` has the generator) |
| `assets/video/drive/`, `far/`, `v2r/` | Clips from the group-meeting slides, the `far_intern` folder, and the video-to-robot renders |
| `assets/img/cut/` | Paper figures cut into parts for the interactive viewers (`_work/cutter/` has the scripts) |

## Before publishing

Search `index.html` for `TODO`:
- author names, affiliations and links (the paper is still in anonymized submission mode)
- Paper, arXiv and Code links (the buttons are disabled until then)
- the BibTeX author field
