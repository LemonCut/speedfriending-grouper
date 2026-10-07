export default function HostIntake({ state, authed }) {
  const { bitCount = 0, byteCount = 0, recent } = state ?? {};
  const lo = byteCount ? Math.floor(bitCount / byteCount) : 0;
  const hi = byteCount ? Math.ceil(bitCount / byteCount) : 0;
  const perGroup = !byteCount ? '—' : lo === hi ? String(lo) : `${lo}–${hi}`;

  return (
    <main className="host-intake">
      <section className="intake-hero rise-in">
        <span className="eyebrow">Check-in open</span>
        <h1>
          <span className="gradient-text">Bit-Byte</span>
          <br />
          Speedfriending
        </h1>
        <p className="lede">Join to check in. Once everyone’s here, we’ll reveal the groups.</p>
        <div>
          <a
            href="https://groups.lemoncut.dev/join"
            className="btn btn-primary join-btn"
            id="join-btn"
          >
            Join
          </a>
        </div>
      </section>

      <section className="intake-side">
        {authed ? (
          <div className="counters">
            <div className="counter bit glass rise-in" style={{ animationDelay: '0.1s' }}>
              <span className="num">{bitCount}</span>
              <span className="lbl">Bits checked in</span>
            </div>
            <div className="counter byte glass rise-in" style={{ animationDelay: '0.2s' }}>
              <span className="num">{byteCount}</span>
              <span className="lbl">Bytes checked in</span>
            </div>
            <div className="counter glass rise-in" style={{ animationDelay: '0.3s' }}>
              <span className="num">{perGroup}</span>
              <span className="lbl">Bits per group</span>
            </div>
          </div>
        ) : (
          <div className="stats-locked glass rise-in" style={{ animationDelay: '0.1s' }}>
            <span className="eyebrow">Check-in stats</span>
            <p className="empty-hint">Organizer login required to view stats.</p>
          </div>
        )}

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
