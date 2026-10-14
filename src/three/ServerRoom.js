import * as THREE from 'three';

const TAU = Math.PI * 2;
const RACK_GAP = 3.5;
const cx = (r, n) => (r - (n - 1) / 2) * RACK_GAP; // x position of rack r
const HOME_LOOK = [0, 3, -2];
const BACK_ROWS_Z = [-5, -10]; // decorative rows of racks behind the clickable one

function makeTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const labelTexture = (a, b) =>
  makeTexture(512, 128, (x) => {
    x.fillStyle = '#0d1b2a';
    x.fillRect(0, 0, 512, 128);
    x.font = 'bold 42px monospace';
    x.fillStyle = '#d6e2ee';
    x.fillText(a, 22, 62);
    x.font = '28px monospace';
    x.fillStyle = '#6f8499';
    x.fillText(b, 22, 104);
  });

// raised-floor tile: dark panel, lighter seams, perforation dots
function tileTexture(repX, repY) {
  const t = makeTexture(128, 128, (x) => {
    x.fillStyle = '#0e1923';
    x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#223a50';
    x.lineWidth = 4;
    x.strokeRect(0, 0, 128, 128);
    x.fillStyle = '#17293a';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(24 + i * 27, 24 + j * 27, 3, 0, TAU); x.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  t.anisotropy = 8;
  return t;
}

const signTexture = () =>
  makeTexture(1024, 160, (x) => {
    x.clearRect(0, 0, 1024, 160);
    x.font = 'bold 84px monospace';
    x.fillStyle = '#d6e2ee';
    x.textAlign = 'center';
    x.fillText('ASHUTOSH', 512, 80);
    x.font = '34px monospace';
    x.fillStyle = '#4be3a0';
    x.fillText('BACKEND  ·  ZONE A  ·  ALL SYSTEMS ONLINE', 512, 134);
  });

export default class ServerRoom {
  constructor({ canvas, labels, sections, racks, onPick }) {
    this.canvas = canvas;
    this.labelsEl = labels;
    this.onPick = onPick;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.units = [];
    this.decoLeds = [];
    this.labelEls = [];
    this.sel = null;
    this.hover = null;
    this.auto = !this.reduce;
    this.dragging = false;
    this.moved = 0;
    this.lx = 0;
    this.ly = 0;
    this.pts = new Map();
    this.pd = 0;
    this.pulseCurve = null;
    this.pulseT = 0;
    this.pulseCb = null;
    this.v = new THREE.Vector3();
    this.ray = new THREE.Raycaster();
    this.mp = new THREE.Vector2();

    this.nRacks = racks.length;
    this.rt = 0;
    // intro: a short sideways glide and dolly-in, always at eye level (no swoop from above)
    this.th = 1.2; this.tth = 0.45;
    this.ph = this.tph = 1.32;
    this.trad = this.homeRad(); this.rad = this.trad * 1.25;
    this.look = new THREE.Vector3(...HOME_LOOK);
    this.tlook = this.look.clone();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070d14);
    this.scene.fog = new THREE.Fog(0x070d14, 22, 50);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

    this.buildRoom();
    this.buildRacks(sections, racks);
    this.buildBackRows();
    this.buildGateway();
    this.buildDust();
    this.buildRipple();
    this.bind();
    this.onResize();
    this.t0 = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  isMobile() { return innerWidth < 760; }
  homeRad() { return this.isMobile() ? 25 : 16; }
  maxRad() { return this.isMobile() ? 26 : 17; } // desktop max keeps the camera inside the room

  makeLabel(text) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = text;
    this.labelsEl.appendChild(el);
    this.labelEls.push(el);
    return el;
  }

  box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    this.scene.add(m);
    return m;
  }

  // ---------- the room itself ----------
  buildRoom() {
    const s = this.scene;

    // walls + ceiling (inside faces only, so the camera can orbit outside like a cutaway)
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(26, 9, 40),
      new THREE.MeshStandardMaterial({ color: 0x111e2b, roughness: 0.9, metalness: 0.1, side: THREE.BackSide })
    );
    shell.position.set(0, 4.5, -3);
    s.add(shell);

    // raised tile floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 40),
      new THREE.MeshStandardMaterial({ map: tileTexture(13, 20), metalness: 0.55, roughness: 0.4 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -3);
    s.add(floor);

    // lighting: cool fill, key from above, cyan and amber accents
    s.add(new THREE.AmbientLight(0x6f8fb5, 1.1));
    s.add(new THREE.HemisphereLight(0x9fc4ff, 0x0b1218, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 10, 12);
    s.add(key);
    const cyan = new THREE.PointLight(0x59c8ff, 90, 40, 2);
    cyan.position.set(-8, 6, 4);
    const amber = new THREE.PointLight(0xffb347, 70, 40, 2);
    amber.position.set(8, 5, 5);
    s.add(cyan, amber);

    // ceiling light strips and cable trays
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xdff1ff });
    [6, 1, -4, -9, -14, -19].forEach((z) => this.box(14, 0.06, 0.35, lightMat, 0, 8.85, z));
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x0a1118, metalness: 0.6, roughness: 0.5 });
    [-2.5, -7.5].forEach((z) => this.box(24, 0.25, 0.9, trayMat, 0, 8.3, z));

    // glowing wall trim
    const trim = new THREE.MeshBasicMaterial({ color: 0x1f6fa8 });
    [2.2, 6.2].forEach((y) => {
      this.box(0.05, 0.05, 40, trim, -12.9, y, -3);
      this.box(0.05, 0.05, 40, trim, 12.9, y, -3);
      this.box(26, 0.05, 0.05, trim, 0, y, -22.9);
    });

    // sign on the back wall
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1.56),
      new THREE.MeshBasicMaterial({ map: signTexture(), transparent: true })
    );
    sign.position.set(0, 4.4, -22.85);
    s.add(sign);

    // cold-aisle light strips on the floor
    const aisle = new THREE.MeshBasicMaterial({ color: 0x59c8ff, transparent: true, opacity: 0.55 });
    [-2.5, -7.5].forEach((z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.14), aisle);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.015, z);
      s.add(m);
    });
  }

  // a solid rack cabinet: base, top cap, side panels, back panel, glowing top strip
  rackShell(x, z) {
    const m = new THREE.MeshStandardMaterial({ color: 0x0b1118, metalness: 0.6, roughness: 0.5 });
    const add = (w, h, d, px, py, pz) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x + px, py, z + pz);
      this.scene.add(b);
    };
    add(2.6, 0.1, 1.7, 0, 0.05, 0);
    add(2.6, 0.1, 1.7, 0, 4.75, 0);
    add(0.08, 4.8, 1.7, -1.26, 2.4, 0);
    add(0.08, 4.8, 1.7, 1.26, 2.4, 0);
    add(2.6, 4.8, 0.08, 0, 2.4, -0.81);
    this.box(2.2, 0.04, 0.05, new THREE.MeshBasicMaterial({ color: 0x4be3a0 }), x, 4.82, z + 0.8);
  }

  // clickable racks, one server per portfolio section
  buildRacks(sections, racks) {
    const slots = racks.map(() => 0);
    racks.forEach((_, r) => this.rackShell(cx(r, racks.length), 0));

    sections.forEach((s, i) => {
      const slot = slots[s.rack]++;
      const x = cx(s.rack, racks.length);
      const y = 4.15 - slot * 1.1;
      const grp = new THREE.Group();
      grp.position.set(x, y, 0);
      this.scene.add(grp);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.9, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1a2a3b, metalness: 0.5, roughness: 0.45, emissive: 0x000000 })
      );
      grp.add(body);

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 0.325),
        new THREE.MeshBasicMaterial({ map: labelTexture(`GET /${s.id}`, `${12 + i * 3}ms  200 OK`) })
      );
      face.position.set(-0.45, 0, 0.71);
      grp.add(face);

      const leds = [0x4be3a0, 0x4be3a0, 0xffb347].map((c, k) => {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.03), new THREE.MeshBasicMaterial({ color: c }));
        led.position.set(0.95, 0.25 - k * 0.25, 0.71);
        grp.add(led);
        return led;
      });

      // live-traffic equalizer bars
      const bars = [0, 1, 2, 3].map((k) => {
        const geo = new THREE.BoxGeometry(0.07, 0.5, 0.03);
        geo.translate(0, 0.25, 0);
        const b = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x4be3a0 }));
        b.position.set(0.3 + k * 0.13, -0.36, 0.71);
        grp.add(b);
        return b;
      });
      this.units.push({ id: s.id, grp, body, leds, bars, x, y, z: 0 });
    });

    this.rackLabels = racks.map((name, r) => this.makeLabel(name));
  }

  // rows of non-interactive racks that make the room feel like a real datacenter
  buildBackRows() {
    const n = this.nRacks;
    const bodyGeo = new THREE.BoxGeometry(2.3, 0.9, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15222f, metalness: 0.5, roughness: 0.5 });
    const faceGeo = new THREE.PlaneGeometry(1.3, 0.325);
    const faces = [labelTexture('worker-01', 'idle'), labelTexture('db-replica', 'idle'), labelTexture('cache-node', 'idle')]
      .map((map) => new THREE.MeshBasicMaterial({ map }));
    const ledGeo = new THREE.BoxGeometry(0.11, 0.11, 0.03);

    BACK_ROWS_Z.forEach((z, row) => {
      for (let r = 0; r < n; r++) {
        const x = cx(r, n);
        this.rackShell(x, z);
        for (let slot = 0; slot < 4; slot++) {
          const grp = new THREE.Group();
          grp.position.set(x, 4.15 - slot * 1.1, z);
          grp.add(new THREE.Mesh(bodyGeo, bodyMat));
          const face = new THREE.Mesh(faceGeo, faces[(r + slot + row) % 3]);
          face.position.set(-0.45, 0, 0.71);
          grp.add(face);
          [0.25, 0].forEach((ly) => {
            const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0x4be3a0 }));
            led.position.set(0.95, ly, 0.71);
            grp.add(led);
            this.decoLeds.push(led);
          });
          this.scene.add(grp);
        }
      }
    });
  }

  buildGateway() {
    const gw = new THREE.Group();
    gw.position.set(0, 7.2, 0);
    gw.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1), new THREE.MeshStandardMaterial({ color: 0x213a52, emissive: 0x0b2a40 })));
    gw.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.8, 0.7, 1.2)), new THREE.LineBasicMaterial({ color: 0x7cc4ff })));
    this.scene.add(gw);
    this.gwLabel = this.makeLabel('api-gateway');

    const line = new THREE.LineBasicMaterial({ color: 0x2d5f86 });
    // hanger up to the ceiling tray
    this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 7.5, 0), new THREE.Vector3(0, 8.3, -1.2)]), line));

    const n = this.nRacks;
    const curves = Array.from({ length: n }, (_, r) => {
      const c = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 7, 0),
        new THREE.Vector3(cx(r, n) * 0.5, 6.4, 0.4),
        new THREE.Vector3(cx(r, n), 5.1, 0)
      );
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(24)), line));
      return c;
    });

    const geo = new THREE.SphereGeometry(0.06, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x4be3a0 });
    this.packets = Array.from({ length: 24 }, (_, i) => {
      const m = new THREE.Mesh(geo, mat);
      this.scene.add(m);
      return { m, c: curves[i % curves.length], t: Math.random(), v: 0.2 + Math.random() * 0.3 };
    });

    this.pulse = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    this.pulse.visible = false;
    this.scene.add(this.pulse);
  }

  // dust motes drifting up through the light
  buildDust() {
    const n = 420;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 24;
      p[i * 3 + 1] = Math.random() * 8.5;
      p[i * 3 + 2] = -20 + Math.random() * 34;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fd4ff, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false }));
    this.scene.add(this.dust);
  }

  // sonar ring that pulses on the floor under the selected server
  buildRipple() {
    this.ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 1, 64),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.visible = false;
    this.scene.add(this.ripple);
  }

  // ---------- public API ----------
  open(id, onArrive) {
    const u = this.units.find((x) => x.id === id);
    if (!u) return false;
    this.sel = u;
    this.auto = false;
    this.tlook.set(u.x * 0.6, u.y * 0.7 + 1, 0);
    this.trad = this.isMobile() ? 11 : 9;
    this.tth = Math.round(this.tth / TAU) * TAU + u.x * 0.04;
    this.tph = 1.4;
    this.pulseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 7, 0),
      new THREE.Vector3(u.x * 0.5, 6.3, 1.8),
      new THREE.Vector3(u.x, u.y, 1.6),
    ]);
    this.pulseT = 0;
    this.pulseCb = onArrive;
    this.pulse.visible = !this.reduce;
    if (this.reduce) { this.pulseCb?.(); this.pulseCb = null; }
    return true;
  }

  retract() {
    this.sel = null;
    this.tlook.set(...HOME_LOOK);
    this.trad = this.homeRad();
  }

  // ---------- input ----------
  bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    addEventListener('resize', this.onResize);
  }

  pick(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mp.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.mp, this.camera);
    const hit = this.ray.intersectObjects(this.units.map((u) => u.body), false);
    return hit.length ? this.units.find((u) => u.body === hit[0].object) : null;
  }

  onDown = (e) => {
    this.pts.set(e.pointerId, e);
    this.dragging = true;
    this.moved = 0;
    this.lx = e.clientX;
    this.ly = e.clientY;
    this.canvas.setPointerCapture(e.pointerId);
    this.canvas.classList.add('drag');
    this.auto = false;
  };

  onMove = (e) => {
    this.pts.set(e.pointerId, e);
    if (this.pts.size === 2) {
      const [a, b] = [...this.pts.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (this.pd) this.trad = Math.min(this.maxRad(), Math.max(6, this.trad - (d - this.pd) * 0.04));
      this.pd = d;
      this.moved = 99;
      return;
    }
    this.pd = 0;
    if (this.dragging) {
      const dx = e.clientX - this.lx;
      const dy = e.clientY - this.ly;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.lx = e.clientX;
      this.ly = e.clientY;
      this.tth = Math.min(1, Math.max(-1, this.tth - dx * 0.006)); // stay in front of the racks
      this.tph -= dy * 0.006; // clamped every frame so the camera stays inside the room
    } else {
      this.hover = this.pick(e);
      this.canvas.classList.toggle('hot', !!this.hover);
    }
  };

  onUp = (e) => {
    this.pts.delete(e.pointerId);
    this.dragging = false;
    this.canvas.classList.remove('drag');
    if (e.type === 'pointerup' && this.moved < 6) {
      const u = this.pick(e);
      if (u) this.onPick(u.id);
      else { this.retract(); this.onPick(null); }
    }
  };

  onWheel = (e) => {
    e.preventDefault();
    this.trad = Math.min(this.maxRad(), Math.max(6, this.trad + e.deltaY * 0.012));
  };

  onResize = () => {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // shift the scene so it stays clear of the terminal panel
    // desktop: left of the terminal and below the header bar. mobile: above the terminal sheet
    this.camera.setViewOffset(w, h, w > 760 ? 200 : 0, w > 760 ? -60 : h * 0.14, w, h);
    this.camera.updateProjectionMatrix();
  };

  // ---------- loop ----------
  place(el, x, y, z) {
    this.v.set(x, y, z).project(this.camera);
    el.style.opacity = this.v.z < 1 ? 1 : 0;
    el.style.transform = `translate(${(this.v.x * 0.5 + 0.5) * innerWidth}px,${(-this.v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%)`;
  }

  frame = (now) => {
    const dt = Math.min(0.05, (now - this.t0) / 1000);
    this.t0 = now;
    if (this.auto) this.tth = 0.45 + Math.sin(now * 0.00012) * 0.35; // slow sway until the user takes over
    // keep the camera between the floor and the ceiling
    const minPh = Math.acos(Math.min(0.95, 4.8 / this.trad));
    this.tph = Math.min(1.52, Math.max(minPh, this.tph));
    this.th += (this.tth - this.th) * 0.06;
    this.ph += (this.tph - this.ph) * 0.06;
    this.rad += (this.trad - this.rad) * 0.06;
    this.look.lerp(this.tlook, 0.07);
    const { th, ph, rad, look } = this;
    this.camera.position.set(look.x + rad * Math.sin(ph) * Math.sin(th), look.y + rad * Math.cos(ph), look.z + rad * Math.sin(ph) * Math.cos(th));
    this.camera.lookAt(look);

    this.units.forEach((u, i) => {
      u.z += ((u === this.sel ? 1.1 : 0) - u.z) * 0.12;
      u.grp.position.z = u.z;
      const hot = u === this.hover || u === this.sel;
      u.body.material.emissive.setHex(hot ? 0x0d4a35 : 0x000000);
      const on = this.reduce || Math.sin(now * 0.004 + i * 2) > 0.2;
      u.leds[1].material.color.setHex(on ? 0x4be3a0 : 0x16382c);
      u.leds[2].material.color.setHex(hot ? 0xffb347 : 0x4a3a1a);
      u.bars.forEach((b, k) => {
        const level = hot ? 1 : 0.55;
        b.scale.y = this.reduce ? 0.6 : 0.15 + level * 0.85 * Math.abs(Math.sin(now * 0.003 * (1 + k * 0.35) + i + k));
        b.material.color.setHex(hot ? 0xffb347 : 0x4be3a0);
      });
    });

    this.decoLeds.forEach((l, i) => {
      const on = this.reduce || Math.sin(now * 0.003 + i * 1.7) > 0.1;
      l.material.color.setHex(i % 7 === 0 ? (on ? 0xffb347 : 0x4a3a1a) : on ? 0x4be3a0 : 0x16382c);
    });

    this.packets.forEach((p) => {
      p.t = (p.t + dt * p.v) % 1;
      p.m.position.copy(p.c.getPoint(p.t));
    });

    const dp = this.dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      const y = dp.getY(i) + dt * 0.15;
      dp.setY(i, y > 8.5 ? 0 : y);
    }
    dp.needsUpdate = true;

    if (this.sel) {
      this.rt = (this.rt + dt * 0.45) % 1;
      this.ripple.visible = true;
      this.ripple.position.set(this.sel.x, 0.02, 0.4);
      this.ripple.scale.setScalar(1 + this.rt * 4);
      this.ripple.material.opacity = 0.55 * (1 - this.rt);
    } else this.ripple.visible = false;

    if (this.pulse.visible && this.pulseCurve) {
      this.pulseT += dt * 1.5;
      if (this.pulseT >= 1) {
        this.pulse.visible = false;
        const cb = this.pulseCb;
        this.pulseCb = null;
        cb?.();
      } else this.pulse.position.copy(this.pulseCurve.getPoint(this.pulseT));
    }

    this.rackLabels.forEach((el, r) => this.place(el, cx(r, this.nRacks), 5.6, 0));
    this.place(this.gwLabel, 0, 7.9, 0);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    c.removeEventListener('wheel', this.onWheel);
    removeEventListener('resize', this.onResize);
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const m = o.material;
      if (m) { m.map?.dispose(); m.dispose(); }
    });
    this.renderer.dispose();
    this.labelEls.forEach((el) => el.remove());
  }
}