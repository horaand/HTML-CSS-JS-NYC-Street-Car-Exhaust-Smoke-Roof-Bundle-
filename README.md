# NYC Street Car — Exhaust Smoke & Roof Bundle (Original & Free)

A fully original, dependency-free HTML5 canvas animation of a stylized New York street.  
Includes skyline parallax, moving road, glowing headlights, rising exhaust smoke particles, and a rooftop bundle — all in **vanilla HTML/CSS/JS** with **no external assets**.

## ✨ Features
- **Pure HTML/CSS/JS** — no libraries, no fonts, no network calls
- **Works 100% offline**
- **Interactive HUD**:
  - Speed slider (0x–3x)
  - Toggles: Exhaust smoke, Headlights, Night mode
  - Click anywhere to trigger a brief **horn flash**
- **Performance-friendly** Canvas 2D with device-pixel-ratio scaling
- **Responsive** layout and HUD

## 🚀 Quick Start
1. Save these three files in the same folder:
   - `index.html`
   - `styles.css`
   - `script.js`
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Enjoy! No build step or server required.


## 🕹️ Controls
- **Speed**: drag the slider (HUD) — updates in real time
- **Exhaust smoke**: toggle on/off
- **Headlights**: toggle on/off (with glow cones at night)
- **Night mode**: toggle sky gradient, windows, and lamps
- **Horn flash**: click anywhere on the canvas

## 🔧 Customization
Open `script.js` and tweak:
- **Colors**: skyline layers (`makeSkyline`), road, car body/headlights
- **Particles**: `Puff` class (size, life, drift, color)
- **Parallax**: skyline speeds in `makeSkyline` / `regenSkyline`
- **Scaling**: `this.scale` in `Car` adapts to viewport width

## 🧠 How It Works (High Level)
- **Canvas fit & DPR**: resizes to device pixel ratio for crisp rendering
- **Parallax skyline**: two layers with recycled building rectangles
- **Road motion**: animated lane stripes via offset accumulation
- **Car**: drawn with primitives (round rects, arcs), animated wheels/spokes
- **Exhaust**: lightweight particle system (lifespan, fade, radial gradient)
- **Main loop**: `requestAnimationFrame` updates scene each frame

## ✅ Browser Support
Modern evergreen browsers:
- Chrome, Edge, Firefox, Safari (desktop & mobile)
- No polyfills required

## 🧩 Integration
You can embed the canvas as a hero background or interactive section.  
Place the HUD anywhere; it’s independent from the drawing layer.
