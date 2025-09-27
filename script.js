(() => {
  // ----- Canvas setup -----
  const canvas = document.getElementById('city');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  function fit() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', fit, { passive: true });
  fit();

  // ----- HUD controls -----
  const ui = {
    speed: document.getElementById('speed'),
    speedOut: document.getElementById('speedOut'),
    smoke: document.getElementById('smoke'),
    lights: document.getElementById('lights'),
    night: document.getElementById('night'),
  };
  function syncHUD() { ui.speedOut.textContent = Number(ui.speed.value).toFixed(2); }
  ui.speed.addEventListener('input', syncHUD);
  ['smoke','lights','night'].forEach(id => ui[id].addEventListener('change', ()=>{}));
  syncHUD();

  // ----- Utilities -----
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => Math.random() * (b - a) + a;

  // ----- Skyline layers (parallax rectangles) -----
  function makeSkyline(seed, hMin, hMax, color) {
    // Returns an array of buildings: {x,w,h}
    const arr = [];
    let x = -80;
    while (x < W + 160) {
      const w = rnd(40, 110);
      const h = rnd(hMin, hMax);
      arr.push({ x, w, h });
      x += w + rnd(12, 28);
    }
    return { buildings: arr, color, offset: 0, speed: seed };
  }
  let skylineBack, skylineFront;
  function regenSkyline() {
    skylineBack = makeSkyline(0.15, H * 0.30, H * 0.55, '#0f1830');
    skylineFront = makeSkyline(0.35, H * 0.38, H * 0.68, '#152142');
  }
  regenSkyline();

  function drawSkyAndCity(t) {
    // sky gradient (day/night)
    const nightK = ui.night.checked ? 1 : 0;
    const top = ui.night.checked ? '#0b1020' : '#6fb6ff';
    const mid = ui.night.checked ? '#101b36' : '#9fd1ff';
    const bot = ui.night.checked ? '#0b1428' : '#d8efff';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(0.6, mid);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // parallax drift speed scales with "car speed"
    const drift = Number(ui.speed.value);
    [skylineBack, skylineFront].forEach((layer, i) => {
      layer.offset -= layer.speed * (0.5 + drift) * 0.8;
      const baseY = H * (i === 0 ? 0.55 : 0.62);
      ctx.save();
      ctx.fillStyle = layer.color;
      for (let k = -1; k <= 1; k++) {
        for (const b of layer.buildings) {
          const x = b.x + layer.offset + k * (W + 240);
          // recycle
          if (x + b.w < -200) layer.offset += W + 240;
          ctx.fillRect(x, baseY - b.h, b.w, b.h);
          // tiny windows at night
          if (ui.night.checked) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'rgba(255,230,160,0.9)';
            for (let wy = baseY - b.h + 10; wy < baseY - 10; wy += 12) {
              for (let wx = x + 6; wx < x + b.w - 6; wx += 12) {
                if (Math.random() < 0.08) ctx.fillRect(wx, wy, 2, 4);
              }
            }
            ctx.restore();
          }
        }
      }
      ctx.restore();
    });

    // distant stars at night
    if (ui.night.checked) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = 'rgba(240,250,255,0.9)';
      for (let i = 0; i < 90; i++) {
        const x = (i * 97) % W;
        const y = (i * 137) % Math.floor(H * 0.4);
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.restore();
    }
  }

  // ----- Road & sidewalk -----
  let roadOffset = 0;
  function drawRoad() {
    // asphalt
    ctx.fillStyle = '#1a1e28';
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // lane stripes (moving)
    const speed = Number(ui.speed.value);
    roadOffset -= (4 + speed * 6);
    const stripeW = 70, stripeGap = 120;
    const baseY = H * 0.86;
    ctx.fillStyle = '#f1f2f0';
    ctx.globalAlpha = 0.8;
    for (let x = ((roadOffset % (stripeW + stripeGap)) - stripeW); x < W + stripeW; x += (stripeW + stripeGap)) {
      ctx.fillRect(x, baseY, stripeW, 6);
    }
    ctx.globalAlpha = 1;

    // curb & sidewalk
    ctx.fillStyle = '#232a38';
    ctx.fillRect(0, H * 0.68, W, H * 0.04);
    ctx.fillStyle = '#2c3548';
    ctx.fillRect(0, H * 0.64, W, H * 0.04);

    // street lamps (simple poles)
    ctx.save();
    ctx.strokeStyle = '#2b3a56';
    ctx.lineWidth = 4;
    const lampGap = 200;
    const lampOffset = (roadOffset * 0.5) % lampGap;
    for (let x = lampOffset - lampGap; x < W + lampGap; x += lampGap) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.64);
      ctx.lineTo(x, H * 0.48);
      ctx.stroke();
      // lamp head
      ctx.fillStyle = ui.night.checked ? '#ffdca8' : '#fff3';
      ctx.beginPath();
      ctx.arc(x + 8, H * 0.48, 6, 0, TAU);
      ctx.fill();
      if (ui.night.checked) {
        const lg = ctx.createRadialGradient(x + 8, H * 0.48, 0, x + 8, H * 0.48, 28);
        lg.addColorStop(0, 'rgba(255,220,168,0.25)');
        lg.addColorStop(1, 'rgba(255,220,168,0)');
        ctx.fillStyle = lg;
      }
    }
    ctx.restore();
  }

  // ----- Exhaust smoke particles -----
  class Puff {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = rnd(-10, -30);         // drift backward
      this.vy = rnd(-10, -30);         // go upward
      this.r = rnd(6, 14);
      this.a = 1;
      this.life = rnd(800, 1400);
      this.age = 0;
      this.tw = rnd(0.6, 1.2);         // wobble speed
      this.ph = rnd(0, TAU);
      this.hue = rnd(200, 220);        // cool gray-blue
    }
    update(dt) {
      this.age += dt;
      // buoyancy & slight turbulence
      this.vy -= 3 * (dt / 1000);
      this.vx += Math.sin(this.age * 0.004 + this.ph) * 4 * (dt / 1000);
      this.x += this.vx * (dt / 1000);
      this.y += this.vy * (dt / 1000);
      // expand & fade
      this.r += 10 * (dt / 1000);
      const k = 1 - this.age / this.life;
      this.a = clamp(k, 0, 1);
    }
    get alive() { return this.age < this.life && this.a > 0.02; }
    draw() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, `hsla(${this.hue} 10% 85% / ${0.22 * this.a})`);
      g.addColorStop(1, 'hsla(0 0% 0% / 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  const puffs = [];
  function spawnSmoke(x, y, rate, dt) {
    // spawn proportional to rate and dt
    const expected = rate * (dt / 1000);
    let n = Math.floor(expected);
    if (Math.random() < (expected - n)) n += 1;
    for (let i = 0; i < n; i++) puffs.push(new Puff(x + rnd(-2, 2), y + rnd(-2, 2)));
  }

  // ----- Car -----
  class Car {
    constructor() {
      this.x = W * 0.5;
      this.y = H * 0.73;
      this.scale = Math.max(0.8, Math.min(1.2, W / 1280));
      this.wheelRot = 0;
      this.hornFlash = 0; // small headlight flash on click
      this.bounce = 0;
    }
    exhaustPoint() {
      // back-right exhaust tip (relative to car center)
      const sx = this.x - 92 * this.scale;
      const sy = this.y - 10 * this.scale;
      return { x: sx, y: sy };
    }
    update(dt) {
      const speed = Number(ui.speed.value);
      // rotate wheels based on lane movement
      this.wheelRot += (speed * 0.15 + 0.08) * dt;
      this.bounce += dt * (0.003 + speed * 0.001);
    }
    draw(t) {
      const k = this.scale;
      const bob = Math.sin(this.bounce) * 2 * k;

      ctx.save();
      ctx.translate(this.x, this.y + bob);

      // --- shadow
      ctx.save();
      ctx.scale(1, 0.25);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(0, 62 * k, 120 * k, 26 * k, 0, 0, TAU); ctx.fill();
      ctx.restore();

      // --- car body
      const body = '#ff4d5a';           // hot red/pink
      const dark = '#2b0d12';
      const chrome = '#f6f6f6';

      // chassis
      ctx.fillStyle = body;
      roundRect(ctx, -120 * k, -20 * k, 240 * k, 70 * k, 14 * k);
      ctx.fill();

      // cabin
      roundRect(ctx, -70 * k, -50 * k, 140 * k, 50 * k, 12 * k);
      ctx.fillStyle = body;
      ctx.fill();

      // windows
      ctx.fillStyle = ui.night.checked ? '#8fb6ff' : '#dff3ff';
      ctx.globalAlpha = 0.9;
      roundRect(ctx, -58 * k, -44 * k, 56 * k, 38 * k, 8 * k); ctx.fill();
      roundRect(ctx, 4 * k, -44 * k, 56 * k, 38 * k, 8 * k); ctx.fill();
      ctx.globalAlpha = 1;

      // door line
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(0, -45 * k); ctx.lineTo(0, 50 * k); ctx.stroke();

      // bumpers
      ctx.fillStyle = chrome;
      roundRect(ctx, -130 * k, 30 * k, 22 * k, 12 * k, 4 * k); ctx.fill(); // rear
      roundRect(ctx, 108 * k, 30 * k, 22 * k, 12 * k, 4 * k); ctx.fill(); // front

      // headlights
      if (ui.lights.checked) {
        // bright cones
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lx = 128 * k, ly = 18 * k;
        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 140 * k);
        const flash = clamp(this.hornFlash, 0, 1);
        grad.addColorStop(0, `rgba(255,245,200,${0.40 + 0.35 * flash})`);
        grad.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.arc(lx, ly, 140 * k, -0.25, 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // small headlamp circles
      ctx.fillStyle = '#fff8d0';
      ctx.beginPath(); ctx.arc(120 * k, 22 * k, 6 * k, 0, TAU); ctx.fill();

      // tail light
      ctx.fillStyle = '#ff897a';
      ctx.beginPath(); ctx.arc(-122 * k, 22 * k, 6 * k, 0, TAU); ctx.fill();

      // wheels
      drawWheel(-68 * k, 44 * k, 22 * k, this.wheelRot);
      drawWheel(68 * k, 44 * k, 22 * k, this.wheelRot);

      // exhaust pipe
      ctx.fillStyle = dark;
      roundRect(ctx, -110 * k, 34 * k, 16 * k, 6 * k, 3 * k); ctx.fill();

      // roof rack
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3 * k;
      ctx.beginPath();
      ctx.moveTo(-52 * k, -52 * k); ctx.lineTo(52 * k, -52 * k);
      ctx.moveTo(-58 * k, -47 * k); ctx.lineTo(58 * k, -47 * k);
      ctx.stroke();

      // roof bundle (bindle)
      drawBundle(0, -64 * k, 1.0 * k);

      ctx.restore();
    }
  }
  const car = new Car();

  function drawWheel(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#101218';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();

    ctx.fillStyle = '#c8cbd6';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();

    // spokes
    ctx.strokeStyle = '#8f96a8'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = rot * 0.01 + (i * TAU / 6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBundle(cx, cy, k) {
    // cloth bundle with rope
    ctx.save();
    ctx.translate(cx, cy);

    // cloth
    const g = ctx.createLinearGradient(-30 * k, -30 * k, 30 * k, 30 * k);
    g.addColorStop(0, '#f9b36b');
    g.addColorStop(1, '#f49b4a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -26 * k);
    ctx.bezierCurveTo(32 * k, -24 * k, 36 * k, 10 * k, 0, 24 * k);
    ctx.bezierCurveTo(-36 * k, 10 * k, -32 * k, -24 * k, 0, -26 * k);
    ctx.closePath();
    ctx.fill();

    // rope
    ctx.strokeStyle = '#7a4d27'; ctx.lineWidth = 3 * k;
    ctx.beginPath();
    ctx.moveTo(-18 * k, -4 * k); ctx.lineTo(18 * k, 4 * k);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16 * k, 6 * k); ctx.lineTo(16 * k, -2 * k);
    ctx.stroke();

    // knot
    ctx.fillStyle = '#7a4d27';
    ctx.beginPath(); ctx.arc(0, 0, 4 * k, 0, TAU); ctx.fill();

    ctx.restore();
  }

  // rounded rectangle helper
  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  // ----- Interaction: click = brief headlight flash (horn mimic) -----
  canvas.addEventListener('click', () => {
    car.hornFlash = 1.0;
    setTimeout(() => { car.hornFlash = 0; }, 200);
  });

  // ----- Main loop -----
  let last = performance.now();
  function frame(now) {
    const dt = now - last; last = now;
    const t = now / 1000;

    // Background
    drawSkyAndCity(t);
    drawRoad();

    // Car
    car.update(dt);
    car.draw(t);

    // Smoke
    if (ui.smoke.checked) {
      const p = car.exhaustPoint();
      const rate = 22 + Number(ui.speed.value) * 18; // puffs per second
      spawnSmoke(p.x, p.y, rate, dt);
    }
    // update & draw puffs
    for (let i = puffs.length - 1; i >= 0; i--) {
      const pf = puffs[i];
      pf.update(dt);
      pf.draw();
      if (!pf.alive) puffs.splice(i, 1);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
