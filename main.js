import * as THREE from 'three';

// ---------- Config ----------
const PHOTO = 'foto.jpg', DOG_PHOTO = 'perro.jpg';
const CROP_PLAYER = { x: 700, y: 200, s: 320 };   // chico (derecha de la foto)
const CROP_PRINCESS = { x: 425, y: 165, s: 300 }; // chica (izquierda de la foto)
const CROP_DOG = { x: 540, y: 200, s: 480 };
const SPEED = 7, JUMP = 9, GRAVITY = 24, KISS_RADIUS = 3.4;
const MAX_HP = 100, BITE = 18, DOG_HP = 6, DOG_SPEED = 4.6;

// ---------- Básicos ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 110);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);

scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, far: 150 });
scene.add(sun);

const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...extra });
const colliders = [];
const rnd = (a, b) => a + Math.random() * (b - a);

function block(w, h, d, x, y, z, color, solid = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  if (solid) colliders.push({ min: new THREE.Vector3(x - w / 2, y, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h, z + d / 2) });
  return m;
}

// ---------- Escenario ----------
const ground = new THREE.Mesh(new THREE.BoxGeometry(160, 1, 160), mat(0x4caf50));
ground.position.y = -0.5; ground.receiveShadow = true; scene.add(ground);
for (let i = 0; i < 14; i++) block(3, 0.05, 3, 0, 0, 30 - i * 3.2, 0xc8a165, false);

function tree(x, z) {
  block(0.8, 3, 0.8, x, 0, z, 0x8b5a2b);
  const l = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), mat(0x2e7d32));
  l.position.set(x, 4.2, z); l.castShadow = true; scene.add(l);
}
for (let i = 0; i < 40; i++) {
  const x = rnd(-70, 70), z = rnd(-70, 70);
  if (Math.abs(x) < 6 && z > -15) continue;
  if (Math.abs(x) < 16 && z < -10 && z > -40) continue;
  if (Math.hypot(x + 25, z - 10) < 8) continue; // zona del perro
  tree(x, z);
}
const flowerColors = [0xff4081, 0xffeb3b, 0xffffff, 0xba68c8];
for (let i = 0; i < 80; i++) block(0.3, 0.3, 0.3, rnd(-60, 60), 0, rnd(-60, 60), flowerColors[i % 4], false);

block(2, 1, 2, -2.5, 0, 18, 0x9e9e9e);
block(2, 1.2, 2, 2.5, 0, 12, 0x9e9e9e);
block(6, 1, 1, 0, 0, 6, 0x795548);
block(2, 1, 2, 6, 0, 3, 0xff9800);
block(2, 2, 2, 9, 0, 0, 0xff9800);
block(2, 3, 2, 12, 0, -3, 0xff9800);
const star = block(1, 1, 1, 12, 3, -3, 0xffd700, false);

// Casita del perro
block(4, 3, 0.5, -25, 0, 8, 0xd32f2f); block(0.5, 3, 4, -27, 0, 10, 0xd32f2f); block(0.5, 3, 4, -23, 0, 10, 0xd32f2f);
const dh = new THREE.Mesh(new THREE.ConeGeometry(3.3, 2, 4), mat(0x5d4037));
dh.position.set(-25, 4, 10); dh.rotation.y = Math.PI / 4; dh.castShadow = true; scene.add(dh);

// Castillo
const CZ = -25, STONE = 0xbdbdbd, ROOF = 0xe91e63;
block(24, 5, 1.5, 0, 0, CZ - 10, STONE);
block(1.5, 5, 20, -12, 0, CZ, STONE);
block(1.5, 5, 20, 12, 0, CZ, STONE);
block(9, 5, 1.5, -7.5, 0, CZ + 10, STONE);
block(9, 5, 1.5, 7.5, 0, CZ + 10, STONE);
block(6, 1, 1.5, 0, 4, CZ + 10, STONE);
for (const [x, z] of [[-12, CZ - 10], [12, CZ - 10], [-12, CZ + 10], [12, CZ + 10]]) {
  block(4, 9, 4, x, 0, z, 0xa0a0a0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 4), mat(ROOF));
  roof.position.set(x, 11, z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
}
for (let x = -11; x <= 11; x += 2) block(1, 1, 1.5, x, 5, CZ - 10, STONE);
block(3, 0.06, 16, 0, 0, CZ + 1, 0xc2185b, false);
block(5, 0.6, 4, 0, 0, CZ - 6, 0xf8bbd0);
const inCastle = (p) => Math.abs(p.x) < 11.3 && p.z < CZ + 9.5 && p.z > CZ - 9.5;

// ---------- Texturas ----------
function cropTexture(img, c) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  cv.getContext('2d').drawImage(img, c.x, c.y, c.s, c.s, 0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const loadImg = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(src); i.src = src; });
function part(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? mat(color) : color);
  m.position.set(x, y, z); m.castShadow = true; parent?.add(m); return m;
}

// ---------- Personajes ----------
function makeCharacter(tex, o) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = mat(o.skin);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1),
    [skin, skin, mat(o.hair), skin, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), mat(o.hair)]);
  head.position.y = 2.75; head.castShadow = true; body.add(head);
  part(1.4, 1.4, 0.7, o.shirt, 0, 1.5, 0, body);
  const pivot = (x, y, w, h, d, c, off) => { const p = new THREE.Group(); p.position.set(x, y, 0); part(w, h, d, c, 0, off, 0, p); body.add(p); return p; };
  const armL = pivot(-0.95, 2.1, 0.5, 1.3, 0.6, o.skin, -0.6);
  const armR = pivot(0.95, 2.1, 0.5, 1.3, 0.6, o.skin, -0.6);
  const legL = pivot(-0.35, 0.8, 0.65, 1.2, 0.65, o.pants, -0.4);
  const legR = pivot(0.35, 0.8, 0.65, 1.2, 0.65, o.pants, -0.4);
  if (o.cap) { part(1.2, 0.3, 1.2, o.cap, 0, 3.4, 0, body); part(0.9, 0.12, 0.6, o.cap, 0, 3.3, -0.8, body); }
  if (o.longHair) {
    part(1.2, 1.6, 0.25, o.hair, 0, 2.5, -0.62, body);
    part(0.15, 1.3, 1.0, o.hair, -0.62, 2.55, -0.05, body);
    part(0.15, 1.3, 1.0, o.hair, 0.62, 2.55, -0.05, body);
  }
  if (o.crown) {
    part(1.1, 0.25, 1.1, 0xffd700, 0, 3.42, 0, body);
    for (const [x, z] of [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45], [0, 0.45]]) part(0.2, 0.35, 0.2, 0xffd700, x, 3.7, z, body);
  }
  if (o.dress) part(1.7, 0.9, 1.0, o.dress, 0, 0.45, 0, body);
  let sword = null, shield = null;
  if (o.armed) {
    // Espada en la mano derecha (apunta hacia adelante cuando el brazo se levanta)
    sword = new THREE.Group(); sword.position.set(0, -1.25, 0.1); armR.add(sword);
    const steel = mat(0xe0e0e0, { metalness: 0.9, roughness: 0.25 });
    part(0.12, 0.5, 0.12, 0x5d4037, 0, 0, 0, sword);               // mango
    part(0.6, 0.12, 0.2, 0xffc107, 0, -0.3, 0, sword);             // guarda
    part(0.16, 1.7, 0.06, steel, 0, -1.2, 0, sword);               // hoja
    sword.rotation.x = -Math.PI / 2;
    // Escudo en el brazo izquierdo
    shield = new THREE.Group(); shield.position.set(-0.32, -0.7, 0.15); armL.add(shield);
    part(0.12, 1.1, 0.95, 0x1565c0, 0, 0, 0, shield);
    part(0.14, 0.75, 0.2, 0xffd700, 0, 0, 0, shield);
    part(0.14, 0.2, 0.65, 0xffd700, 0, 0.1, 0, shield);
  }
  scene.add(root);
  return { root, body, head, armL, armR, legL, legR, sword, shield };
}

// ---------- Cerbero (perro de tres cabezas) ----------
function makeCerberus(tex) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const fur = 0xe9c48c, light = 0xf6e7cf, dark = 0x3a2a1e;
  const furM = mat(fur);
  part(2.4, 1.7, 3.4, fur, 0, 1.9, 0, body);
  part(2.0, 0.4, 3.0, light, 0, 1.0, 0, body); // panza
  // Patas
  const legs = [];
  for (const [x, z] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.2], [0.85, -1.2]]) {
    const p = new THREE.Group(); p.position.set(x, 1.3, z);
    part(0.6, 1.3, 0.6, fur, 0, -0.6, 0, p); part(0.65, 0.25, 0.75, light, 0, -1.2, 0.08, p);
    body.add(p); legs.push(p);
  }
  // Cola
  const tail = new THREE.Group(); tail.position.set(0, 2.4, -1.7);
  part(0.3, 0.3, 1.3, fur, 0, 0.3, -0.5, tail); tail.rotation.x = -0.7; body.add(tail);
  // Bandana roja de lunares
  const dots = document.createElement('canvas'); dots.width = dots.height = 64;
  const g = dots.getContext('2d'); g.fillStyle = '#e8174f'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 16 + (y % 2) * 8 + 4, y * 16 + 8, 4, 0, 7); g.fill(); }
  const bt = new THREE.CanvasTexture(dots); bt.colorSpace = THREE.SRGBColorSpace;
  part(2.6, 0.5, 0.8, new THREE.MeshStandardMaterial({ map: bt }), 0, 2.6, 1.45, body);
  // Tres cabezas con la cara del perro
  const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const heads = [];
  for (const [x, ry] of [[-1.1, 0.35], [0, 0], [1.1, -0.35]]) {
    const n = new THREE.Group(); n.position.set(x, 2.8, 1.5); n.rotation.y = ry;
    part(0.7, 0.9, 0.7, fur, 0, 0.3, 0.1, n); // cuello
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), [furM, furM, furM, furM, faceM, furM]);
    h.position.set(0, 1.0, 0.45); h.castShadow = true; n.add(h);
    part(0.3, 0.45, 0.2, dark, -0.4, 1.7, 0.3, n); part(0.3, 0.45, 0.2, dark, 0.4, 1.7, 0.3, n); // orejas
    const eyeGlow = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0 }));
    eyeGlow.position.set(0, 1.25, 1.01); n.add(eyeGlow);
    body.add(n); heads.push({ n, eyeGlow });
  }
  root.scale.setScalar(1.0);
  scene.add(root);
  return { root, body, legs, tail, heads };
}

// ---------- Entrada ----------
const keys = {};
let camYaw = 0, camPitch = 0.35, dragging = false, lastX = 0, lastY = 0;
const touchMove = { x: 0, y: 0 };
let touchJump = false, touchShield = false;
const shieldHeld = () => keys.KeyL || keys.ShiftLeft || keys.ShiftRight || touchShield;

addEventListener('keydown', (e) => {
  if (keys[e.code]) return; // ignora autorepetición
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyK' || e.code === 'Enter' || e.code === 'NumpadEnter') tryKiss();
  if (e.code === 'KeyJ') attack();
  if (e.code === 'KeyP') tryPropose();
  if (e.code === 'KeyR' && (state === 'won' || state === 'dead')) reset();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
renderer.domElement.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('mouseup', () => (dragging = false));
addEventListener('mousemove', (e) => {
  if (!dragging) return;
  camYaw -= (e.clientX - lastX) * 0.005;
  camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - lastY) * 0.004, 0.05, 1.2);
  lastX = e.clientX; lastY = e.clientY;
});

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) {
  document.body.classList.add('touch');
  document.getElementById('touch').classList.remove('hidden');
  document.getElementById('again').textContent = 'Toca la pantalla para jugar de nuevo';
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let stickId = null, camId = null, cx = 0, cy = 0;
  const setStick = (t) => {
    const r = stick.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy), max = r.width / 2;
    if (len > max) { dx *= max / len; dy *= max / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    touchMove.x = dx / max; touchMove.y = -dy / max;
  };
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier; setStick(t); }, { passive: false });
  const btn = (id, down, up) => {
    const b = document.getElementById(id);
    b.addEventListener('touchstart', (e) => { e.preventDefault(); down(); }, { passive: false });
    if (up) { b.addEventListener('touchend', (e) => { e.preventDefault(); up(); }, { passive: false }); b.addEventListener('touchcancel', up); }
  };
  btn('btnJump', () => (touchJump = true), () => (touchJump = false));
  btn('btnShield', () => (touchShield = true), () => (touchShield = false));
  btn('btnSword', attack);
  btn('btnKiss', tryKiss);
  btn('btnRing', tryPropose);
  document.getElementById('love').addEventListener('touchstart', () => { if (state === 'won' && wonT > 1.5) reset(); });
  renderer.domElement.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]; camId = t.identifier; cx = t.clientX; cy = t.clientY;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (state === 'ask') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) setStick(t);
      else if (t.identifier === camId) {
        camYaw -= (t.clientX - cx) * 0.008;
        camPitch = THREE.MathUtils.clamp(camPitch + (t.clientY - cy) * 0.006, 0.05, 1.2);
        cx = t.clientX; cy = t.clientY;
      }
    }
  }, { passive: false });
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickId = null; touchMove.x = touchMove.y = 0; knob.style.transform = ''; }
      if (t.identifier === camId) camId = null;
    }
  });
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Estado ----------
let player, princess, dog;
let state = 'play'; // play | ask | won | dead
let wonT = 0, hp = MAX_HP, invuln = 0, attackT = 0, hitDone = false, dmgFlash = 0;
const pos = new THREE.Vector3(), vel = new THREE.Vector3(), knock = new THREE.Vector3();
let onGround = true, walkT = 0;
const START = new THREE.Vector3(0, 0, 34);
const PRINCESS_POS = new THREE.Vector3(0, 0.6, CZ - 6);
const DOG_HOME = new THREE.Vector3(-25, 0, 14);
const R = 0.6;
const dogS = { pos: new THREE.Vector3(), hp: DOG_HP, alive: true, respawn: 0, biteCd: 0, hurt: 0, walk: 0, kb: new THREE.Vector3() };

const $ = (id) => document.getElementById(id);
const $prompt = $('prompt'), $love = $('love'), $ask = $('ask'), $over = $('over'), $hp = $('hp'), $bossBar = $('bossBar'), $bossHp = $('bossHp'), $flash = $('flash');

function reset() {
  state = 'play'; wonT = 0; hp = MAX_HP; invuln = 0; attackT = 0;
  pos.copy(START); vel.set(0, 0, 0); knock.set(0, 0, 0); camYaw = 0;
  player.root.rotation.y = Math.PI;
  dogS.pos.copy(DOG_HOME); dogS.hp = DOG_HP; dogS.alive = true; dogS.respawn = 0; dogS.biteCd = 1; dogS.kb.set(0, 0, 0);
  dog.root.visible = true; dog.root.scale.setScalar(1);
  [$love, $ask, $over].forEach((e) => e.classList.add('hidden'));
  hearts.forEach((h) => scene.remove(h.s)); hearts.length = 0;
}

function hits(p, feet, r = R) {
  for (const c of colliders) {
    if (p.x + r > c.min.x && p.x - r < c.max.x && p.z + r > c.min.z && p.z - r < c.max.z &&
        feet + 0.35 < c.max.y && feet + 3 > c.min.y) return c;
  }
  return null;
}
function groundHeight(p) {
  let h = 0;
  for (const c of colliders)
    if (p.x + R * 0.8 > c.min.x && p.x - R * 0.8 < c.max.x && p.z + R * 0.8 > c.min.z && p.z - R * 0.8 < c.max.z && c.max.y <= p.y + 0.4)
      h = Math.max(h, c.max.y);
  return h;
}
function slide(p, dx, dz, r, feet) {
  const a = p.clone(); a.x += dx; if (!hits(a, feet, r)) p.x = a.x;
  const b = p.clone(); b.z += dz; if (!hits(b, feet, r)) p.z = b.z;
}

// ---------- Partículas ----------
function emojiTex(ch) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = { heart: emojiTex('❤️'), ring: emojiTex('💍'), star: emojiTex('💥'), smoke: emojiTex('💨') };
const hearts = [];
function burst(n, center, tex = TEX.heart, spread = 2, up = [1.5, 4]) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const sc = rnd(0.4, 1.1); s.scale.set(sc, sc, sc);
    s.position.set(center.x + rnd(-spread, spread), center.y + rnd(0, spread), center.z + rnd(-spread, spread));
    scene.add(s);
    hearts.push({ s, v: new THREE.Vector3(rnd(-1, 1), rnd(up[0], up[1]), rnd(-1, 1)), life: rnd(1.5, 4), age: 0, ph: Math.random() * 6 });
  }
}
const loveCenter = () => pos.clone().lerp(PRINCESS_POS, 0.5).add(new THREE.Vector3(0, 3, 0));

// ---------- Acciones ----------
const nearPrincess = () => pos.distanceTo(PRINCESS_POS) < KISS_RADIUS;

function faceEachOther() {
  const d = PRINCESS_POS.clone().sub(pos);
  player.root.rotation.y = Math.atan2(d.x, d.z);
  princess.root.rotation.y = Math.atan2(-d.x, -d.z);
}
function win(text, tex) {
  state = 'won'; wonT = 0;
  faceEachOther();
  $('loveText').textContent = text;
  $prompt.classList.add('hidden'); $ask.classList.add('hidden');
  $love.classList.remove('hidden');
  burst(80, loveCenter(), tex);
}
function tryKiss() { if (state === 'play' && player && nearPrincess()) win('Te quiero mucho', TEX.heart); }

function tryPropose() {
  if (state !== 'play' || !player || !nearPrincess()) return;
  state = 'ask'; faceEachOther();
  $prompt.classList.add('hidden');
  const no = $('no'); no.style.left = '60%'; no.style.top = '20px';
  $ask.classList.remove('hidden');
}
$('yes').addEventListener('click', () => { if (state === 'ask') win('¡Dijo que SÍ! 💍', TEX.ring); });
// El botón "No" se escapa 😄
const dodge = (e) => {
  e.preventDefault();
  const no = $('no');
  no.style.left = rnd(0, 75) + '%'; no.style.top = rnd(0, 80) + 'px';
};
$('no').addEventListener('mouseenter', dodge);
$('no').addEventListener('touchstart', dodge, { passive: false });
$('no').addEventListener('click', dodge);
$('retry').addEventListener('click', () => reset());

function attack() {
  if (state !== 'play' || !player || attackT > 0) return;
  attackT = 0.35; hitDone = false;
}

function damage(amount, from) {
  if (invuln > 0 || state !== 'play') return;
  const blocking = shieldHeld();
  if (blocking) {
    // el escudo bloquea si el perro está al frente
    const fwd = new THREE.Vector3(Math.sin(player.root.rotation.y), 0, Math.cos(player.root.rotation.y));
    const to = from.clone().sub(pos).setY(0).normalize();
    if (fwd.dot(to) > 0.2) { amount *= 0.15; burst(4, pos.clone().add(new THREE.Vector3(0, 2, 0)).addScaledVector(fwd, 0.8), TEX.star, 0.3, [0.5, 1.5]); }
  }
  hp = Math.max(0, hp - amount);
  invuln = 0.8; dmgFlash = 0.35;
  knock.copy(pos).sub(from).setY(0).setLength(blocking ? 6 : 12);
  vel.y = 4;
  if (hp <= 0) { state = 'dead'; $over.classList.remove('hidden'); }
}

// ---------- Bucle ----------
const clock = new THREE.Clock();
const UP = new THREE.Vector3(0, 1, 0);

function updatePlayer(dt, t) {
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + touchMove.y;
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touchMove.x;
  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, s);
  const playing = state === 'play';
  const moving = playing && move.lengthSq() > 0.01;
  const blocking = playing && shieldHeld();
  if (moving) {
    move.setLength(SPEED * (blocking ? 0.5 : 1) * dt * Math.min(1, move.length()));
    slide(pos, move.x, move.z, R, pos.y);
    let diff = Math.atan2(move.x, move.z) - player.root.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.root.rotation.y += diff * Math.min(1, dt * 12);
  }
  if (knock.lengthSq() > 0.01) { slide(pos, knock.x * dt, knock.z * dt, R, pos.y); knock.multiplyScalar(Math.max(0, 1 - dt * 6)); }

  const dp = new THREE.Vector3(pos.x - PRINCESS_POS.x, 0, pos.z - PRINCESS_POS.z);
  if (dp.length() < 1.3) pos.add(dp.setLength(1.3 - dp.length()));
  pos.x = THREE.MathUtils.clamp(pos.x, -78, 78); pos.z = THREE.MathUtils.clamp(pos.z, -78, 78);

  if (playing && (keys.Space || touchJump) && onGround) { vel.y = JUMP; onGround = false; }
  vel.y -= GRAVITY * dt;
  pos.y += vel.y * dt;
  const gh = groundHeight(pos);
  if (pos.y <= gh) { pos.y = gh; vel.y = 0; onGround = true; } else onGround = false;

  // Animación
  walkT += moving && onGround ? dt * 10 : 0;
  const sw = moving && onGround ? Math.sin(walkT) * 0.7 : 0;
  player.legL.rotation.x = sw; player.legR.rotation.x = -sw;
  player.armL.rotation.set(-sw, 0, 0); player.armR.rotation.set(sw, 0, 0);
  if (!onGround) player.armL.rotation.x = player.armR.rotation.x = -2.6;
  if (blocking) { player.armL.rotation.set(-1.5, 0, -0.5); }
  if (attackT > 0) {
    attackT -= dt;
    const k = 1 - Math.max(0, attackT) / 0.35;                 // 0 → 1
    player.armR.rotation.set(-2.8 + k * 2.6, 0, 0);            // tajo de arriba hacia abajo
    if (!hitDone && k > 0.4 && dogS.alive) {
      hitDone = true;
      const fwd2 = new THREE.Vector3(Math.sin(player.root.rotation.y), 0, Math.cos(player.root.rotation.y));
      const to = dogS.pos.clone().sub(pos).setY(0);
      if (to.length() < 4.2 && fwd2.dot(to.clone().normalize()) > 0.2) {
        dogS.hp--; dogS.hurt = 0.3;
        dogS.kb.copy(to).setLength(14);
        burst(6, dogS.pos.clone().add(new THREE.Vector3(0, 3, 0)), TEX.star, 0.8, [1, 3]);
        if (dogS.hp <= 0) {
          dogS.alive = false; dogS.respawn = 25;
          burst(25, dogS.pos.clone().add(new THREE.Vector3(0, 2, 0)), TEX.smoke, 2, [0.5, 2]);
        }
      }
    }
  }
  player.root.position.copy(pos);
  // Parpadeo al recibir daño
  player.root.visible = invuln <= 0 || Math.floor(t * 20) % 2 === 0;
  invuln = Math.max(0, invuln - dt);
}

function updateDog(dt, t) {
  const d = dog;
  if (!dogS.alive) {
    d.root.scale.setScalar(Math.max(0.01, d.root.scale.x - dt * 3));
    if (d.root.scale.x <= 0.02) d.root.visible = false;
    if (state === 'play') {
      dogS.respawn -= dt;
      if (dogS.respawn <= 0) {
        dogS.alive = true; dogS.hp = DOG_HP; dogS.pos.copy(DOG_HOME); d.root.visible = true; d.root.scale.setScalar(1);
        burst(15, DOG_HOME.clone().add(new THREE.Vector3(0, 2, 0)), TEX.smoke, 2, [0.5, 2]);
      }
    }
    return;
  }
  const to = pos.clone().sub(dogS.pos).setY(0);
  const dist = to.length();
  const chasing = state === 'play' && dist < 32 && !inCastle(pos);
  let target = null;
  if (chasing) target = pos;
  else if (state === 'play' && dogS.pos.distanceTo(DOG_HOME) > 1.5) target = DOG_HOME;
  let moving = false;
  if (target && dist > 2.6 || (target === DOG_HOME)) {
    const dir = target.clone().sub(dogS.pos).setY(0);
    if (dir.length() > 0.3) {
      dir.setLength((chasing ? DOG_SPEED : DOG_SPEED * 0.6) * dt);
      const before = dogS.pos.clone();
      slide(dogS.pos, dir.x, dir.z, 1.4, 0);
      if (inCastle(dogS.pos)) dogS.pos.copy(before); // el castillo es zona segura
      moving = true;
      d.root.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }
  if (chasing) d.root.rotation.y = Math.atan2(to.x, to.z);
  if (dogS.kb.lengthSq() > 0.01) { slide(dogS.pos, dogS.kb.x * dt, dogS.kb.z * dt, 1.4, 0); dogS.kb.multiplyScalar(Math.max(0, 1 - dt * 6)); }

  // Mordida
  dogS.biteCd -= dt;
  if (chasing && dist < 3.0 && dogS.biteCd <= 0 && pos.y < 2.2) { dogS.biteCd = 1.2; damage(BITE, dogS.pos); }

  // Animación
  dogS.walk += moving ? dt * (chasing ? 12 : 7) : 0;
  const sw = moving ? Math.sin(dogS.walk) * 0.6 : 0;
  d.legs[0].rotation.x = d.legs[3].rotation.x = sw;
  d.legs[1].rotation.x = d.legs[2].rotation.x = -sw;
  d.tail.rotation.y = Math.sin(t * (chasing ? 14 : 5)) * 0.6;
  d.heads.forEach((h, i) => {
    const bite = dogS.biteCd > 0.9 ? Math.sin((1.2 - dogS.biteCd) * 30) * 0.4 : 0;
    h.n.rotation.x = Math.sin(t * 3 + i * 2) * 0.12 + bite;
    h.eyeGlow.material.opacity = chasing ? 0.6 + Math.sin(t * 10) * 0.3 : 0;
  });
  dogS.hurt = Math.max(0, dogS.hurt - dt);
  d.body.position.y = dogS.hurt > 0 ? 0.3 : 0;
  d.root.position.copy(dogS.pos);

  $bossBar.classList.toggle('hidden', dist > 34);
  $bossHp.style.width = (dogS.hp / DOG_HP) * 100 + '%';
}

function update(dt) {
  const t = clock.elapsedTime;
  star.rotation.y += dt * 2;
  updatePlayer(dt, t);
  updateDog(dt, t);

  // Princesa
  princess.body.position.y = Math.sin(t * 2) * 0.05;
  if (state === 'play') {
    const d = pos.clone().sub(PRINCESS_POS);
    if (d.length() < 15) princess.root.rotation.y = Math.atan2(d.x, d.z);
    princess.armR.rotation.x = d.length() < 15 ? -2.6 + Math.sin(t * 8) * 0.3 : 0;
  }
  if (state === 'won') {
    wonT += dt;
    const k = Math.min(wonT * 2, 1);
    player.body.rotation.x = princess.body.rotation.x = k * 0.35;
    player.armL.rotation.set(-1.2 * k, 0, 0); player.armR.rotation.set(-1.2 * k, 0, 0);
    princess.armL.rotation.x = princess.armR.rotation.x = -1.2 * k;
    if (Math.random() < dt * 20) burst(1, loveCenter(), $('loveText').textContent.includes('SÍ') && Math.random() < 0.3 ? TEX.ring : TEX.heart);
  } else {
    player.body.rotation.x = princess.body.rotation.x = 0;
    if (state !== 'ask') princess.armL.rotation.x = 0;
  }

  // HUD
  $hp.style.width = (hp / MAX_HP) * 100 + '%';
  $hp.style.background = hp > 50 ? '' : hp > 25 ? 'linear-gradient(#ffe066,#f59f00)' : 'linear-gradient(#ff8787,#e03131)';
  dmgFlash = Math.max(0, dmgFlash - dt);
  $flash.style.opacity = dmgFlash > 0 ? 0.35 : 0;
  const showPrompt = state === 'play' && nearPrincess();
  $prompt.classList.toggle('hidden', !showPrompt);
  if (showPrompt) $prompt.innerHTML = isTouch ? 'Toca 💋 para besar · 💍 para proponer' : '<b>K</b>: besar 💋 · <b>P</b>: ¿Quieres ser mi novia? 💍';

  // Partículas
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.age += dt;
    h.s.position.addScaledVector(h.v, dt);
    h.s.position.x += Math.sin(t * 3 + h.ph) * dt * 0.8;
    h.s.material.opacity = 1 - h.age / h.life;
    if (h.age > h.life) { scene.remove(h.s); h.s.material.dispose(); hearts.splice(i, 1); }
  }

  // Cámara
  const close = state === 'won' || state === 'ask';
  const dist = close ? 7 : 10;
  const focus = close ? pos.clone().lerp(PRINCESS_POS, 0.5) : pos.clone();
  focus.y += 2.2;
  const camPos = new THREE.Vector3(
    focus.x + Math.sin(camYaw) * Math.cos(camPitch) * dist,
    focus.y + Math.sin(camPitch) * dist,
    focus.z + Math.cos(camYaw) * Math.cos(camPitch) * dist);
  camera.position.lerp(camPos, Math.min(1, dt * 6));
  camera.lookAt(focus);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ---------- Inicio ----------
Promise.all([loadImg(PHOTO), loadImg(DOG_PHOTO)]).then(([img, dogImg]) => {
  player = makeCharacter(cropTexture(img, CROP_PLAYER), { skin: 0xd9a27e, hair: 0x1b1b1b, shirt: 0x263238, pants: 0x37474f, cap: 0x111111, armed: true });
  princess = makeCharacter(cropTexture(img, CROP_PRINCESS), { skin: 0xd99a7a, hair: 0x2b1a12, shirt: 0xf06292, pants: 0xf06292, dress: 0xec407a, longHair: true, crown: true });
  princess.root.position.copy(PRINCESS_POS);
  dog = makeCerberus(cropTexture(dogImg, CROP_DOG));
  reset();
  camera.position.set(0, 6, START.z + 10);
  $('loading').remove();
  loop();
}).catch((src) => ($('loading').textContent = 'No se encontró ' + src));
