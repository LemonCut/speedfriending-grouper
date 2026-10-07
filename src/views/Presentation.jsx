import { useEffect, useMemo, useRef } from 'react';
import BubbleField from '../components/BubbleField.jsx';

export default function Presentation({ groups, index, onNext, onPrev, onExit }) {
  const prevIndexRef = useRef(index);
  const direction = index < prevIndexRef.current ? 'left' : 'right';

  useEffect(() => {
    prevIndexRef.current = index;
  }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onExit]);

  const group = groups[index];
  const names = useMemo(
    () => group.members.map((m) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [group.number, group.members.length],
  );

  return (
    <main className="presentation">
      <header className="pres-header">
        <h1 key={group.number} className={`gradient-text slide-${direction}`}>Group {group.number}</h1>
        <div className="progress" aria-hidden="true">
          {groups.map((g, i) => (
            <i key={g.number} className={i === index ? 'current' : i < index ? 'done' : ''} />
          ))}
        </div>
      </header>

      <BubbleField key={group.number} names={names} />

      <footer className="pres-footer">
        <span>
          {group.number} / {groups.length}
        </span>
        <span>
          <span className="kbd">←</span> back · <span className="kbd">Space</span> / <span className="kbd">→</span>{' '}
          {index === groups.length - 1 ? 'all groups' : 'next'}
        </span>
      </footer>
    </main>
  );
}
