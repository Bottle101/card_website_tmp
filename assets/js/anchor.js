// One contact anchor, one robot pad. The cost is the paper's contact group without the anti-slip term:
// reach ||s* - c||^2 plus friction cone lambda r^2 (1 - n(s*) . d), lambda = 2, r = 10 mm, in mm^2.
// The pad is a capsule: a flat palmar face between two rounded ends; s* is its closest point to the anchor.
const PX_PER_MM = 7, HALF = 44, RAD = 26, SURF = 262, LAMBDA = 2, R_MM = 10;

export function initAnchorDemo(root) {
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const svg = root.querySelector('svg'), pad = $('ad-pad'), rot = $('ad-rot');
  const anchor = { x: 320, y: SURF };
  const st = { x: 404, y: 196, th: 18 };

  // static: anchor, push arrow, cone wedge (directions within 45 deg of the push)
  $('ad-anchor').setAttribute('cx', anchor.x); $('ad-anchor').setAttribute('cy', anchor.y);
  const push = $('ad-push');
  push.setAttribute('x1', anchor.x); push.setAttribute('y1', anchor.y); push.setAttribute('x2', anchor.x); push.setAttribute('y2', anchor.y + 70);
  const L = 150, a = Math.PI / 4;
  $('ad-cone').setAttribute('d', `M${anchor.x} ${anchor.y} L${anchor.x - L * Math.sin(a)} ${anchor.y - L * Math.cos(a)} A${L} ${L} 0 0 1 ${anchor.x + L * Math.sin(a)} ${anchor.y - L * Math.cos(a)} Z`);
  const lab = $('ad-anchor-l'); lab.setAttribute('x', anchor.x - 30); lab.setAttribute('y', anchor.y + 26);
  lab.innerHTML = 'c<tspan font-size="10" dy="3">f</tspan><tspan dx="16" dy="-3" fill="#b25616">push d̂</tspan>';

  const lowestY = (y, th) => y + HALF * Math.abs(Math.sin(th)) + RAD;
  const clamp = () => {                              // the pad may touch the surface but not sink into it
    const th = st.th * Math.PI / 180;
    const over = lowestY(st.y, th) - (SURF + 1);
    if (over > 0) st.y -= over;
    st.x = Math.min(600, Math.max(40, st.x)); st.y = Math.max(40, st.y);
  };

  function solve() {
    const th = st.th * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    // anchor in the pad frame (y down is the palmar normal)
    const dx = anchor.x - st.x, dy = anchor.y - st.y;
    const lx = c * dx + s * dy, ly = -s * dx + c * dy;
    let px, py, nx, ny, palmar;
    if (Math.abs(lx) <= HALF) {                       // over the flat face
      if (ly >= 0) { px = lx; py = RAD; nx = 0; ny = 1; palmar = true; }
      else { px = lx; py = -RAD; nx = 0; ny = -1; palmar = false; }
    } else {                                          // off the end: nearest point on the rounded cap
      const ex = Math.sign(lx) * HALF, vx = lx - ex, vy = ly, l = Math.hypot(vx, vy) || 1;
      nx = vx / l; ny = vy / l; px = ex + nx * RAD; py = ny * RAD;
      palmar = ny > Math.cos(50 * Math.PI / 180);
    }
    const gapPx = Math.max(0, (lx - px) * nx + (ly - py) * ny);
    // back to world
    const wx = st.x + c * px - s * py, wy = st.y + s * px + c * py;
    const wnx = c * nx - s * ny, wny = s * nx + c * ny;
    const tilt = Math.acos(Math.max(-1, Math.min(1, wny))) * 180 / Math.PI;   // push direction is +y
    return { gap: gapPx / PX_PER_MM, tilt, wx, wy, palmar };
  }

  function draw() {
    clamp();
    pad.setAttribute('transform', `translate(${st.x} ${st.y}) rotate(${st.th})`);
    const r = solve();
    const near = $('ad-near'); near.setAttribute('cx', r.wx); near.setAttribute('cy', r.wy);
    const g = $('ad-gap'); g.setAttribute('x1', r.wx); g.setAttribute('y1', r.wy); g.setAttribute('x2', anchor.x); g.setAttribute('y2', anchor.y);
    g.style.opacity = r.gap > .3 ? 1 : 0;
    const reach = r.gap * r.gap, cone = LAMBDA * R_MM * R_MM * (1 - Math.cos(r.tilt * Math.PI / 180));
    $('ad-gapv').textContent = `${r.gap.toFixed(1)} mm`;
    $('ad-tiltv').textContent = `${Math.round(r.tilt)}°`;
    $('ad-t1').textContent = reach.toFixed(0); $('ad-t2').textContent = cone.toFixed(0);
    const scale = 400;
    $('ad-b1').style.width = `${Math.min(100, reach / scale * 100)}%`;
    $('ad-b2').style.width = `${Math.min(100 - Math.min(100, reach / scale * 100), cone / scale * 100)}%`;
    const eq = Math.sqrt(cone);
    $('ad-equiv').innerHTML = r.tilt >= 1
      ? `A ${Math.round(r.tilt)}° tilt costs as much as a <b>${eq.toFixed(1)} mm</b> miss. Total <b>${(reach + cone).toFixed(0)} mm²</b>.`
      : `The pad faces the push. Total <b>${(reach + cone).toFixed(0)} mm²</b>, all of it reach.`;
    const est = r.palmar && r.gap <= 2, inc = est && r.tilt <= 45;
    $('ad-c1').classList.toggle('ok', est); $('ad-c2').classList.toggle('ok', inc);
    $('ad-c1').textContent = est ? 'Contact established' : (r.palmar ? 'No contact: more than 2 mm away' : 'No contact: wrong face of the pad');
    $('ad-c2').textContent = inc ? 'Inside the 45° cone' : (est ? 'Outside the cone' : 'Not scored: no contact');
    rot.value = st.th; $('ad-rotv').textContent = `${Math.round(st.th)}°`;
    pad.setAttribute('aria-valuetext', `gap ${r.gap.toFixed(1)} mm, tilt ${Math.round(r.tilt)}°`);
  }

  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let drag = null;
  pad.addEventListener('pointerdown', e => { const p = toSvg(e); drag = { dx: st.x - p.x, dy: st.y - p.y }; pad.setPointerCapture(e.pointerId); pad.style.cursor = 'grabbing'; e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if (!drag) return; const p = toSvg(e); st.x = p.x + drag.dx; st.y = p.y + drag.dy; draw(); });
  const end = () => { drag = null; pad.style.cursor = 'grab'; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  // the whole stage also accepts a press: the pad jumps there, which is easier on touch
  svg.addEventListener('pointerdown', e => { if (e.target.closest('#ad-pad')) return; const p = toSvg(e); st.x = p.x; st.y = p.y; draw(); drag = { dx: 0, dy: 0 }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', e => { if (!drag || e.target.closest('#ad-pad')) return; const p = toSvg(e); st.x = p.x + drag.dx; st.y = p.y + drag.dy; draw(); });
  svg.addEventListener('pointerup', end);
  rot.addEventListener('input', () => { st.th = +rot.value; draw(); });
  pad.setAttribute('tabindex', '0'); pad.setAttribute('role', 'slider'); pad.setAttribute('aria-label', 'Robot pad position; arrow keys move it, Q and E rotate it');
  pad.addEventListener('keydown', e => {
    const k = e.key, d = e.shiftKey ? 10 : 3;
    if (k === 'ArrowLeft') st.x -= d; else if (k === 'ArrowRight') st.x += d; else if (k === 'ArrowUp') st.y -= d; else if (k === 'ArrowDown') st.y += d;
    else if (k === 'q' || k === 'Q') st.th = Math.max(-80, st.th - 3); else if (k === 'e' || k === 'E') st.th = Math.min(80, st.th + 3); else return;
    e.preventDefault(); draw();
  });
  draw();
}
