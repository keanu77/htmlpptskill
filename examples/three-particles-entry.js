// 封面 3D 粒子（Three.js）：只在指定 slide 顯示時跑 render loop；滑鼠微幅視差。
import { Scene, PerspectiveCamera, WebGLRenderer, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, AdditiveBlending, Color, CanvasTexture } from 'three';
// 圓形柔光 sprite（用 canvas 畫，不用外部圖）
function dotTexture() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new CanvasTexture(c); }
window.initCoverParticles = function (host, opts = {}) {
  const N = opts.count || 1600, W = host.clientWidth || 1280, H = host.clientHeight || 720;
  const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0);
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  host.appendChild(renderer.domElement);
  const scene = new Scene(), camera = new PerspectiveCamera(60, W / H, 1, 2000); camera.position.z = 600;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const palette = [new Color(0x3FC1B7), new Color(0xF2B84B), new Color(0xF3F7F8)];
  for (let i = 0; i < N; i++) { pos[i*3] = (Math.random() - .5) * 1800; pos[i*3+1] = (Math.random() - .5) * 1000; pos[i*3+2] = (Math.random() - .5) * 1200;
    const c = palette[i % 7 === 0 ? 1 : i % 3 === 0 ? 2 : 0]; col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b; }
  const geo = new BufferGeometry(); geo.setAttribute('position', new Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new Float32BufferAttribute(col, 3));
  const pts = new Points(geo, new PointsMaterial({ size: 9, map: dotTexture(), vertexColors: true, transparent: true, opacity: .85, blending: AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  scene.add(pts);
  let running = false, raf = 0, mx = 0, my = 0, t = 0;
  addEventListener('mousemove', e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  function frame() { if (!running) return; t += 0.0025; pts.rotation.y = t + mx * 0.15; pts.rotation.x = Math.sin(t * 0.7) * 0.08 + my * 0.1;
    const p = geo.attributes.position.array; for (let i = 1; i < p.length; i += 3) { p[i] += 0.25; if (p[i] > 500) p[i] = -500; } geo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera); raf = requestAnimationFrame(frame); }
  return { start() { if (running) return; running = true; frame(); }, stop() { running = false; cancelAnimationFrame(raf); },
    resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); } };
};
