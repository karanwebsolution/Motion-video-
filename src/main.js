import * as THREE from 'three';
import './style.css';

const mount = document.querySelector('#hero3d');
if (mount) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 7.4);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mount.appendChild(renderer.domElement);

  const group = new THREE.Group(); scene.add(group);
  const coreGeo = new THREE.IcosahedronGeometry(1.04, 5);
  const coreMat = new THREE.MeshPhysicalMaterial({ color: 0x9f7650, metalness: 0.82, roughness: 0.19, clearcoat: 1, clearcoatRoughness: 0.12 });
  const core = new THREE.Mesh(coreGeo, coreMat); group.add(core);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.07, 2), new THREE.MeshBasicMaterial({ color: 0xe6c7a2, wireframe: true, transparent: true, opacity: 0.17 })); group.add(wire);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a47a, transparent: true, opacity: 0.52, side: THREE.DoubleSide });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.004, 8, 220), ringMat); ring1.rotation.set(1.08, .12, .38); group.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.84, 0.003, 8, 220), new THREE.MeshBasicMaterial({ color: 0xe8dcc9, transparent: true, opacity: .22 })); ring2.rotation.set(.45, .82, -.55); group.add(ring2);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.055, 20, 20), new THREE.MeshBasicMaterial({ color: 0xf4d6ab })); dot.position.set(1.28, .9, .25); group.add(dot);
  scene.add(new THREE.AmbientLight(0x9e8a75, 1.45));
  const key = new THREE.PointLight(0xffdfb4, 62, 18); key.position.set(3.2, 2.8, 4.5); scene.add(key);
  const fill = new THREE.PointLight(0x7d8b99, 30, 15); fill.position.set(-3, -1.5, 2.2); scene.add(fill);
  const mouse = new THREE.Vector2(); let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', e => { targetX = ((e.clientX / window.innerWidth) - .5) * .28; targetY = ((e.clientY / window.innerHeight) - .5) * .2; }, { passive: true });
  const resize = () => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
  new ResizeObserver(resize).observe(mount);
  const clock = new THREE.Clock();
  function animate() { requestAnimationFrame(animate); const t = clock.getElapsedTime(); group.rotation.y += .0026; group.rotation.x += (targetY - group.rotation.x) * .025; group.rotation.y += (targetX - group.rotation.y) * .025; core.rotation.y = Math.sin(t * .27) * .16; core.rotation.x = Math.cos(t * .23) * .12; wire.rotation.y = -t * .045; ring1.rotation.z += .0018; ring2.rotation.x += .0009; dot.position.y = .9 + Math.sin(t * .8) * .06; renderer.render(scene, camera); }
  animate();
}

const video = document.querySelector('#studioVideo');
const play = document.querySelector('.play-button');
play?.addEventListener('click', async () => {
  if (video.paused) { try { await video.play(); } catch (e) { console.warn('Video could not play:', e); } }
  else video.pause();
});
video?.addEventListener('play', () => play?.classList.add('is-playing'));
video?.addEventListener('pause', () => play?.classList.remove('is-playing'));

const toggle = document.querySelector('.menu-toggle');
toggle?.addEventListener('click', () => { document.body.classList.toggle('menu-open'); toggle.setAttribute('aria-label', document.body.classList.contains('menu-open') ? 'Close menu' : 'Open menu'); });
document.querySelectorAll('.desktop-nav a').forEach(link => link.addEventListener('click', () => document.body.classList.remove('menu-open')));

const revealItems = document.querySelectorAll('.intro-grid, .stats-row, .work-heading, .project, .service-item, .motion-copy, .motion-frame');
revealItems.forEach(el => el.classList.add('will-reveal'));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: .12 });
revealItems.forEach(el => observer.observe(el));

// Auto-playing guided cursor walkthrough (self-contained; no third-party tour dependency).
const tour = (() => {
  const shade = document.querySelector('#tour-shade');
  const frame = document.querySelector('#tour-frame');
  const cursor = document.querySelector('#tour-cursor');
  const card = document.querySelector('#tour-card');
  const progress = document.querySelector('#tour-progress');
  const stepCount = document.querySelector('#tour-step-count');
  const title = document.querySelector('#tour-title');
  const copy = document.querySelector('#tour-copy');
  const nextButton = document.querySelector('#tour-next');
  const pauseButton = document.querySelector('#tour-pause');
  if (!shade || !frame || !cursor || !card) return null;

  const steps = [
    { target: '#hero-button', title: 'Start with a new perspective.', copy: 'This little arrow takes you straight to a selection of our work.' },
    { target: '.project-large .project-visual', title: 'Made to matter.', copy: 'Every project starts with a point of view—and is made with intention.' },
    { target: '.motion-frame', title: 'A world in motion.', copy: 'We bring ideas to life through film, atmosphere and moving image.' },
    { target: '.services-layout', title: 'Small team, broad thinking.', copy: 'From brand worlds to digital experiences, the right people shape each project.' },
    { target: '.contact-section h2', title: 'Have something in mind?', copy: 'Good things start with a conversation. We would love to hear yours.' }
  ];
  const stepMs = 4800;
  let current = 0, timer = null, remaining = stepMs, startedAt = 0, paused = false, serial = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function placeStep(index, token) {
    const step = steps[index];
    const target = document.querySelector(step.target);
    if (!target) { finish(); return; }
    target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center', inline: 'center' });
    window.setTimeout(() => {
      if (token !== serial || paused) return;
      const r = target.getBoundingClientRect();
      const x = Math.max(14, Math.min(innerWidth - 14, r.left + r.width / 2));
      const y = Math.max(14, Math.min(innerHeight - 14, r.top + r.height / 2));
      const radius = Math.max(55, Math.min(132, Math.hypot(r.width, r.height) / 2 + 20));
      shade.style.setProperty('--spot-x', `${x}px`);
      shade.style.setProperty('--spot-y', `${y}px`);
      shade.style.setProperty('--spot-r', `${radius}px`);
      frame.style.left = `${Math.max(5, r.left - 7)}px`;
      frame.style.top = `${Math.max(5, r.top - 7)}px`;
      frame.style.width = `${Math.min(innerWidth - 10, r.width + 14)}px`;
      frame.style.height = `${Math.min(innerHeight - 10, r.height + 14)}px`;
      cursor.style.left = `${Math.min(innerWidth - 32, x + Math.min(22, r.width / 3))}px`;
      cursor.style.top = `${Math.min(innerHeight - 42, y + Math.min(15, r.height / 4))}px`;
      cursor.classList.remove('clicking'); void cursor.offsetWidth; cursor.classList.add('clicking');
      stepCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
      title.textContent = step.title; copy.textContent = step.copy;
      nextButton.innerHTML = index === steps.length - 1 ? 'FINISH <span>↗</span>' : 'NEXT <span>→</span>';
      if (innerWidth > 650) {
        const w = Math.min(340, innerWidth - 34), h = card.offsetHeight || 175;
        let left = r.left + r.width / 2 < innerWidth / 2 ? r.right + 22 : r.left - w - 22;
        left = Math.max(17, Math.min(innerWidth - w - 17, left));
        let top = Math.max(94, Math.min(innerHeight - h - 22, y - h / 2));
        card.style.left = `${left}px`; card.style.top = `${top}px`;
      }
      remaining = stepMs; runProgress(stepMs);
    }, reducedMotion ? 0 : 680);
  }
  function runProgress(duration) {
    clearTimeout(timer);
    progress.style.transition = 'none'; progress.style.width = '0%';
    void progress.offsetWidth;
    progress.style.transition = `width ${duration}ms linear`; progress.style.width = '100%';
    startedAt = Date.now(); timer = window.setTimeout(next, duration);
  }
  function start(index = 0) {
    serial++; current = index; paused = false; remaining = stepMs;
    document.body.classList.add('tour-running'); card.hidden = false;
    pauseButton.innerHTML = 'Ⅱ <span>PAUSE</span>';
    try { localStorage.setItem('forma-tour-seen', '1'); } catch {}
    placeStep(current, serial);
  }
  function next() {
    if (paused) return;
    clearTimeout(timer);
    if (current >= steps.length - 1) { finish(); return; }
    current++; serial++; placeStep(current, serial);
  }
  function finish() {
    serial++; clearTimeout(timer); paused = false;
    document.body.classList.remove('tour-running'); card.hidden = true;
    frame.style.width = '0px'; frame.style.height = '0px';
  }
  function togglePause() {
    if (!document.body.classList.contains('tour-running')) return;
    if (!paused) {
      paused = true; clearTimeout(timer); remaining = Math.max(700, remaining - (Date.now() - startedAt));
      const width = getComputedStyle(progress).width; progress.style.transition = 'none'; progress.style.width = width;
      pauseButton.innerHTML = '▶ <span>RESUME</span>';
    } else {
      paused = false; pauseButton.innerHTML = 'Ⅱ <span>PAUSE</span>'; serial++;
      placeStep(current, serial);
    }
  }
  document.querySelector('#tour-trigger')?.addEventListener('click', () => start(0));
  document.querySelector('#tour-close')?.addEventListener('click', finish);
  nextButton.addEventListener('click', next);
  pauseButton.addEventListener('click', togglePause);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') finish(); if (e.key === 'ArrowRight' && document.body.classList.contains('tour-running')) next(); });
  window.addEventListener('resize', () => { if (document.body.classList.contains('tour-running') && !paused) { serial++; placeStep(current, serial); } }, { passive: true });
  if (!reducedMotion) {
    let seen = false; try { seen = localStorage.getItem('forma-tour-seen') === '1'; } catch {}
    if (!seen) window.setTimeout(() => start(0), 1200);
  }
  return { start, finish };
})();
