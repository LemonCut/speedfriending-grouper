import { useMemo, useState } from 'react';

const fullName = (m) => `${m.firstName} ${m.lastName}`;

function Highlight({ text, query }) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

export default function Overview({ data, authed, onReplay, onUnlock }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const { groups, maxSize } = data;

  const matches = useMemo(() => {
    if (!query) return [];
    return groups.flatMap((g) =>
      g.members.filter((m) => fullName(m).toLowerCase().includes(query)).map((m) => ({ name: fullName(m), group: g.number })),
    );
  }, [groups, query]);
  const matchGroups = new Set(matches.map((m) => m.group));

  const below = groups.filter((g) => g.belowMax);
  const totalBits = groups.reduce((n, g) => n + g.size, 0);

  const scrollTo = (n) => document.getElementById(`group-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <main className="overview">
      <div className="overview-top">
        <div>
          <span className="eyebrow">All groups</span>
          <h1>
            Find your <span className="gradient-text">group</span>
          </h1>
          <div className="overview-stats">
            <span><b>{groups.length}</b> groups</span>
            <span><b>{totalBits}</b> bits</span>
            <span>max <b>{maxSize}</b> per group</span>
          </div>
        </div>
        <div className="search-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="group-search"
            className="input"
            type="search"
            placeholder="Search a name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            autoFocus
          />
        </div>
      </div>

      {query && (
        <div className="search-result glass" aria-live="polite">
          {matches.length === 0 && <span className="empty-hint">No one matching “{q.trim()}”</span>}
          {matches.slice(0, 8).map((m) => (
            <button key={`${m.name}-${m.group}`} className="link-btn hit" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => scrollTo(m.group)}>
              {m.name} → <strong>Group {m.group}</strong>
            </button>
          ))}
          {matches.length > 8 && <span className="empty-hint">+{matches.length - 8} more</span>}
        </div>
      )}

      {below.length > 0 && (
        <div className="glass search-result">
          <span className="section-title">
            <span className="tag tag-warn">{below.length}</span>
            {below.length === 1 ? 'Group has' : 'Groups have'} fewer than {maxSize}:
          </span>
          {below.map((g) => (
            <button key={g.number} className="btn btn-ghost" style={{ padding: '0.4em 1em' }} onClick={() => scrollTo(g.number)}>
              Group {g.number} · {g.size}/{maxSize}
            </button>
          ))}
        </div>
      )}

      <section className="groups-grid">
        {groups.map((g, i) => {
          const cls = ['group-card', 'glass'];
          if (g.belowMax) cls.push('below');
          if (query && matchGroups.has(g.number)) cls.push('match');
          else if (query) cls.push('dim');
          return (
            <article key={g.number} id={`group-${g.number}`} className={cls.join(' ')} style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}>
              <header>
                <h2>Group {g.number}</h2>
                {g.belowMax ? (
                  <span className="tag tag-warn">{g.size}/{maxSize}</span>
                ) : (
                  <span className="count">{g.size}/{maxSize}</span>
                )}
              </header>
              {g.members.length === 0 ? (
                <p className="none">No bits</p>
              ) : (
                <ul>
                  {g.members.map((m) => {
                    const name = fullName(m);
                    const hit = query && name.toLowerCase().includes(query);
                    return (
                      <li key={m.id} className={hit ? 'hl' : ''}>
                        <Highlight text={name} query={hit ? query : ''} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      <div className="organizer-bar">
        <button className="btn btn-ghost" onClick={onReplay} id="replay-reveal">↺ Replay reveal</button>
        {authed && (
          <button className="btn btn-danger" onClick={onUnlock} id="unlock-intake">Reopen intake</button>
        )}
      </div>
    </main>
  );
}
