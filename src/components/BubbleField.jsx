import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite } = Matter;

const STEP = 1000 / 60;
const SPRING = 0.000012; // pull toward each bubble's drifting anchor
const HUES = [182, 198, 218, 250, 275, 300, 325, 345];

function hueFor(name) {
  let h = 7;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

function fontFor(n) {
  if (n <= 6) return 'clamp(1.6rem, 4.4vh, 3.2rem)';
  if (n <= 12) return 'clamp(1.3rem, 3.5vh, 2.5rem)';
  if (n <= 20) return 'clamp(1.1rem, 2.8vh, 2rem)';
  return 'clamp(0.95rem, 2.2vh, 1.5rem)';
}

/** Spread anchors over the field in a loose, centred grid (pills are wide, so favour columns). */
function computeAnchors(n, W, H) {
  const cols = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * W) / (H * 2.6)))));
  const rows = Math.ceil(n / cols);
  const cw = W / cols;
  const ch = H / rows;
  const pts = [];
  for (let r = 0; r < rows; r++) {
    const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
    const offset = (W - inRow * cw) / 2 + (r % 2 ? cw * 0.12 : -cw * 0.12);
    for (let c = 0; c < inRow; c++) {
      pts.push({
        x: offset + cw * (c + 0.5) + (Math.random() - 0.5) * cw * 0.2,
        y: ch * (r + 0.5) + (Math.random() - 0.5) * ch * 0.2,
      });
    }
  }
  // Randomise which name lands where.
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

/**
 * Names rise from below the screen and float in place, jostling each other
 * via Matter.js rigid-body physics. Rendering is DOM (crisp text); Matter only
 * drives positions.
 */
export default function BubbleField({ names }) {
  const fieldRef = useRef(null);
  const bubbleRefs = useRef([]);
  const key = names.join('\u0000');

  useEffect(() => {
    const field = fieldRef.current;
    const els = bubbleRefs.current.slice(0, names.length);
    if (!names.length || !field) return undefined;

    let cancelled = false;
    let raf = 0;
    let cleanupPhysics = () => {};

    document.fonts.ready.then(() => {
      if (cancelled) return;
      let W = field.clientWidth;
      let H = field.clientHeight;
      const pad = 24;

      const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
      const sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
      let anchors = computeAnchors(names.length, W - pad * 2, H - pad * 2).map((p) => ({ x: p.x + pad, y: p.y + pad }));
      const phases = names.map(() => Math.random() * Math.PI * 2);

      let walls = [];
      const buildWalls = () => {
        if (walls.length) Composite.remove(engine.world, walls);
        const T = 400;
        walls = [
          Bodies.rectangle(W / 2, -T / 2, W * 3, T, { isStatic: true }),
          Bodies.rectangle(-T / 2, H, T, H * 6, { isStatic: true }),
          Bodies.rectangle(W + T / 2, H, T, H * 6, { isStatic: true }),
        ];
        Composite.add(engine.world, walls);
      };
      buildWalls();

      const clampX = (x, w) => Math.min(Math.max(x, w / 2 + 4), W - w / 2 - 4);
      const GAP = 18; // invisible collision margin so pills don't visually touch
      const bodies = sizes.map((s, i) =>
        Bodies.rectangle(clampX(anchors[i].x, s.w), H + s.h + 30 + Math.random() * 120, s.w + GAP, s.h + GAP, {
          chamfer: { radius: (s.h + GAP) / 2 },
          frictionAir: 0.045,
          friction: 0.01,
          restitution: 0.55,
          inertia: Infinity, // keep text level
        }),
      );

      const stagger = Math.min(320, 3200 / names.length);
      const spawnAt = names.map((_, i) => 250 + i * stagger);
      const active = names.map(() => false);

      const onResize = () => {
        W = field.clientWidth;
        H = field.clientHeight;
        anchors = computeAnchors(names.length, W - pad * 2, H - pad * 2).map((p) => ({ x: p.x + pad, y: p.y + pad }));
        buildWalls();
      };
      window.addEventListener('resize', onResize);

      const start = performance.now();
      let last = start;
      let acc = 0;

      const tick = (now) => {
        const t = now - start;
        acc = Math.min(acc + (now - last), 100);
        last = now;

        bodies.forEach((b, i) => {
          if (!active[i] && t >= spawnAt[i]) {
            active[i] = true;
            Composite.add(engine.world, b);
            Body.setVelocity(b, { x: (Math.random() - 0.5) * 2, y: -(9 + Math.random() * 4) });
            els[i].classList.add('active');
          }
        });

        while (acc >= STEP) {
          const tt = t - acc;
          bodies.forEach((b, i) => {
            if (!active[i]) return;
            const a = anchors[i];
            const p = phases[i];
            const tx = a.x + Math.sin(tt * 0.00042 + p) * W * 0.014 + Math.sin(tt * 0.0011 + p * 2) * 5;
            const ty = a.y + Math.cos(tt * 0.0005 + p * 1.3) * H * 0.018;
            const k = SPRING * b.mass;
            Body.applyForce(b, b.position, { x: (tx - b.position.x) * k, y: (ty - b.position.y) * k });
          });
          Engine.update(engine, STEP);
          acc -= STEP;
        }

        bodies.forEach((b, i) => {
          if (!active[i]) return;
          els[i].style.transform = `translate3d(${b.position.x - sizes[i].w / 2}px, ${b.position.y - sizes[i].h / 2}px, 0)`;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupPhysics = () => {
        window.removeEventListener('resize', onResize);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanupPhysics();
      els.forEach((el) => {
        if (!el) return;
        el.classList.remove('active');
        el.style.transform = '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="bubble-field" ref={fieldRef} style={{ '--bubble-font': fontFor(names.length) }}>
      {names.length === 0 && <div className="bubble-empty">No bits in this group</div>}
      {names.map((name, i) => (
        <div
          key={`${name}-${i}`}
          ref={(el) => (bubbleRefs.current[i] = el)}
          className="bubble"
          style={{ '--hue': hueFor(name) }}
        >
          {name}
        </div>
      ))}
    </div>
  );
}
