import { useEffect, useMemo, useRef } from 'react';
import BubbleField from '../components/BubbleField.jsx';
import { formatGroupTitle, chunkGroups } from '../formatGroupTitle.js';

export default function Presentation({ groups, groupsPerSlide = 1, index, onNext, onPrev, onExit }) {
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

  const batches = useMemo(() => chunkGroups(groups, groupsPerSlide), [groups, groupsPerSlide]);
  const currentBatch = batches[index] || batches[0] || [];
  const title = formatGroupTitle(currentBatch);
  const titleKey = currentBatch.map((g) => g.number).join('-');

  return (
    <main className="presentation">
      <header className="pres-header">
        <h1 key={titleKey} className={`gradient-text slide-${direction}`}>{title}</h1>
        <div className="progress" aria-hidden="true">
          {batches.map((b, i) => (
            <i key={i} className={i === index ? 'current' : i < index ? 'done' : ''} />
          ))}
        </div>
      </header>

      {groupsPerSlide === 1 ? (
        <BubbleField
          key={currentBatch[0]?.number}
          names={
            currentBatch[0]?.members.map(
              (m) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || '',
            ) || []
          }
        />
      ) : (
        <div className={`multi-group-arena count-${currentBatch.length}`}>
          {currentBatch.map((group) => {
            const names = group.members.map(
              (m) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || '',
            );
            return (
              <div key={group.number} className="group-card-rounded glass">
                <div className="group-card-header">
                  <span className="group-badge">Group {group.number}</span>
                  <span className="group-member-count">
                    {group.members.length} {group.members.length === 1 ? 'bit' : 'bits'}
                  </span>
                </div>
                <BubbleField names={names} multiCount={groupsPerSlide} />
              </div>
            );
          })}
        </div>
      )}

      <footer className="pres-footer">
        <span>
          {index + 1} / {batches.length}
        </span>
        <span>
          <span className="kbd">←</span> back · <span className="kbd">Space</span> / <span className="kbd">→</span>{' '}
          {index === batches.length - 1 ? 'all groups' : 'next'}
        </span>
      </footer>
    </main>
  );
}

