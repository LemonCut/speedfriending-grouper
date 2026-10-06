import express from 'express';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Store } from './store.js';
import { createGroups } from './grouping.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
const isProd = process.env.NODE_ENV === 'production';

const store = new Store(path.join(root, 'data'));
const app = express();
app.use(express.json());

/**
 * Address phones on the same Wi-Fi can reach. Prefers private LAN ranges
 * (192.168/16, 10/8, 172.16/12) over VPN/CGNAT ones like Tailscale's 100.64/10.
 * Override with PUBLIC_URL if the guess is wrong.
 */
function lanAddress() {
  const all = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  const rank = (ip) =>
    ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
  return all.sort((a, b) => rank(a) - rank(b))[0] ?? 'localhost';
}
const joinUrl = () => (process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/join` : `http://${lanAddress()}:${PORT}/join`);

const isAdmin = (req) => req.get('x-admin-pin') === ADMIN_PIN;
const requireAdmin = (req, res, next) =>
  isAdmin(req) ? next() : res.status(401).json({ error: 'Invalid organizer PIN.' });

const fullName = (p) => `${p.firstName} ${p.lastName}`;

app.get('/api/state', (req, res) => {
  const bits = store.list('bit');
  const bytes = store.list('byte');
  const body = { locked: store.isLocked(), bitCount: bits.length, byteCount: bytes.length };
  if (isAdmin(req)) {
    body.recent = [
      ...bits.map((p) => ({ id: p.id, name: fullName(p), role: 'bit', timestamp: p.timestamp })),
      ...bytes.map((p) => ({ id: p.id, name: fullName(p), role: 'byte', timestamp: p.timestamp })),
    ]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 14);
    // Groups are only exposed to the organizer so phones can't spoil the reveal.
    body.groups = store.getGroups();
  }
  res.json(body);
});

app.get('/api/join-info', async (_req, res) => {
  const url = joinUrl();
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: '#0b0820', light: '#ffffff' } });
  res.json({ url, qr });
});

app.post('/api/register', (req, res) => {
  try {
    const rec = store.add(req.body ?? {});
    res.status(201).json({ firstName: rec.firstName, lastName: rec.lastName, role: rec.role });
  } catch (err) {
    const status = { LOCKED: 423, DUPLICATE: 409, INVALID: 400 }[err.code] ?? 500;
    res.status(status).json({ error: err.message, code: err.code });
  }
});

app.post('/api/admin/verify', requireAdmin, (_req, res) => res.json({ ok: true }));

app.post('/api/admin/lock', requireAdmin, (_req, res) => {
  if (store.isLocked()) return res.json(store.getGroups());
  const byteCount = store.list('byte').length;
  if (byteCount < 1) return res.status(400).json({ error: 'At least one Byte must register before creating groups.' });
  const bits = store.list('bit').map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName }));
  res.json(store.saveGroups(createGroups(bits, byteCount)));
});

app.post('/api/admin/unlock', requireAdmin, (_req, res) => {
  store.unlock();
  res.json({ ok: true });
});

if (isProd) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Speedfriending Grouper running`);
  console.log(`  Host screen:  http://localhost:${PORT}`);
  console.log(`  Intake form:  ${joinUrl()}`);
  console.log(`  Organizer PIN: ${ADMIN_PIN === '1234' ? '1234 (default — set ADMIN_PIN to change)' : '(from ADMIN_PIN)'}\n`);
});
