import { useCallback, useEffect, useState } from 'react';
import { api, getPin, setPin } from '../api.js';
import HostIntake from './HostIntake.jsx';
import Presentation from './Presentation.jsx';
import Overview from './Overview.jsx';
import { ConfirmModal, PinModal } from '../components/Modals.jsx';

const VIEW_KEY = 'sfg-view';
const SLIDE_KEY = 'sfg-slide';

/**
 * Host (projector) screen. Server state decides intake vs locked;
 * within locked, the view (ready → presenting → overview) is local so
 * a refresh mid-reveal resumes where it left off.
 */
export default function Host() {
  const [authed, setAuthed] = useState(() => !!getPin());
  const [state, setState] = useState(null);
  const [view, setView] = useState(() => sessionStorage.getItem(VIEW_KEY) || 'ready');
  const [slide, setSlide] = useState(() => Number(sessionStorage.getItem(SLIDE_KEY)) || 0);
  const [modal, setModal] = useState(null); // 'pin' | 'lock' | 'unlock'

  useEffect(() => sessionStorage.setItem(VIEW_KEY, view), [view]);
  useEffect(() => sessionStorage.setItem(SLIDE_KEY, String(slide)), [slide]);

  const refresh = useCallback(() => api.state().then(setState).catch(() => {}), []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh, authed]);

  const groups = state?.groups?.groups ?? [];

  const next = useCallback(() => {
    if (slide >= groups.length - 1) setView('overview');
    else setSlide((s) => s + 1);
  }, [slide, groups.length]);
  const prev = useCallback(() => setSlide((s) => Math.max(0, s - 1)), []);
  const toOverview = useCallback(() => setView('overview'), []);
  const startReveal = useCallback(() => {
    setSlide(0);
    setView('presenting');
  }, []);

  // Space / → on the "ready" splash starts the reveal.
  useEffect(() => {
    if (!(state?.locked && authed && view === 'ready' && !modal)) return undefined;
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        startReveal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state?.locked, authed, view, modal, startReveal]);

  async function verify(pin) {
    await api.verifyPin(pin);
    setPin(pin);
    setAuthed(true);
  }

  let content;
  if (!state) {
    content = <div className="center-stage"><p className="lede">Connecting…</p></div>;
  } else if (!state.locked) {
    content = <HostIntake state={state} authed={authed} />;
  } else if (!authed || !state.groups) {
    content = (
      <div className="center-stage">
        <div className="stack rise-in">
          <span className="eyebrow">Intake locked</span>
          <h1><span className="gradient-text">Groups are set</span></h1>
          <p className="lede">Organizer login required to reveal them.</p>
        </div>
      </div>
    );
  } else if (view === 'presenting' && groups.length) {
    content = (
      <Presentation groups={groups} index={Math.min(slide, groups.length - 1)} onNext={next} onPrev={prev} onExit={toOverview} />
    );
  } else if (view === 'overview') {
    content = <Overview data={state.groups} authed={authed} onReplay={startReveal} onUnlock={() => setModal('unlock')} />;
  } else {
    content = (
      <div className="center-stage">
        <div className="stack rise-in">
          <span className="eyebrow">Intake locked · {state.bitCount} bits · {groups.length} groups</span>
          <h1>
            Group <span className="gradient-text">Reveal</span>
          </h1>
          <p className="lede">
            Press <span className="kbd">Space</span> to begin the reveal
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={startReveal} id="start-reveal">Start the reveal</button>
            <button className="btn btn-ghost" onClick={toOverview} id="skip-to-overview">Skip to all groups</button>
          </div>
        </div>
      </div>
    );
  }

  const showBar = !state?.locked || !authed;
  return (
    <>
      {content}

      {showBar && state && (
        <div className="organizer-bar">
          {!state.locked && (
            <span className="live-pill">
              <span className="dot" /> Live
            </span>
          )}
          {!authed && (
            <button className="btn btn-ghost" onClick={() => setModal('pin')} id="organizer-login">Organizer</button>
          )}
          {authed && !state.locked && (
            <button className="btn btn-primary" onClick={() => setModal('lock')} disabled={state.byteCount < 1} id="lock-and-group">
              Lock intake &amp; create groups
            </button>
          )}
        </div>
      )}

      {modal === 'pin' && <PinModal onSubmit={verify} onClose={() => setModal(null)} />}
      {modal === 'lock' && (
        <ConfirmModal
          title="Lock intake & create groups?"
          body={`${state.bitCount} bits will be randomly split into ${state.byteCount} groups. Check-in will close for everyone.`}
          confirmLabel="Lock & create groups"
          onConfirm={async () => {
            await api.lock();
            setView('ready');
            setSlide(0);
            await refresh();
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'unlock' && (
        <ConfirmModal
          title="Reopen intake?"
          body="This discards the current groups and reopens check-in. Locking again will reshuffle everyone into new groups. Registrations are kept."
          confirmLabel="Discard groups & reopen"
          danger
          onConfirm={async () => {
            await api.unlock();
            setView('ready');
            setSlide(0);
            await refresh();
          }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
