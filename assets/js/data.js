// Content tables for the interactive parts. Numbers are copied from the paper (Table 1, Vid-HACO table,
// appendix E); frame times are where the paper's hardware-figure stills sit in each clip.
const V = 'assets/video/', C = 'assets/img/cut/';
const fr = (task, ts) => ts.map((t, i) => ({ t, img: `${C}realworld/${task}_f${i + 1}.webp` }));

export const TASKS = [
  { key: 'cube', name: "Rubik's cube pick-up", hand: 'SHARPA Wave', video: `${V}realworld/cube_crop.mp4`, poster: `${V}realworld/cube_crop.jpg`, thumb: `${V}realworld/cube_crop.jpg`,
    frames: fr('cube', [0.50, 3.03, 5.22, 8.15]),
    desc: 'The fingers close around the cube on the table, lift it in a fingertip grasp and set it back down.' },
  { key: 'cards', name: 'Card deck pick-up', hand: 'SHARPA Wave', video: `${V}realworld/cards_crop.mp4`, poster: `${V}realworld/cards_crop.jpg`, thumb: `${V}realworld/cards_crop.jpg`,
    frames: fr('cards', [0.50, 5.63, 33.50, 116.63]), demo: `${V}far/human_demo_cards_desk.mp4`,
    desc: 'The index presses the top card, then thumb and index pinch one card up and lay it flat beside the deck. The full take runs several deals with resets in between.' },
  { key: 'marker', name: 'Marker pick-up', hand: 'SHARPA Wave', video: `${V}realworld/marker_crop.mp4`, poster: `${V}realworld/marker_crop.jpg`, thumb: `${V}realworld/marker_crop.jpg`,
    frames: fr('marker', [0.47, 6.22, 10.78, 13.95]),
    desc: 'The hand pinches the marker lying flat, lifts it and ends in a pen-like grip.' },
  { key: 'mustard', name: 'Mustard palm grasp', hand: 'Wuji Hand 2', video: `${V}realworld/mustard_crop.mp4`, poster: `${V}realworld/mustard_crop.jpg`, thumb: `${V}realworld/mustard_crop.jpg`,
    frames: fr('mustard', [0.50, 5.58, 8.40, 11.52]),
    desc: 'The whole hand wraps the soft squeeze bottle, lifts it, tilts it cap-down, sets it upright and lets go.' },
  { key: 'cup', name: 'Cup pick-up', hand: 'Wuji Hand 2', video: `${V}realworld/cup_crop.mp4`, poster: `${V}realworld/cup_crop.jpg`, thumb: `${V}realworld/cup_crop.jpg`,
    frames: fr('cup', [0.50, 3.62, 5.23, 7.87]),
    desc: 'A thin-walled plastic cup taken at the side near the rim, lifted, tilted and put back.' },
  { key: 'tongs', name: 'Tong use', hand: 'Unitree Dex3-1', video: `${V}realworld/tongs_crop.mp4`, poster: `${V}realworld/tongs_crop.jpg`, thumb: `${V}realworld/tongs_crop.jpg`,
    frames: fr('tongs', [0.00, 2.28, 6.57, 11.65]), demo: `${V}far/human_demo_tongs_contact_mesh.mp4`,
    desc: 'An articulated tool held in a three-finger hand: the tongs are squeezed shut and opened again.' },
];

export const MORE = [
  { name: 'Wiping with an eraser', tag: 'From a tactile glove', video: `${V}drive/realrobot_glove_wipe_eraser.mp4`, poster: `${V}drive/realrobot_glove_wipe_eraser.jpg` },
  { name: 'Drill power grasp', tag: 'From video', video: `${V}drive/realrobot_vision_drill_grasp_sbs.mp4`, poster: `${V}drive/realrobot_vision_drill_grasp_sbs.jpg` },
  { name: "Rubik's cube in the fingertips", tag: 'From video', video: `${V}drive/realrobot_vision_rubiks_cube_sbs.mp4`, poster: `${V}drive/realrobot_vision_rubiks_cube_sbs.jpg` },
  { name: 'Pouring from a cup', tag: 'From video', video: `${V}drive/realrobot_vision_pour_cup.mp4`, poster: `${V}drive/realrobot_vision_pour_cup.jpg` },
  { name: 'Spray bottle grasp', tag: 'Source not recorded', video: `${V}realworld/windex_sharpa.mp4`, poster: `${V}realworld/windex_sharpa.jpg` },
  { name: 'Mustard lift and turn', tag: 'Source not recorded', video: `${V}far/sharpa_mustard_grasp_lift_c0291.mp4`, poster: `${V}far/sharpa_mustard_grasp_lift_c0291.jpg` },
  { name: 'Tracking 1 N per finger', tag: 'Early tactile tracker test', video: `${V}drive/realrobot_tactile_tracking_barrel.mp4`, poster: `${V}drive/realrobot_tactile_tracking_barrel.jpg` },
];

export const HANDS = {
  sharpa: { name: 'SHARPA Wave', map: `${C}semantic/sharpa.webp`, real: { video: `${V}realworld/cube_crop.mp4`, label: "Rubik's cube pick-up" },
    note: '22 joints, five fingers with three links each. The 15 finger regions and the palm map one-to-one onto same-named links, and the pinky base onto the pinky metacarpal.' },
  wuji: { name: 'Wuji Hand 2', map: `${C}semantic/wuji.webp`, real: { video: `${V}realworld/mustard_crop.mp4`, label: 'Mustard palm grasp' },
    note: 'Five fingers with three links each: the 15 finger regions and the palm map one-to-one.' },
  dex3: { name: 'Unitree Dex3-1', map: `${C}semantic/dex3.webp`, real: { video: `${V}realworld/tongs_crop.mp4`, label: 'Tong use' },
    note: 'Three fingers. Thumb and index map directly; middle, ring and pinky fold onto the third finger, and when several of them touch at once their anchors merge at the force-weighted centroid.' },
  gripper: { name: 'Parallel-jaw gripper', map: `${C}semantic/gripper.webp`, real: null,
    note: 'Two pads. The thumb takes one jaw and the four fingers the other; distal, middle and proximal regions go to the tip, middle and base of the jaw.' },
};

export const TILES = {
  video: [
    { label: 'Drill', frame: `${C}gallery/video_drill_frame.webp`, contact: `${C}gallery/video_drill_contact.webp` },
    { label: 'Spray bottle', frame: `${C}gallery/video_spray_frame.webp`, contact: `${C}gallery/video_spray_contact.webp` },
    { label: 'Mallet', frame: `${C}gallery/video_mallet_frame.webp`, contact: `${C}gallery/video_mallet_contact.webp` },
    { label: 'Can', frame: `${C}gallery/video_can_frame.webp`, contact: `${C}gallery/video_can_contact.webp` },
  ],
  glove: [
    { label: 'Cup', frame: `${C}gallery/glove_cup_frame.webp`, contact: `${C}gallery/glove_cup_contact.webp` },
    { label: "Rubik's cube", frame: `${C}gallery/glove_cube_frame.webp`, contact: `${C}gallery/glove_cube_contact.webp` },
    { label: 'Mustard', frame: `${C}gallery/glove_mustard_frame.webp`, contact: `${C}gallery/glove_mustard_contact.webp` },
    { label: 'Eraser', frame: `${C}gallery/glove_eraser_frame.webp`, contact: `${C}gallery/glove_eraser_contact.webp` },
  ],
  mocap: [
    { label: 'Power grasp', frame: `${C}gallery/mocap_power_frame.webp`, contact: `${C}gallery/mocap_power_contact.webp` },
    { label: 'Pinch at the cap', frame: `${C}gallery/mocap_pinch_frame.webp`, contact: `${C}gallery/mocap_pinch_contact.webp` },
    { label: 'Tripod', frame: `${C}gallery/mocap_tripod_frame.webp`, contact: `${C}gallery/mocap_tripod_contact.webp` },
    { label: 'Top grasp', frame: `${C}gallery/mocap_top_frame.webp`, contact: `${C}gallery/mocap_top_contact.webp` },
  ],
};

// hero montage: [t0, t1) in seconds of assets/video/hero/hero.mp4
export const HERO_SEGMENTS = [
  { t0: 0, t1: 3, label: "Rubik's cube · SHARPA Wave" },
  { t0: 3, t1: 6, label: 'Mustard bottle · Wuji Hand 2' },
  { t0: 6, t1: 9.6, label: 'Card deck · SHARPA Wave' },
  { t0: 9.6, t1: 13, label: 'Tongs · Unitree Dex3-1' },
  { t0: 13, t1: 16.6, label: 'Marker · SHARPA Wave' },
  { t0: 16.6, t1: 99, label: 'Cup · Wuji Hand 2' },
];

// video-to-robot clips: two panels cut from one render, so they share a clock
export const V2R_AR = { cube: '960 / 430', can: '960 / 430', spray: '960 / 610' };

const SENT = {
  own67: {
    contact: 'CARD establishes <strong>43.6%</strong> of the demonstrated contacts on our clips. The kinematic baselines reach 2.4 to 2.5%, and CARD\'s own initializer 25.2%. The rate follows the contact signal: 89% on glove clips, where contact is measured, and 46% on video, where it is inferred.',
    region: 'Correct finger also requires the nearest pad to belong to the demonstrated finger. CARD keeps <strong>41.3%</strong>, nearly all of its established contacts; the kinematic baselines 2.4 to 2.5%.',
    cone: 'In cone also requires the pad normal within 45° of the demonstrated push, so the contact can carry the force. CARD reaches <strong>18.3%</strong>, its initializer alone 5.7%, the kinematic baselines about 1%.',
    gap: 'Median distance from anchor to pad: <strong>3.31 mm</strong> for CARD, against 24 to 25 mm for the kinematic baselines and 11.5 mm for the initializer.',
  },
  grab: {
    contact: 'On GRAB CARD reaches <strong>43.1%</strong>. ReGrind, which needs the object mesh, reaches 22.5%; the kinematic baselines stay under 5%.',
    region: 'On GRAB: CARD <strong>40.6%</strong>, ReGrind 20.7%, the kinematic baselines 4.5 to 4.9%.',
    cone: 'On GRAB: CARD <strong>16.2%</strong>, ReGrind 5.2%, the kinematic baselines 1.7%.',
    gap: 'On GRAB: <strong>3.56 mm</strong> for CARD, 7.86 mm for ReGrind and about 21 mm for the kinematic baselines.',
    pen: 'Median deepest incursion into the ground-truth object mesh: <strong>7.96 mm</strong> for CARD, the lowest of all methods, against 9.80 mm for ReGrind and 12.7 to 13.0 mm for the kinematic baselines. CARD\'s collision term also uses this mesh on GRAB.',
  },
};

export const FIDELITY = {
  sentence: (bed, met) => SENT[bed][met] || '',
  text: {
    vidhaco: {
      val: 'On the validation split of the 12 training datasets Vid-HACO reaches 84.3 vertex F1 and 92.4 average precision, against 57.1 and 51.7 for the released HACO and 74.5 and 70.4 for HACO-R, the same model retrained on our data.',
      hrdexdb: 'Retraining HACO on our data (HACO-R) lifts its in-distribution F1 from 57.1 to 74.5 but buys nothing on HRDexDB, so the gain comes from the model: video input, a video-pretrained encoder and training on every frame. Both HACO models flag contact on every frame and score exactly the trivial frame F1 of 75.9, where Vid-HACO reaches 95.3 held out. In CARD, a contact predicted during a reach would pull a robot finger onto empty space.',
    },
    force: {
      grasp: 'With step targets of 9.7&nbsp;N on the thumb, 7&nbsp;N on the middle finger and 2.6&nbsp;N on the index, each force reaches its set-point within about a second, with the thumb overshooting while the object settles; on release every finger returns to zero within a second. Dashed lines are targets.',
      periodic: 'The index finger follows a 0 to 4&nbsp;N periodic target against a fixed object. It reaches the peaks within a few tenths of a newton and lags the target by about 0.2&nbsp;s. The floor near 0.5&nbsp;N is the preload the controller keeps while in contact.',
    },
  },
};
