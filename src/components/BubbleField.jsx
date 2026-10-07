import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { formatNameLines } from '../formatName.js';
import { fontFor } from '../formatGroupTitle.js';

const { Engine, Bodies, Body, Composite } = Matter;

const STEP = 1000 / 60;
const SPRING = 0.000027; // pull toward each drifting anchor (1.5x speed)
const HUES = [
  145, // lush pine green
  168, // emerald spruce
  36,  // campfire gold
  22,  // bonfire amber
  14,  // glowing ember
  150, // cool mountain fir
  46,  // firefly lantern yellow
  122, // deep forest moss
];

function hueFor(name) {
  let h = 7;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

/** Spread anchors over the field in a balanced, organic cloud pattern */
function computeAnchors(n, W, H) {
  if (n <= 1) return [{ x: W / 2, y: H / 2 }];
  const cols = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * W) / (H * 2.3)))));
  const rows = Math.ceil(n / cols);
  const cw = W / cols;
  const ch = H / rows;
  const pts = [];
  for (let r = 0; r < rows; r++) {
    const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
    const offset = (W - inRow * cw) / 2 + (r % 2 ? cw * 0.1 : -cw * 0.1);
    for (let c = 0; c < inRow; c++) {
      pts.push({
        x: offset + cw * (c + 0.5) + (Math.random() - 0.5) * cw * 0.22,
        y: ch * (r + 0.5) + (Math.random() - 0.5) * ch * 0.22,
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
 * Names emerge from the center of the screen, expand fluidly in scale,
 * and bounce off each other via Matter.js rigid-body physics into a word cloud,
 * floating in place with gentle resting drift.
 */
export default function BubbleField({ names, multiCount = 1 }) {
  const fieldRef = useRef(null);
  const bubbleRefs = useRef([]);
  const key = `${names.join('\u0000')}-${multiCount}`;


  useEffect(() => {
    const field = fieldRef.current;
    const els = bubbleRefs.current.slice(0, names.length);
    if (!names.length || !field) return undefined;

    let cancelled = false;
    let raf = 0;
    let cleanupPhysics = () => {};

    document.fonts.ready.then(() => {
      if (cancelled) return;
      let W = field.clientWidth || (multiCount > 1 ? 380 : 1200);
      let H = field.clientHeight || (multiCount > 1 ? 320 : 800);
      const pad = multiCount > 1 ? 16 : 28;

      const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
      const sizes = els.map((el) => ({ w: el.offsetWidth || 180, h: el.offsetHeight || 54 }));
      let anchors = computeAnchors(names.length, Math.max(40, W - pad * 2), Math.max(40, H - pad * 2)).map((p) => ({ x: p.x + pad, y: p.y + pad }));
      const phases = names.map(() => Math.random() * Math.PI * 2);

      let walls = [];
      const buildWalls = () => {
        if (walls.length) Composite.remove(engine.world, walls);
        const T = 400;
        walls = [
          Bodies.rectangle(W / 2, -T / 2 + pad, W * 3, T, { isStatic: true }),
          Bodies.rectangle(W / 2, H + T / 2 - pad, W * 3, T, { isStatic: true }),
          Bodies.rectangle(-T / 2 + pad, H / 2, T, H * 3, { isStatic: true }),
          Bodies.rectangle(W + T / 2 - pad, H / 2, T, H * 3, { isStatic: true }),
        ];
        Composite.add(engine.world, walls);
      };
      buildWalls();

      const S0 = 0.15; // starting scale at center
      const currentScales = names.map(() => S0);
      const spawnTimes = names.map(() => 0);

      const GAP = multiCount > 1 ? 8 : 12; // breathing room between bare words
      const centerX = W / 2;
      const centerY = H / 2;

      const bodies = sizes.map((s) => {
        const b = Bodies.rectangle(
          centerX + (Math.random() - 0.5) * (multiCount > 1 ? 16 : 30),
          centerY + (Math.random() - 0.5) * (multiCount > 1 ? 16 : 30),
          s.w + GAP,
          s.h + GAP,
          {
            chamfer: { radius: Math.min(8, (s.h + GAP) / 4) },
            frictionAir: 0.055,
            friction: 0.02,
            restitution: 0.65,
            inertia: Infinity, // keep text strictly horizontal
          },
        );
        Body.scale(b, S0, S0);
        return b;
      });

      const stagger = Math.min(85, 930 / names.length);
      const spawnAt = names.map((_, i) => 80 + i * stagger);
      const active = names.map(() => false);

      const updateDimensions = (newW, newH) => {
        W = newW;
        H = newH;
        anchors = computeAnchors(names.length, Math.max(40, W - pad * 2), Math.max(40, H - pad * 2)).map((p) => ({ x: p.x + pad, y: p.y + pad }));
        buildWalls();
      };

      const onResize = () => updateDimensions(field.clientWidth, field.clientHeight);
      window.addEventListener('resize', onResize);

      let ro;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            if (cr.width > 20 && cr.height > 20 && (Math.abs(cr.width - W) > 6 || Math.abs(cr.height - H) > 6)) {
              updateDimensions(cr.width, cr.height);
            }
          }
        });
        ro.observe(field);
      }

      const start = performance.now();
      let last = start;
      let acc = 0;
      const GROW_MS = 430;
      const speedScale = multiCount > 1 ? Math.min(1, Math.hypot(W, H) / 900) : 1;

      const tick = (now) => {
        const t = now - start;
        acc = Math.min(acc + (now - last), 100);
        last = now;

        bodies.forEach((b, i) => {
          if (!active[i] && t >= spawnAt[i]) {
            active[i] = true;
            spawnTimes[i] = t;
            Composite.add(engine.world, b);

            // Outward impulse toward target anchor
            const a = anchors[i];
            const dx = a.x - centerX;
            const dy = a.y - centerY;
            const dist = Math.hypot(dx, dy) || 1;
            const speed = (6.8 + Math.random() * 5.2) * (multiCount > 1 ? (0.42 + 0.58 * speedScale) : 1);
            Body.setVelocity(b, {
              x: (dx / dist) * speed + (Math.random() - 0.5) * (multiCount > 1 ? 2.5 : 4.5),
              y: (dy / dist) * speed + (Math.random() - 0.5) * (multiCount > 1 ? 2.5 : 4.5),
            });
            els[i].classList.add('active');
          }
        });

        while (acc >= STEP) {
          const tt = t - acc;
          bodies.forEach((b, i) => {
            if (!active[i]) return;

            // Fluid scale expansion
            const age = tt - spawnTimes[i];
            if (age < GROW_MS) {
              const p = Math.max(0, age / GROW_MS);
              const progress = 1 - Math.pow(1 - p, 3);
              const targetScale = S0 + (1 - S0) * progress;
              const factor = targetScale / currentScales[i];
              Body.scale(b, factor, factor);
              currentScales[i] = targetScale;
            } else if (currentScales[i] < 1) {
              const factor = 1 / currentScales[i];
              Body.scale(b, factor, factor);
              currentScales[i] = 1;
            }

            // Floating drift & spring pull toward anchor
            const a = anchors[i];
            const p = phases[i];
            const driftScale = multiCount > 1 ? 0.008 : 0.014;
            const tx = a.x + Math.sin(tt * 0.00042 + p) * W * driftScale + Math.sin(tt * 0.0011 + p * 2) * (multiCount > 1 ? 3 : 5);
            const ty = a.y + Math.cos(tt * 0.0005 + p * 1.3) * H * (driftScale * 1.25);
            const k = SPRING * b.mass;
            Body.applyForce(b, b.position, { x: (tx - b.position.x) * k, y: (ty - b.position.y) * k });

            // Bounded safety clamp
            const halfW = (sizes[i].w * currentScales[i]) / 2;
            const halfH = (sizes[i].h * currentScales[i]) / 2;
            const minX = pad + halfW;
            const maxX = Math.max(minX, W - pad - halfW);
            const minY = pad + halfH;
            const maxY = Math.max(minY, H - pad - halfH);
            if (b.position.x < minX || b.position.x > maxX || b.position.y < minY || b.position.y > maxY) {
              Body.setPosition(b, {
                x: Math.min(maxX, Math.max(minX, b.position.x)),
                y: Math.min(maxY, Math.max(minY, b.position.y)),
              });
            }
          });
          Engine.update(engine, STEP);
          acc -= STEP;
        }

        bodies.forEach((b, i) => {
          if (!active[i]) return;
          const s = currentScales[i];
          els[i].style.transform = `translate3d(${b.position.x - sizes[i].w / 2}px, ${b.position.y - sizes[i].h / 2}px, 0) scale(${s.toFixed(3)})`;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupPhysics = () => {
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
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
    <div className="bubble-field" ref={fieldRef} style={{ '--bubble-font': fontFor(names.length, multiCount) }}>
      {names.length === 0 && <div className="bubble-empty">No bits in this group</div>}
      {names.map((name, i) => {
        const lines = formatNameLines(name);
        return (
          <div
            key={`${name}-${i}`}
            ref={(el) => (bubbleRefs.current[i] = el)}
            className={`bubble ${lines.length > 1 ? 'two-line' : ''}`}
            style={{ '--hue': hueFor(name) }}
          >
            {lines.map((line, idx) => (
              <span key={idx} className="name-line">
                {line}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
