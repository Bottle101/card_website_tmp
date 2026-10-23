// Interactive sim scenes. A scene is a JSON file (assets/3d/scenes/, written by _work/scripts/scene3d/) listing GLB meshes
// (object, MANO hand, posed robot hand) with roles, the contact anchors, and a view. Paper panels are exported in the
// figure's screen frame ("frame": "screen": x right, y up, z toward the viewer, metres) with the panel's square window, so
// a scene opens on the paper's view. Scenes may instead pose a robot hand GLB (one node per URDF link) with world link
// matrices in the solver's z-up frame. three.js comes from the CDN through the import map in index.html, the first time a
// viewer gets near the viewport. All viewers share ONE WebGL renderer and copy each frame into their own 2-D canvas, so a
// page with many viewers holds a single WebGL context (browsers drop contexts beyond about 16, phones sooner).

let lib = null;
const three = () => lib ||= Promise.all([
  import('three'),
  import('three/addons/controls/OrbitControls.js'),
  import('three/addons/loaders/GLTFLoader.js'),
  import('three/addons/environments/RoomEnvironment.js'),
]).then(([THREE, oc, gl, re]) => ({ THREE, OrbitControls: oc.OrbitControls, GLTFLoader: gl.GLTFLoader, RoomEnvironment: re.RoomEnvironment }));

const cache = new Map();
const once = (key, make) => {                   // a failed load is dropped, so the next show() retries it
  if (!cache.has(key)) cache.set(key, make().catch(err => { cache.delete(key); throw err; }));
  return cache.get(key);
};
const json = url => once(url, () => fetch(url).then(r => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }));
const gltf = (L, url) => once(url, () => new Promise((ok, bad) => new L.GLTFLoader().load(url, g => ok(g.scene), undefined, bad)));
const base = url => url.slice(0, url.lastIndexOf('scenes/'));   // assets/3d/ from assets/3d/scenes/<section>/x.json

// the paper's look: pale blue-grey robot, off-white human hand, translucent object, orange anchors
const STYLE = {
  robot: { color: 0xc9d0db, roughness: .48, metalness: .12 },
  human: { color: 0xece7e1, roughness: .72, metalness: 0 },
  object: { color: 0xe9eaec, roughness: .35, metalness: 0, transparent: true, opacity: .42, depthWrite: false, side: 2 },
  anchor: { color: 0xe8731f, roughness: .45, metalness: 0, emissive: 0x6b2a05, emissiveIntensity: .35 },
};
const coarse = matchMedia('(pointer: coarse)').matches;
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

let shared = null;                                  // { renderer, env }: the one WebGL context, grown to the largest viewer
function sharedRenderer(L) {
  if (shared) return shared;
  const { THREE } = L;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1);                        // viewers size it in device pixels
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const env = new THREE.PMREMGenerator(renderer).fromScene(new L.RoomEnvironment(), .04).texture;
  return shared = { renderer, env, w: 0, h: 0 };
}

// compact: a thumbnail (no hint, reset or labels). A drag sets data-dragged on el until the click it ends in has passed,
// so a viewer inside a button can rotate without triggering it.
export function createViewer(el, { label = 'Interactive 3D scene', reset = true, compact = false } = {}) {
  let L, cv, ctx, scene, camera, controls, root, pending = 0, mats = {}, home = null, shown = null, peers = [], syncing = false, tags = [], exposure = 1;
  const ui = document.createElement('div'); ui.className = 's3d-ui';
  ui.innerHTML = `<span class="s3d-hint">${coarse ? 'Tap, then drag to turn' : `Drag to rotate · ${MOD} + scroll to zoom`}</span>`
    + '<button type="button" class="s3d-reset" aria-label="Reset the view" title="Reset the view"><svg aria-hidden="true"><use href="#i-replay"/></svg></button>';
  const $reset = ui.querySelector('.s3d-reset');
  if (!reset || compact) { $reset.remove(); el.classList.add('s3d-sub'); }   // linked viewers keep one reset and hint, on the main panel

  const ready = three().then(lib3 => {
    L = lib3; const { THREE } = L;
    const { env } = sharedRenderer(L);
    cv = document.createElement('canvas'); ctx = cv.getContext('2d');
    cv.className = 's3d-canvas'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', label);
    el.append(cv, ui);
    scene = new THREE.Scene();
    scene.environment = env; scene.environmentIntensity = .9;
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(1.2, 2.2, 1.6); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(-1.5, .6, -1); scene.add(fill);
    camera = new THREE.PerspectiveCamera(30, 1, .005, 20);
    controls = new L.OrbitControls(camera, cv);
    controls.enableDamping = true; controls.dampingFactor = .12; controls.rotateSpeed = .8; controls.zoomSpeed = .8;
    // a plain wheel or trackpad swipe scrolls the page (and sideways strips); pinch (ctrlKey) or the modifier zooms
    cv.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) e.stopImmediatePropagation(); }, { capture: true });
    controls.addEventListener('change', () => { request(); if (!syncing && home) { const st = pose(); peers.forEach(p => p.follow(st)); } });
    controls.addEventListener('start', () => el.classList.add('s3d-used'));
    let down = null;                                // pointer travel, not camera motion (damping keeps moving after a drag)
    cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', e => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) { el.dataset.dragged = '1'; setTimeout(() => delete el.dataset.dragged, 0); }
      down = null;
    });
    if (coarse) {                                   // let the page scroll over the viewer until it is tapped
      controls.enabled = false; cv.style.touchAction = 'pan-x pan-y';
      cv.addEventListener('click', () => { wake(); peers.forEach(p => p.wake()); });
    }
    for (const [k, s] of Object.entries(STYLE)) mats[k] = new THREE.MeshStandardMaterial(s);
    mats.anchor.name = 'anchor';
    $reset.addEventListener('click', () => { goHome(); peers.forEach(p => p.reset()); });
    new ResizeObserver(resize).observe(el); resize();
    new IntersectionObserver(es => { if (!es[0].isIntersecting && coarse) { controls.enabled = false; cv.style.touchAction = 'pan-x pan-y'; el.classList.remove('s3d-live'); } }).observe(el);
  });

  function resize() {
    if (!cv) return;
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (home && !el.classList.contains('s3d-used')) setView(home);      // refit until the reader takes over
    request();
  }
  function request() { if (!pending) pending = requestAnimationFrame(frame); }
  function frame() {
    pending = 0;
    const moving = controls.update();             // damping keeps easing after the pointer lets go
    const S = shared, r = S.renderer, w = cv.width, h = cv.height;
    if (w && h) {
      if (w > S.w || h > S.h) { S.w = Math.max(S.w, w); S.h = Math.max(S.h, h); r.setSize(S.w, S.h, false); }
      r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true);
      r.toneMappingExposure = exposure;
      r.render(scene, camera);
      ctx.clearRect(0, 0, w, h);                   // GL rows start at the bottom: the frame is the canvas' bottom-left w x h
      ctx.drawImage(r.domElement, 0, S.h - h, w, h, 0, 0, w, h);
    }
    if (tags.length) place();
    if (moving) request();
  }
  // text labels from the figure, as HTML tags pinned to their 3-D points
  function place() {
    const w = el.clientWidth, h = el.clientHeight;
    for (const t of tags) {
      const p = t.at.clone().project(camera);
      t.el.style.transform = `translate(${(p.x + 1) / 2 * w}px, ${(1 - p.y) / 2 * h}px) translate(-50%, -50%)`;
      t.el.style.visibility = p.z < 1 ? 'visible' : 'hidden';
    }
  }
  // z-up solver frame -> three.js y-up
  const up = (v, THREE) => new THREE.Vector3(v[0], v[2], -v[1]);
  // a view is a target, a unit direction to the camera and a half size to fit: the distance follows the canvas shape
  const fitDist = v => v.half * Math.max(1, 1 / camera.aspect) / Math.tan(v.fov * Math.PI / 360);
  function setView(v) {                            // programmatic: linked viewers are not told
    syncing = true;
    camera.fov = v.fov; camera.updateProjectionMatrix();
    controls.target.copy(v.target); camera.position.copy(v.dir).multiplyScalar(fitDist(v)).add(v.target); controls.update();
    syncing = false;
  }
  function wake() { if (!controls) return; controls.enabled = true; cv.style.touchAction = 'none'; el.classList.add('s3d-live'); }
  function goHome() { if (!home) return; el.classList.remove('s3d-used'); setView(home); request(); }
  // this viewer's camera relative to its home view, for linked viewers of other sizes
  function pose() {
    const off = camera.position.clone().sub(controls.target), d = off.length();
    return { dir: off.divideScalar(d), zoom: d / fitDist(home), shift: controls.target.clone().sub(home.target).divideScalar(home.half) };
  }

  function style(obj, role) {
    obj.traverse(o => {
      if (!o.isMesh) return;
      if (role === 'keep') {                        // figure colours (regions, contact maps), lit like the rest
        const m = o.material, a = m.opacity;
        o.material = mats[m.name] ||= new L.THREE.MeshStandardMaterial({ color: m.color, roughness: .6, metalness: 0,
          transparent: a < .99, opacity: a, side: 2 });      // translucent skin keeps depth: no inner folds showing through
        o.renderOrder = a < .99 ? 2 : 0; return;
      }
      const r = role || (o.material && STYLE[o.material.name] ? o.material.name : 'robot');
      o.material = mats[r]; o.renderOrder = r === 'object' ? 2 : 0;
    });
  }

  async function build(url) {
    const S = await json(url), root3 = base(url), { THREE } = L;
    const screen = S.frame === 'screen';
    const g = new THREE.Group(); if (!screen) g.rotation.x = -Math.PI / 2;   // children stay in their own coordinates
    if (S.hand) {
      const hand = (await gltf(L, `${root3}hands/${S.hand}.glb`)).clone(true);
      const links = {};                             // GLTFLoader sanitizes node names the same way
      for (const [k, m] of Object.entries(S.links)) links[THREE.PropertyBinding.sanitizeNodeName(k)] = m;
      hand.children.slice().forEach(node => {
        const m = links[node.name];
        if (!m) { node.visible = false; return; }
        node.matrixAutoUpdate = false; node.matrix.fromArray(m);
      });
      style(hand, 'robot'); g.add(hand);
    }
    for (const m of S.meshes || []) {
      const o = (await gltf(L, `${root3}${m.src}`)).clone(true);
      if (m.matrix) { o.matrixAutoUpdate = false; o.matrix.fromArray(m.matrix); }
      style(o, m.role); g.add(o);
    }
    if (S.anchors && S.anchors.length) {
      const geo = new THREE.SphereGeometry(S.anchorRadius || .0045, 20, 14);
      const inst = new THREE.InstancedMesh(geo, mats.anchor, S.anchors.length), M = new THREE.Matrix4();
      S.anchors.forEach((a, i) => inst.setMatrixAt(i, M.makeTranslation(a[0], a[1], a[2])));
      g.add(inst);
    }
    g.updateMatrixWorld(true);
    let view;
    if (S.window) view = { target: new THREE.Vector3(...S.window.center), dir: new THREE.Vector3(0, 0, 1), half: S.window.half, fov: 22 };
    else if (S.camera) {
      const t = up(S.camera.target, THREE), off = up(S.camera.position, THREE).sub(t), fov = S.camera.fov || 30;
      view = { target: t, dir: off.clone().normalize(), half: off.length() * Math.tan(fov * Math.PI / 360), fov };
    } else {                                        // frame the whole scene from the front-right, slightly above
      const sph = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
      view = { target: sph.center.clone(), dir: new THREE.Vector3(.55, .45, .7).normalize(), half: sph.radius * 1.05, fov: 30 };
    }
    // figure-coloured scenes were shaded darker by matplotlib (faces x 0.62-1): a little less exposure keeps their tones
    const exposure = S.exposure || ((S.meshes || []).some(m => m.role === 'keep') ? .85 : 1);
    return { g, view, labels: S.labels || [], exposure };
  }

  return {
    el,
    // keepView: switching methods or hands on the same clip keeps the reader's viewpoint
    async show(url, { keepView = false } = {}) {
      shown = url; await ready;
      let built;
      try { built = await build(url); }
      catch (_) {                                   // one more try: a fetch can be dropped while the page is busy
        try { built = await build(url); } catch (err) { el.classList.add('s3d-fail'); console.warn('scene3d', err); return; }
      }
      if (shown !== url) return;                    // a later pick won
      if (root) scene.remove(root);
      root = built.g; scene.add(root); exposure = built.exposure;
      tags.forEach(t => t.el.remove());
      tags = (compact ? [] : built.labels).map(lb => {
        const t = document.createElement('span'); t.className = 's3d-label';
        t.innerHTML = lb.html || lb.text.replace(/[<&]/g, c => ({ '<': '&lt;', '&': '&amp;' })[c]).replace(/_(\w+)/, '<sub>$1</sub>');
        if (lb.color) t.style.color = lb.color;
        ui.appendChild(t); return { el: t, at: root.localToWorld(new L.THREE.Vector3(...lb.at)) };
      });
      if (!home || !keepView) { home = built.view; setView(home); }
      el.classList.add('s3d-ready'); request();
    },
    link(other) { peers.push(other); },
    reset: () => goHome(),
    wake: () => wake(),
    follow(st) {                                    // take a linked viewer's rotation, zoom and pan, scaled to this view
      if (!controls || !home) return;
      syncing = true;
      controls.target.copy(st.shift).multiplyScalar(home.half).add(home.target);
      camera.position.copy(st.dir).multiplyScalar(st.zoom * fitDist(home)).add(controls.target);
      controls.update(); syncing = false; el.classList.add('s3d-used'); request();
    },
  };
}

// two viewers that share one viewpoint (the human source and its robot retarget)
export function pairViewers(a, b) { a.link(b); b.link(a); }
