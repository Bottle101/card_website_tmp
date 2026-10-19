// CARD project page. Plain ES modules, no build step.
import { glassify, initSeg } from './liquid-glass.js';
import { initAnchorDemo } from './anchor.js';
import { TASKS, MORE, HANDS, TILES, FIDELITY, HERO_SEGMENTS, V2R_AR } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const fmt = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; };

/* ------------------------------------------------------------------ lazy video sources */
function ensureSrc(v) {
  if (v.dataset.poster && !v.getAttribute('poster')) v.poster = v.dataset.poster;
  if (v.dataset.src && v.getAttribute('src') !== v.dataset.src) { v.src = v.dataset.src; v.load(); }
}
const near = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const v = e.target; near.unobserve(v);
  if (v.dataset.poster && !v.getAttribute('poster')) v.poster = v.dataset.poster;
  ensureSrc(v);
}), { rootMargin: '700px 0px' });

// loops that play while visible
const inview = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && e.intersectionRatio >= .3 && !reduced) { ensureSrc(v); v.play().catch(() => {}); }
  else v.pause();
}), { threshold: [0, .3, .6] });

// chart clips: play once on entry, hold the last frame, restart on the next entry
const charts = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && e.intersectionRatio >= .55) {
    if (!v._shown) { v._shown = true; playChart(v); }
  } else if (!e.isIntersecting) v._shown = false;
}), { threshold: [0, .55] });
function playChart(v) {
  ensureSrc(v);
  if (reduced) { v.addEventListener('loadedmetadata', () => { v.currentTime = Math.max(0, v.duration - .05); }, { once: true }); return; }
  try { v.currentTime = 0; } catch (_) {}
  v.play().catch(() => {});
}
function setChart(v, src) {
  const poster = src.replace(/\.mp4$/, '.jpg');
  v.poster = poster; v.dataset.src = src; v.src = src; v.load();
  if (reduced) { v.addEventListener('loadedmetadata', () => { v.currentTime = Math.max(0, v.duration - .05); }, { once: true }); }
  else v.play().catch(() => {});
}

function initVideos() {
  // defer posters too: keep the attribute only for the hero
  $$('main video[poster]').forEach(v => { v.dataset.poster = v.getAttribute('poster'); v.removeAttribute('poster'); });
  $$('video[data-src]').forEach(v => near.observe(v));
  $$('video.inview').forEach(v => inview.observe(v));
  $$('video.chart').forEach(v => charts.observe(v));
  $$('.chart-card .replay').forEach(b => b.addEventListener('click', () => playChart(b.parentElement.querySelector('video'))));
  document.addEventListener('visibilitychange', () => { if (document.hidden) $$('video').forEach(v => v.pause()); });
}

/* ------------------------------------------------------------------ hero background */
function initHero() {
  const v = $('#hero-video'), hero = $('.hero'), btn = $('.hero-toggle'), label = $('#hero-label');
  if (!v) return;
  let visible = true, userPaused = false, attached = false, asked = false;
  const can = () => ((!reduced && !saveData) || asked) && visible && !document.hidden && !userPaused;
  const sync = () => {
    if (can()) {
      if (!attached) { v.src = v.dataset.video; attached = true; }
      v.play().then(() => { btn.hidden = false; }).catch(() => { btn.hidden = false; btn.classList.add('paused'); });
    } else v.pause();
  };
  v.addEventListener('playing', () => v.classList.add('is-playing'));
  v.addEventListener('error', () => { btn.hidden = true; });
  btn.addEventListener('click', () => {
    userPaused = !userPaused; if (!userPaused) asked = true; btn.classList.toggle('paused', userPaused);
    btn.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
    sync();
  });
  new IntersectionObserver(es => { visible = es[0].intersectionRatio >= .1; sync(); }, { threshold: [0, .1] }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  if (reduced || saveData) { btn.hidden = false; btn.classList.add('paused'); userPaused = true; btn.setAttribute('aria-label', 'Play background video'); }

  // which task is on screen: a small tag that follows the montage
  if (label && HERO_SEGMENTS.length) {
    let last = -1;
    const tick = () => {
      const t = v.currentTime; let i = HERO_SEGMENTS.findIndex(s => t >= s.t0 && t < s.t1);
      if (i < 0) i = 0;
      if (i !== last) { last = i; label.textContent = HERO_SEGMENTS[i].label; }
    };
    label.textContent = HERO_SEGMENTS[0].label;
    v.addEventListener('timeupdate', tick);
  }
}

/* ------------------------------------------------------------------ sticky nav + scroll spy */
function initNav() {
  const nav = $('#topnav'), hero = $('.hero');
  new IntersectionObserver(es => nav.classList.toggle('show', !es[0].isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
  const links = $$('nav a', nav), ids = links.map(a => a.getAttribute('href').slice(1));
  const secs = ids.map(id => document.getElementById(id)).filter(Boolean);
  const tones = $$('main > section, main > .bleed');
  const spy = () => {
    const y = innerHeight * .3; let cur = null;
    for (const s of secs) if (s.getBoundingClientRect().top <= y) cur = s.id;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) cur = secs.at(-1).id;
    links.forEach(a => {
      const on = a.getAttribute('href') === `#${cur}`;
      if (on && !a.classList.contains('active') && innerWidth < 760) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      a.classList.toggle('active', on);
    });
    // match the bar to whatever sits under it
    const under = tones.find(el => { const r = el.getBoundingClientRect(); return r.top <= 58 && r.bottom > 58; });
    let dark = false;
    if (under) {
      const r = under.getBoundingClientRect(), past = (58 - r.top) / r.height > .5;
      dark = under.classList.contains('dark') || (under.classList.contains('l2d') && past) || (under.classList.contains('d2l') && !past);
    }
    nav.classList.toggle('on-dark', dark);
  };
  addEventListener('scroll', spy, { passive: true }); spy();
}

function initReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

/* ------------------------------------------------------------------ transport bar (one or many synced videos) */
class Transport {
  constructor(bar, videos, { ticks = [], loop = true, onTime } = {}) {
    this.bar = bar; this.vids = videos; this.loop = loop; this.onTime = onTime;
    this.pp = $('.pp', bar); this.scrub = $('.scrub', bar); this.fill = $('.fill', bar); this.knob = $('.knob', bar); this.clock = $('.clock', bar);
    this.dragging = false; this.raf = 0;
    this.pp.addEventListener('click', () => (this.master.paused ? this.play() : this.pause()));
    this.vids.forEach(v => v.addEventListener('seeked', () => { v._seeking = false; if (v._pending != null) { const t = v._pending; v._pending = null; this.seekV(v, t); } }));
    this.bindScrub(); this.setTicks(ticks);
    this.master.addEventListener('ended', () => { if (this.loop) { this.seek(0); this.play(); } else this.render(); });
    this.vids.forEach(v => v.addEventListener('loadedmetadata', () => this.render()));
  }
  get master() { return this.vids[0]; }
  setVideos(vids, ticks = []) { this.vids = vids; this.setTicks(ticks); this.render(); }
  setTicks(ticks) {
    const box = $('.ticks', this.bar); box.innerHTML = ''; this.ticks = ticks;
    ticks.forEach(t => { const s = document.createElement('span'); s.className = 'tick' + (t.l ? ' lbl' : ''); if (t.l) s.dataset.l = t.l; s.dataset.t = t.t; box.append(s); });
    this.placeTicks();
  }
  placeTicks() {
    const d = this.master.duration;
    $$('.tick', this.bar).forEach(s => { s.style.left = `${d ? (+s.dataset.t / d) * 100 : 0}%`; s.style.opacity = d ? 1 : 0; });
  }
  play() { this.vids.forEach(v => { ensureSrc(v); v.play().catch(() => {}); }); this.bar.classList.add('playing'); this.loopRaf(); }
  pause() { this.vids.forEach(v => v.pause()); this.bar.classList.remove('playing'); }
  seekV(v, t) { if (v._seeking) { v._pending = t; return; } v._seeking = true; try { v.currentTime = t; } catch (_) { v._seeking = false; } }
  seek(t) { this.vids.forEach(v => this.seekV(v, Math.min(t, (v.duration || t) - .03))); this.render(t); }
  loopRaf() {
    cancelAnimationFrame(this.raf);
    const step = () => {
      const m = this.master, t = m.currentTime;
      for (let i = 1; i < this.vids.length; i++) {          // followers chase the master clock
        const v = this.vids[i]; if (v.readyState < 2) continue;
        const drift = t - v.currentTime;
        if (Math.abs(drift) > .3) this.seekV(v, t);
        else { const r = Math.min(4, Math.max(.25, 1 + Math.max(-.3, Math.min(.3, drift * 1.6)))); if (Math.abs(v.playbackRate - r) > .02) v.playbackRate = r; }
        if (m.paused && !v.paused) v.pause();
      }
      this.render();
      if (!m.paused) this.raf = requestAnimationFrame(step); else this.bar.classList.remove('playing');
    };
    this.raf = requestAnimationFrame(step);
  }
  render(tOverride) {
    const m = this.master, d = m.duration || 0, t = tOverride ?? m.currentTime;
    const p = d ? Math.min(1, t / d) : 0;
    this.fill.style.width = `${p * 100}%`; this.knob.style.left = `${p * 100}%`;
    this.clock.textContent = `${fmt(t)} / ${fmt(d)}`;
    this.scrub.setAttribute('aria-valuenow', Math.round(p * 100)); this.scrub.setAttribute('aria-valuetext', this.clock.textContent);
    if (this.ticks.length) this.placeTicks();
    this.onTime?.(t);
  }
  bindScrub() {
    const at = e => { const r = this.scrub.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (this.master.duration || 0); };
    this.scrub.addEventListener('pointerdown', e => { this.dragging = true; this.wasPlaying = !this.master.paused; this.pause(); this.scrub.setPointerCapture(e.pointerId); this.seek(at(e)); });
    this.scrub.addEventListener('pointermove', e => { if (this.dragging) this.seek(at(e)); });
    const up = () => { if (!this.dragging) return; this.dragging = false; if (this.wasPlaying) this.play(); };
    this.scrub.addEventListener('pointerup', up); this.scrub.addEventListener('pointercancel', up);
    this.scrub.addEventListener('keydown', e => {
      const d = this.master.duration || 0; if (!d) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); this.seek(Math.min(d, Math.max(0, this.master.currentTime + (e.key === 'ArrowRight' ? 1 : -1)))); }
      if (e.key === ' ') { e.preventDefault(); this.master.paused ? this.play() : this.pause(); }
    });
  }
}
function transportBar() {
  const bar = document.createElement('div'); bar.className = 'transport glass';
  bar.innerHTML = `<button class="pp" type="button" aria-label="Play or pause"><svg class="i-play" aria-hidden="true"><use href="#i-play"/></svg><svg class="i-pause" aria-hidden="true"><use href="#i-pause"/></svg></button>
    <div class="scrub" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="track"><div class="fill"></div></div><div class="ticks"></div><span class="knob"></span></div>
    <span class="clock">0:00 / 0:00</span>`;
  return bar;
}
// play a transport while its stage is mostly on screen, pause when it leaves
function engage(stage, tr) {
  let user = false;
  tr.pp.addEventListener('click', () => { user = true; });
  new IntersectionObserver(es => {
    const r = es[0].intersectionRatio;
    if (r >= .6 && !reduced && !user) tr.play();
    else if (r < .3) { tr.pause(); user = false; }
  }, { threshold: [0, .3, .6] }).observe(stage);
}
function initSynced() {
  $$('[data-sync]').forEach(p => {
    const vids = $$('video', p); const bar = transportBar(); p.append(bar);
    vids.forEach(v => near.observe(v));
    const tr = new Transport(bar, vids); p._tr = tr; engage(p, tr);
  });
}

/* ------------------------------------------------------------------ segmented controls */
function segs() {
  $$('.seg').forEach(s => { if (!s._init) { s._init = true; initSeg(s, b => s.dispatchEvent(new CustomEvent('pick', { detail: b }))); } });
}
const pressed = seg => $('button[aria-pressed="true"]', seg);

/* ------------------------------------------------------------------ baselines viewer */
const METHOD_NAMES = { card: 'CARD', dexpilot: 'DexPilot', anyteleopk: 'AnyTeleop-K', fingertipik: 'Fingertip IK', init: 'Geometric initialization' };
const METHOD_NOTES = {
  card: 'Two video clips retargeted to the SHARPA Wave. Orange spheres are the contact anchors taken from the human hand; the object is drawn only for reference.',
  dexpilot: 'DexPilot matches fingertip vectors. It reaches the object but not the contact.',
  anyteleopk: 'AnyTeleop with its key-vector objective. It also reaches the object but not the contact.',
  fingertipik: 'Inverse kinematics on fingertip positions, shown in the paper\'s figure but not in the results table. The pads miss the anchors.',
  init: 'CARD stopped after its closed-form initializer: closer than every kinematic baseline, but the last millimeters are missing.',
};
function initBaselines() {
  const root = $('#baselines'); if (!root) return;
  $$('.cmp-card', root).forEach(card => {
    const clip = card.dataset.clip, holder = $('.robot', card);
    holder.innerHTML = Object.keys(METHOD_NAMES).map((m, i) =>
      `<img class="${i === 0 ? 'base on' : ''}" data-m="${m}" src="assets/img/cut/baselines/${clip}_${m}.webp" alt="${METHOD_NAMES[m]} on the ${clip}" loading="lazy">`).join('')
      + `<span class="lbl glass-tag ours m-tag">CARD</span>`;
  });
  $('#base-ctl .seg').addEventListener('pick', e => {
    const m = e.detail.dataset.m;
    $$('.cmp-card', root).forEach(card => {
      $$('.robot img', card).forEach(img => img.classList.toggle('on', img.dataset.m === m));
      const tag = $('.m-tag', card); tag.textContent = METHOD_NAMES[m]; tag.className = `lbl glass-tag m-tag ${m === 'card' ? 'ours' : 'kin'}`;
      $('.m-name', card).textContent = METHOD_NAMES[m];
    });
    $('#base-cap').textContent = METHOD_NOTES[m];
  });
}

/* ------------------------------------------------------------------ sources: tabs + tiles */
function initSources() {
  const seg = $('[data-tabs="src"]'), set = $('[data-panels="src"]');
  seg.addEventListener('pick', e => {
    const k = e.detail.dataset.tab;
    $$('[data-panel]', set).forEach(p => {
      const on = p.dataset.panel === k; p.classList.toggle('on', on);
      $$('video', p).forEach(v => { if (on) { ensureSrc(v); if (!reduced) v.play().catch(() => {}); } else v.pause(); });
    });
  });
  $$('[data-tiles]').forEach(box => {
    const list = TILES[box.dataset.tiles] || [];
    box.innerHTML = list.map(t => `<button class="tile" type="button" aria-label="${t.label}: show contact">
      <img src="${t.frame}" alt="${t.label}, source frame" loading="lazy"><img class="contact" src="${t.contact}" alt="${t.label}, contact on the MANO hand" loading="lazy">
      <span class="glass-tag plain">${t.label}</span></button>`).join('');
    $$('.tile', box).forEach(b => b.addEventListener('click', () => b.classList.toggle('flip')));
  });
}

/* ------------------------------------------------------------------ chart toggles */
function initCharts() {
  $$('[data-chart]').forEach(seg => {
    const g = seg.dataset.chart, v = $(`video[data-group="${g}"]`);
    seg.addEventListener('pick', e => {
      setChart(v, `assets/video/charts/${g === 'force' ? 'force' : g}_${e.detail.dataset.v}.mp4`);
      const txt = FIDELITY.text[g]?.[e.detail.dataset.v]; const el = $(`#${g}-text`);
      if (txt && el) el.innerHTML = `<p>${txt}</p>`;
    });
  });

  // contact fidelity: test bed x metric
  const ctl = $('#fid-ctl'); if (!ctl) return;
  const bedSeg = $('[data-k="bed"]', ctl), metSeg = $('[data-k="metric"]', ctl), v = $('#fid-video'), text = $('#fid-text');
  const update = (play = true) => {
    const bed = pressed(bedSeg).dataset.v; let met = pressed(metSeg).dataset.v;
    const penBtn = $('button[data-v="pen"]', metSeg); penBtn.disabled = bed !== 'grab';
    if (bed !== 'grab' && met === 'pen') { $('button[data-v="contact"]', metSeg).click(); return; }
    text.innerHTML = FIDELITY.sentence(bed, met);
    if (play) setChart(v, `assets/video/charts/fidelity_${bed}_${met}.mp4`);
  };
  bedSeg.addEventListener('pick', () => update()); metSeg.addEventListener('pick', () => update());
  update(false);
}

/* ------------------------------------------------------------------ wipe compare */
function initWipe() {
  const w = $('#wipe'); if (!w) return;
  const input = $('input', w), under = $('img.under', w), top = $('.top img', w);
  const set = x => w.style.setProperty('--x', `${x}%`);
  input.addEventListener('input', () => set(input.value));
  w.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons === 0) return; const r = w.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 100; input.value = x; set(x); });
  $('#wipe-ctl').addEventListener('pick', e => {
    const c = e.detail.dataset.c;
    under.src = `assets/img/cut/init/${c}_init.webp`; top.src = `assets/img/cut/init/${c}_card.webp`;
    under.alt = `Geometric initialization on the ${c}`; top.alt = `CARD solution on the ${c}`;
  });
  // a short sweep the first time it scrolls into view, so it reads as draggable
  if (!reduced) new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 1600); const x = 50 + 28 * Math.sin(k * Math.PI * 2) * (1 - k); set(x); input.value = x; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { threshold: .6 }).observe(w);
}

/* ------------------------------------------------------------------ video to robot (synced 2-up, swappable) */
function initV2R() {
  const p = $('#v2r'); if (!p) return;
  $('#v2r-ctl').addEventListener('pick', e => {
    const k = e.detail.dataset.v, [a, b] = $$('video', p);
    p.style.setProperty('--ar', V2R_AR[k]);
    [[a, 'human'], [b, 'robot']].forEach(([v, s]) => { v.dataset.src = `assets/video/v2r/${k}_${s}.mp4`; v.poster = `assets/video/v2r/${k}_${s}.jpg`; ensureSrc(v); });
    p._tr.seek(0); if (!reduced) p._tr.play();
  });
}

/* ------------------------------------------------------------------ hardware gallery */
function initHardware() {
  const list = $('#hw-list'), v = $('#hw-video'), demo = $('#hw-demo'), demoCard = $('#hw-demo-card'), frames = $('#hw-frames');
  if (!list) return;
  list.innerHTML = TASKS.map((t, i) => `<button type="button" aria-pressed="${i === 0}" data-i="${i}"><img src="${t.thumb}" alt="" loading="lazy"><span><b>${t.name}</b>${t.hand}</span></button>`).join('');
  const tr = new Transport($('#hw-transport'), [v], { onTime: t => {
    $$('button', frames).forEach(b => b.classList.toggle('near', Math.abs(+b.dataset.t - t) < .6));
  } });
  let cur = -1;
  const pick = (i, autoplay = true) => {
    if (i === cur) return; cur = i; const t = TASKS[i];
    $$('button', list).forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === i));
    if (autoplay) v.poster = t.poster; else { v.removeAttribute('poster'); v.dataset.poster = t.poster; }
    v.dataset.src = t.video; v.setAttribute('aria-label', `${t.hand} replaying: ${t.name}`);
    $('#hw-tag').textContent = t.hand;
    frames.innerHTML = t.frames.map((s, k) => `<button type="button" data-t="${s.t}" aria-label="Jump to frame ${k + 1} at ${s.t.toFixed(1)} s"><img src="${s.img}" alt="" loading="lazy"><span>${fmt(s.t)}</span></button>`).join('');
    $$('button', frames).forEach(b => b.addEventListener('click', () => { ensureSrc(v); tr.seek(+b.dataset.t); }));
    tr.setTicks(t.frames.map((s, k) => ({ t: s.t })));
    if (autoplay) ensureSrc(v); else near.observe(v);
    if (t.demo) { demoCard.hidden = false; demo.removeAttribute('poster'); demo.dataset.poster = t.demo.replace(/\.mp4$/, '.jpg'); demo.dataset.src = t.demo; if (autoplay) { ensureSrc(demo); if (!reduced) demo.play().catch(() => {}); } }
    else { demoCard.hidden = true; demo.pause(); }
    $('#hw-desc').innerHTML = t.desc;
    if (autoplay && !reduced) tr.play(); else tr.render(0);
  };
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.i); });
  pick(0, false);
  inview.observe(demo);
  engage($('#hw'), tr);
}

/* ------------------------------------------------------------------ tracker on/off */
function initOnOff() {
  const box = $('#onoff'); if (!box) return;
  const RES = { hammer: ['Held', 'Slipped'], cup: ['Held', 'Slipped'], mustard: ['Dispensed', 'Nothing comes out'] };
  const NOUN = { hammer: 'hammer', cup: 'cup', mustard: 'mustard bottle' };
  $('#onoff-ctl').addEventListener('pick', e => {
    const t = e.detail.dataset.t;
    ['on', 'off'].forEach((s, k) => {
      const card = $(`[data-side="${s}"]`, box), img = $('img', card);
      img.src = `assets/img/cut/tactile/${t}_${s}.webp`;
      img.alt = s === 'on' ? `With the tactile tracker: ${NOUN[t]}, ${RES[t][0].toLowerCase()}` : `Position replay only: ${NOUN[t]}, ${RES[t][1].toLowerCase()}`;
      $('.res', card).textContent = RES[t][k];
    });
  });
}

/* ------------------------------------------------------------------ more replays */
function initMore() {
  const nav = $('#more-nav'), v = $('#more-video'); if (!nav) return;
  nav.innerHTML = MORE.map((m, i) => `<button type="button" aria-pressed="${i === 0}" data-i="${i}"><img src="${m.poster}" alt="" loading="lazy">${m.name}</button>`).join('');
  const pick = (i, play = true) => {
    const m = MORE[i]; $$('button', nav).forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === i));
    if (play) v.poster = m.poster; else { v.removeAttribute('poster'); v.dataset.poster = m.poster; }
    v.dataset.src = m.video; v.setAttribute('aria-label', m.name); $('#more-tag').textContent = m.tag;
    if (play) { ensureSrc(v); if (!reduced) v.play().catch(() => {}); }
  };
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.i); });
  pick(0, false);
  inview.observe(v);
}

/* ------------------------------------------------------------------ embodiments */
function initEmbodiments() {
  const emb = $('#emb'); if (!emb) return;
  const keys = Object.keys(HANDS);
  $$('.emb-card', emb).forEach(card => {
    const d = card.dataset.demo;
    $('[data-role="human"]', card).src = `assets/img/cut/crossemb/${d}_human.webp`;
    $('[data-role="robot"]', card).innerHTML = keys.map((h, i) => `<img class="${i === 0 ? 'on' : ''}" data-h="${h}" src="assets/img/cut/crossemb/${d}_${h}.webp" alt="${HANDS[h].name} retargeted grasp on the ${d}" loading="lazy">`).join('');
  });
  $('#emb-map').innerHTML = keys.map((h, i) => `<img class="${i === 0 ? 'on' : ''}" data-h="${h}" src="${HANDS[h].map}" alt="Semantic map from human hand regions to ${HANDS[h].name}" loading="lazy">`).join('');
  const real = $('#emb-real');
  const pick = h => {
    const H = HANDS[h];
    $$('[data-h]', emb).forEach(img => img.classList.toggle('on', img.dataset.h === h));
    $$('.h-name', emb).forEach(c => { c.textContent = H.name; });
    $$('#emb-map img').forEach(img => img.classList.toggle('on', img.dataset.h === h));
    $('#emb-note').innerHTML = H.note;
    const old = $('video', real); if (old) old.pause();
    real.innerHTML = H.real
      ? `<div class="media-card"><video muted loop playsinline preload="none" data-src="${H.real.video}" data-poster="${H.real.video.replace(/\.mp4$/, '.jpg')}" aria-label="${H.real.label}"></video><div class="tags"><span class="glass-tag ours">${H.name}</span></div><div class="tags br"><span class="glass-tag plain">${H.real.label}</span></div></div>`
      : `<figure class="still" style="margin:0"><img src="assets/img/cut/crossemb/cube_gripper.webp" alt="Parallel-jaw gripper retargeted onto the cube demonstration" loading="lazy"><p>No hardware replay for the gripper; its results are retargeting only.</p></figure>`;
    const nv = $('video', real); if (nv) inview.observe(nv);
  };
  $('#emb-ctl').addEventListener('pick', e => pick(e.detail.dataset.h));
  pick('sharpa');
}

/* ------------------------------------------------------------------ BibTeX, KaTeX */
function initBib() {
  const b = $('.bib-copy'); if (!b) return;
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#bib-text').textContent); b.textContent = 'Copied'; }
    catch (_) { const r = document.createRange(); r.selectNodeContents($('#bib-text')); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Press ⌘C or Ctrl+C'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1600);
  });
}
function renderMath() {
  const go = () => $$('.tex').forEach(el => {
    if (el._k) return; el._k = true;
    try { window.katex.render(el.textContent, el, { displayMode: el.classList.contains('display'), throwOnError: false, output: 'html' }); } catch (_) {}
  });
  if (window.katex) go(); else addEventListener('load', () => window.katex && go());
}

/* ------------------------------------------------------------------ pipeline figure hotspots */
async function initPipeline() {
  const fig = $('#pipe-fig'), steps = $('#steps'); if (!fig) return;
  let boxes = null;
  try { boxes = await (await fetch('assets/img/cut/pipeline/hotspots.json')).json(); } catch (_) {}
  if (boxes) {
    for (const [k, b] of Object.entries(boxes)) for (const [x, y, w, h] of b.rects) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'hot'; el.dataset.hot = k; el.setAttribute('aria-label', b.label || k);
      Object.assign(el.style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });
      fig.append(el);
    }
  }
  const pick = k => {
    $$('.step', steps).forEach(s => s.setAttribute('aria-expanded', s.dataset.hot === k));
    $$('.hot', fig).forEach(h => h.classList.toggle('on', h.dataset.hot === k));
  };
  steps.addEventListener('click', e => { const s = e.target.closest('.step'); if (s) pick(s.dataset.hot); });
  fig.addEventListener('click', e => { const h = e.target.closest('.hot'); if (h) pick(h.dataset.hot); });
  pick('uhcr');
}

/* ------------------------------------------------------------------ boot */
if (matchMedia('(max-width: 600px)').matches) $$('details.fallback-table').forEach(d => { d.open = true; });
renderMath();
segs();
initVideos();
initHero();
initNav();
initReveal();
initSynced();
initBaselines();
initSources();
initCharts();
initWipe();
initV2R();
initHardware();
initOnOff();
initMore();
initEmbodiments();
initBib();
initPipeline();
initAnchorDemo($('#anchor-demo'));
glassify();
