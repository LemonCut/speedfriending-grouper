import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function HostIntake({ state, authed }) {
  const [join, setJoin] = useState(null);
  useEffect(() => {
    api.joinInfo().then(setJoin).catch(() => {});
  }, []);

  const { bitCount = 0, byteCount = 0, recent } = state ?? {};
  const lo = byteCount ? Math.floor(bitCount / byteCount) : 0;
  const hi = byteCount ? Math.ceil(bitCount / byteCount) : 0;
  const perGroup = !byteCount ? '—' : lo === hi ? String(lo) : `${lo}–${hi}`;

  return (
    <main className="host-intake">
      <section className="intake-hero rise-in">
        <span className="eyebrow">Speedfriending · Check-in open</span>
        <h1>
          <span className="gradient-text">Bits</span> &amp;
          <br />
          <span className="gradient-text">Bytes</span>
        </h1>
        <p className="lede">Scan to check in. Once everyone’s here, we’ll reveal the groups.</p>
        <div className="qr-card glass">
          {join ? <img src={join.qr} alt={`QR code linking to ${join.url}`} /> : <div style={{ width: 180, height: 180 }} />}
          <div className="qr-text">
            <span className="eyebrow">Or visit</span>
            <span className="qr-url">{join?.url ?? '…'}</span>
          </div>
        </div>
      </section>

      <section className="intake-side">
        <div className="counters">
          <div className="counter bit glass rise-in" style={{ animationDelay: '0.1s' }}>
            <span className="num">{bitCount}</span>
            <span className="lbl">Bits checked in</span>
          </div>
          <div className="counter byte glass rise-in" style={{ animationDelay: '0.2s' }}>
            <span className="num">{byteCount}</span>
            <span className="lbl">Bytes = groups</span>
          </div>
          <div className="counter glass rise-in" style={{ animationDelay: '0.3s' }}>
            <span className="num">{perGroup}</span>
            <span className="lbl">Bits per group</span>
          </div>
        </div>

        <div className="recent glass rise-in" style={{ animationDelay: '0.4s' }}>
          <span className="eyebrow">Just arrived</span>
          {!authed && <p className="empty-hint">Organizer login required to show names.</p>}
          {authed && recent?.length === 0 && <p className="empty-hint">Waiting for the first check-in…</p>}
          {authed && recent?.length > 0 && (
            <ul>
              {recent.map((p) => (
                <li key={p.id}>
                  <span className={`dot ${p.role}`} />
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
