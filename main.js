import * as THREE from 'three';

// ---------- Config ----------
const PHOTO = 'foto.jpg';
// Recortes (x, y, tamaño) sobre la foto de 1152x864
const CROP_PLAYER = { x: 700, y: 200, s: 320 };   // chico (derecha)
const CROP_PRINCESS = { x: 425, y: 165, s: 300 }; // chica (izquierda)
const SPEED = 7, JUMP = 9, GRAVITY = 24, KISS_RADIUS = 2.6;

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

const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
const colliders = []; // {min: Vector3, max: Vector3}

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

// Camino
for (let i = 0; i < 14; i++) block(3, 0.05, 3, 0, 0, 30 - i * 3.2, 0xc8a165, false);

function tree(x, z) {
  block(0.8, 3, 0.8, x, 0, z, 0x8b5a2b);
  const l = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), mat(0x2e7d32));
  l.position.set(x, 4.2, z); l.castShadow = true; scene.add(l);
}
const rnd = (a, b) => a + Math.random() * (b - a);
for (let i = 0; i < 40; i++) {
  let x = rnd(-70, 70), z = rnd(-70, 70);
  if (Math.abs(x) < 6 && z > -15) continue;           // libre el camino
  if (Math.abs(x) < 16 && z < -10 && z > -40) continue; // libre el castillo
  tree(x, z);
}
// Flores
const flowerColors = [0xff4081, 0xffeb3b, 0xffffff, 0xba68c8];
for (let i = 0; i < 80; i++) block(0.3, 0.3, 0.3, rnd(-60, 60), 0, rnd(-60, 60), flowerColors[i % 4], false);

// Obstáculos y plataformas para saltar
block(2, 1, 2, -2.5, 0, 18, 0x9e9e9e);
block(2, 1.2, 2, 2.5, 0, 12, 0x9e9e9e);
block(6, 1, 1, 0, 0, 6, 0x795548); // valla: hay que saltar
block(2, 1, 2, 6, 0, 3, 0xff9800);
block(2, 2, 2, 9, 0, 0, 0xff9800);
block(2, 3, 2, 12, 0, -3, 0xff9800);
const star = block(1, 1, 1, 12, 3, -3, 0xffd700, false); // decorativo

// Castillo
const CZ = -25, STONE = 0xbdbdbd, ROOF = 0xe91e63;
block(24, 5, 1.5, 0, 0, CZ - 10, STONE);           // muro trasero
block(1.5, 5, 20, -12, 0, CZ, STONE);              // muro izq
block(1.5, 5, 20, 12, 0, CZ, STONE);               // muro der
block(9, 5, 1.5, -7.5, 0, CZ + 10, STONE);         // frente izq
block(9, 5, 1.5, 7.5, 0, CZ + 10, STONE);          // frente der (puerta en medio)
block(6, 1, 1.5, 0, 4, CZ + 10, STONE);            // dintel
for (const [x, z] of [[-12, CZ - 10], [12, CZ - 10], [-12, CZ + 10], [12, CZ + 10]]) {
  block(4, 9, 4, x, 0, z, 0xa0a0a0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 4), mat(ROOF));
  roof.position.set(x, 11, z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
}
for (let x = -11; x <= 11; x += 2) block(1, 1, 1.5, x, 5, CZ - 10, STONE); // almenas
// Alfombra y estrado
block(3, 0.06, 16, 0, 0, CZ + 1, 0xc2185b, false);
block(5, 0.6, 4, 0, 0, CZ - 6, 0xf8bbd0);

// ---------- Personajes estilo bloque ----------
function faceTexture(img, c) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.drawImage(img, c.x, c.y, c.s, c.s, 0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCharacter(tex, o) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const part = (w, h, d, color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z); m.castShadow = true; return m;
  };
  const skin = mat(o.skin);
  const headMats = [skin, skin, mat(o.hair), skin, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), mat(o.hair)];
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), headMats);
  head.position.y = 2.75; head.castShadow = true; body.add(head);
  body.add(part(1.4, 1.4, 0.7, o.shirt, 0, 1.5, 0));
  const pivot = (x, y, mesh) => { const p = new THREE.Group(); p.position.set(x, y, 0); mesh.position.y = -0.6; p.add(mesh); body.add(p); return p; };
  const armL = pivot(-0.95, 2.1, part(0.5, 1.3, 0.6, o.skin, 0, 0, 0));
  const armR = pivot(0.95, 2.1, part(0.5, 1.3, 0.6, o.skin, 0, 0, 0));
  const legL = pivot(-0.35, 0.8, part(0.65, 1.2, 0.65, o.pants, 0, 0, 0));
  const legR = pivot(0.35, 0.8, part(0.65, 1.2, 0.65, o.pants, 0, 0, 0));
  legL.children[0].position.y = legR.children[0].position.y = -0.4;
  if (o.cap) { // gorra hacia atrás
    body.add(part(1.2, 0.3, 1.2, o.cap, 0, 3.4, 0));
    body.add(part(0.9, 0.12, 0.6, o.cap, 0, 3.3, -0.8));
  }
  if (o.longHair) {
    body.add(part(1.2, 1.6, 0.25, o.hair, 0, 2.5, -0.62));
    body.add(part(0.15, 1.3, 1.0, o.hair, -0.62, 2.55, -0.05));
    body.add(part(0.15, 1.3, 1.0, o.hair, 0.62, 2.55, -0.05));
  }
  if (o.crown) {
    body.add(part(1.1, 0.25, 1.1, 0xffd700, 0, 3.42, 0));
    for (const [x, z] of [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45], [0, 0.45]])
      body.add(part(0.2, 0.35, 0.2, 0xffd700, x, 3.7, z));
  }
  if (o.dress) body.add(part(1.7, 0.9, 1.0, o.dress, 0, 0.45, 0));
  scene.add(root);
  return { root, body, head, armL, armR, legL, legR };
}

// ---------- Entrada ----------
const keys = {};
let camYaw = 0, camPitch = 0.35, dragging = false, lastX = 0, lastY = 0;
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyK' || e.code === 'Enter' || e.code === 'NumpadEnter') tryKiss();
  if (e.code === 'KeyR' && won) reset();
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
// ---------- Controles táctiles ----------
const touchMove = { x: 0, y: 0 };
let touchJump = false;
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.body.classList.add('touch');
  document.getElementById('touch').classList.remove('hidden');
  document.getElementById('again').textContent = 'Toca la pantalla para jugar de nuevo';
  document.getElementById('prompt').innerHTML = 'Toca 💋 para besar';
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let stickId = null;
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
    if (up) b.addEventListener('touchend', (e) => { e.preventDefault(); up(); }, { passive: false });
  };
  btn('btnJump', () => (touchJump = true), () => (touchJump = false));
  btn('btnKiss', () => tryKiss());
  document.getElementById('love').addEventListener('touchstart', () => { if (won && kissT > 1.5) reset(); });
  // Cámara: arrastrar en cualquier otra zona
  let camId = null, cx = 0, cy = 0;
  renderer.domElement.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]; camId = t.identifier; cx = t.clientX; cy = t.clientY;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
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
let player, princess, won = false, kissT = 0;
const pos = new THREE.Vector3(), vel = new THREE.Vector3();
let onGround = true, walkT = 0;
const START = new THREE.Vector3(0, 0, 34);
const PRINCESS_POS = new THREE.Vector3(0, 0.6, CZ - 6);
const R = 0.6; // radio del jugador
const $prompt = document.getElementById('prompt'), $love = document.getElementById('love');

function reset() {
  won = false; kissT = 0;
  pos.copy(START); vel.set(0, 0, 0); camYaw = 0;
  player.root.rotation.y = Math.PI;
  $love.classList.add('hidden');
  hearts.forEach((h) => scene.remove(h.s)); hearts.length = 0;
}

function hits(p, feet) {
  for (const c of colliders) {
    if (p.x + R > c.min.x && p.x - R < c.max.x && p.z + R > c.min.z && p.z - R < c.max.z &&
        feet + 0.35 < c.max.y && feet + 3 > c.min.y) return c;
  }
  return null;
}
function groundHeight(p) {
  let h = 0;
  for (const c of colliders)
    if (p.x + R * 0.8 > c.min.x && p.x - R * 0.8 < c.max.x && p.z + R * 0.8 > c.min.z && p.z - R * 0.8 < c.max.z && c.max.y <= pos.y + 0.4)
      h = Math.max(h, c.max.y);
  return h;
}

// ---------- Corazones ----------
const heartTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.font = '110px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('❤️', 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const hearts = [];
function spawnHearts(n, center) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }));
    const sc = rnd(0.4, 1.1);
    s.scale.set(sc, sc, sc);
    s.position.set(center.x + rnd(-2, 2), center.y + rnd(0, 2), center.z + rnd(-2, 2));
    scene.add(s);
    hearts.push({ s, v: new THREE.Vector3(rnd(-1, 1), rnd(1.5, 4), rnd(-1, 1)), life: rnd(2.5, 4.5), age: 0, ph: Math.random() * 6 });
  }
}

function nearPrincess() { return pos.distanceTo(PRINCESS_POS) < KISS_RADIUS + 0.8; }

function tryKiss() {
  if (won || !player || !nearPrincess()) return;
  won = true; kissT = 0;
  // Mirarse el uno al otro
  const d = PRINCESS_POS.clone().sub(pos);
  player.root.rotation.y = Math.atan2(d.x, d.z);
  princess.root.rotation.y = Math.atan2(-d.x, -d.z);
  $prompt.classList.add('hidden');
  $love.classList.remove('hidden');
  spawnHearts(80, pos.clone().lerp(PRINCESS_POS, 0.5).add(new THREE.Vector3(0, 3, 0)));
}

// ---------- Bucle ----------
const clock = new THREE.Clock();
function update(dt) {
  const t = clock.elapsedTime;
  star.rotation.y += dt * 2;

  // Movimiento relativo a la cámara
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + touchMove.y;
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touchMove.x;
  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, s);
  const moving = !won && move.lengthSq() > 0;
  if (moving) {
    move.setLength(SPEED * dt * Math.min(1, move.length()));
    const nx = pos.clone(); nx.x += move.x; if (!hits(nx, pos.y)) pos.x = nx.x;
    const nz = pos.clone(); nz.z += move.z; if (!hits(nz, pos.y)) pos.z = nz.z;
    const target = Math.atan2(move.x, move.z);
    let diff = target - player.root.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.root.rotation.y += diff * Math.min(1, dt * 12);
  }
  // No dejar que se meta en la princesa
  const dp = new THREE.Vector3(pos.x - PRINCESS_POS.x, 0, pos.z - PRINCESS_POS.z);
  if (dp.length() < 1.3) pos.add(dp.setLength(1.3 - dp.length()));
  pos.x = THREE.MathUtils.clamp(pos.x, -78, 78); pos.z = THREE.MathUtils.clamp(pos.z, -78, 78);

  // Salto y gravedad
  if (!won && (keys.Space || touchJump) && onGround) { vel.y = JUMP; onGround = false; }
  vel.y -= GRAVITY * dt;
  pos.y += vel.y * dt;
  const gh = groundHeight(pos);
  if (pos.y <= gh) { pos.y = gh; vel.y = 0; onGround = true; } else onGround = false;
  if (vel.y > 0) { const c = hits(pos, pos.y); if (c && c.min.y > pos.y) { vel.y = 0; } }

  // Animación de caminar
  walkT += moving && onGround ? dt * 10 : 0;
  const sw = moving && onGround ? Math.sin(walkT) * 0.7 : 0;
  player.legL.rotation.x = sw; player.legR.rotation.x = -sw;
  player.armL.rotation.x = -sw; player.armR.rotation.x = sw;
  if (!onGround) { player.armL.rotation.x = player.armR.rotation.x = -2.6; }
  player.root.position.copy(pos);

  // Princesa: respira y saluda
  princess.body.position.y = Math.sin(t * 2) * 0.05;
  if (!won) {
    const d = pos.clone().sub(PRINCESS_POS);
    if (d.length() < 15) princess.root.rotation.y = Math.atan2(d.x, d.z);
    princess.armR.rotation.x = d.length() < 15 ? -2.6 + Math.sin(t * 8) * 0.3 : 0;
  }

  // Beso
  if (won) {
    kissT += dt;
    const lean = Math.min(kissT * 2, 1) * 0.35;
    player.body.rotation.x = princess.body.rotation.x = lean;
    player.armL.rotation.x = player.armR.rotation.x = -1.2 * Math.min(kissT * 2, 1);
    princess.armL.rotation.x = princess.armR.rotation.x = -1.2 * Math.min(kissT * 2, 1);
    if (Math.random() < dt * 20) spawnHearts(1, pos.clone().lerp(PRINCESS_POS, 0.5).add(new THREE.Vector3(0, 3, 0)));
  } else {
    player.body.rotation.x = princess.body.rotation.x = 0;
    princess.armL.rotation.x = 0;
  }
  $prompt.classList.toggle('hidden', won || !nearPrincess());

  // Corazones
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.age += dt;
    h.s.position.addScaledVector(h.v, dt);
    h.s.position.x += Math.sin(t * 3 + h.ph) * dt * 0.8;
    h.s.material.opacity = 1 - h.age / h.life;
    if (h.age > h.life) { scene.remove(h.s); h.s.material.dispose(); hearts.splice(i, 1); }
  }

  // Cámara en tercera persona
  const dist = won ? 7 : 10;
  const focus = won ? pos.clone().lerp(PRINCESS_POS, 0.5) : pos.clone();
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
const img = new Image();
img.onload = () => {
  player = makeCharacter(faceTexture(img, CROP_PLAYER), { skin: 0xd9a27e, hair: 0x1b1b1b, shirt: 0x263238, pants: 0x37474f, cap: 0x111111 });
  princess = makeCharacter(faceTexture(img, CROP_PRINCESS), { skin: 0xd99a7a, hair: 0x2b1a12, shirt: 0xf06292, pants: 0xf06292, dress: 0xec407a, longHair: true, crown: true });
  princess.root.position.copy(PRINCESS_POS);
  reset();
  camera.position.set(0, 6, START.z + 10);
  document.getElementById('loading').remove();
  loop();
};
img.onerror = () => (document.getElementById('loading').textContent = 'No se encontró ' + PHOTO);
img.src = PHOTO;
