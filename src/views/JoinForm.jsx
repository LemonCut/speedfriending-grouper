import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ROLES = [
  { id: 'bit', name: 'Bit', desc: 'I’m a little' },
  { id: 'byte', name: 'Byte', desc: 'I’m a big' },
];

export default function JoinForm() {
  const [status, setStatus] = useState('loading'); // loading | open | closed | done
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(null);

  useEffect(() => {
    api
      .state()
      .then((s) => setStatus(s.locked ? 'closed' : 'open'))
      .catch(() => setStatus('open'));
  }, []);

  const canSubmit = name.trim() && role && !submitting;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const trimmed = name.trim();
      const idx = trimmed.indexOf(' ');
      const first = idx > -1 ? trimmed.slice(0, idx) : trimmed;
      const last = idx > -1 ? trimmed.slice(idx + 1) : '';
      const rec = await api.register({ name: trimmed, firstName: first, lastName: last, role });
      setRegistered(rec);
      setStatus('done');
    } catch (err) {
      if (err.code === 'LOCKED') setStatus('closed');
      else setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName('');
    setRole(null);
    setError('');
    setRegistered(null);
    setStatus('open');
  }

  return (
    <main className="join">
      <section className="join-card glass rise-in">
        {status === 'loading' && <p className="sub" style={{ textAlign: 'center' }}>Loading…</p>}

        {status === 'closed' && (
          <div className="join-status">
            <h1>Registration closed</h1>
            <p className="sub">Groups have already been set. Find an organizer if you still need a spot!</p>
          </div>
        )}

        {status === 'done' && registered && (
          <div className="join-status">
            <h1>
              You’re in, <span className="gradient-text">{registered.name || registered.firstName}</span>!
            </h1>
            <span className={`tag tag-${registered.role}`}>
              Registered as a {registered.role === 'bit' ? 'Bit' : 'Byte'}
            </span>
            <p className="sub">Keep your eyes on the big screen. Groups will be revealed soon.</p>
            <button type="button" className="link-btn" onClick={reset} id="register-another">
              Register someone else
            </button>
          </div>
        )}

        {status === 'open' && (
          <form onSubmit={onSubmit} style={{ display: 'contents' }} noValidate>
            <header>
              <span className="eyebrow">Speedfriending check-in</span>
            </header>

            <label>
              <span className="field-label">Name</span>
              <input
                id="name"
                className="input"
                placeholder="What should people call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={80}
                required
              />
            </label>

            <div>
              <span className="field-label">Bit or Byte?</span>
              <div className="role-picker" role="radiogroup" aria-label="Bit or Byte?">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    id={`role-${r.id}`}
                    type="button"
                    role="radio"
                    aria-checked={role === r.id}
                    data-role={r.id}
                    className="role-option"
                    onClick={() => setRole(r.id)}
                  >
                    <span className="role-name">{r.name}</span>
                    <span className="role-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="error-text" role="alert">{error}</p>}

            <button id="submit-intake" type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {submitting ? 'Joining…' : 'Join the event'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
