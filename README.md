# CARD project page

Static site, no build step. Open it through a local server (ES modules do not load from `file://`):

```
cd website
python3 -m http.server 8765
# http://localhost:8765/
```

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
| `assets/video/hero/` | Hero montage (six real-world tasks, 19 s) |
| `assets/video/realworld/` | The six hardware tasks of the paper's real-world figure, cut from the original Figma videos |
| `assets/video/charts/` | Result charts rendered as short clips (`_work/charts/` has the generator) |
| `assets/video/drive/`, `far/`, `v2r/` | Clips from the group-meeting slides, the `far_intern` folder, and the video-to-robot renders |
| `assets/img/cut/` | Paper figures cut into parts for the interactive viewers (`_work/cutter/` has the scripts) |

## Before publishing

Search `index.html` for `TODO`:
- author names, affiliations and links (the paper is still in anonymized submission mode)
- Paper, arXiv and Code links (the buttons are disabled until then)
- the BibTeX author field
