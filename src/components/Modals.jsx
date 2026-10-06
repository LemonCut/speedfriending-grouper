import { useEffect, useRef, useState } from 'react';

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function go() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <p>{body}</p>
      {error && <p className="error-text">{error}</p>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose} id="confirm-cancel">Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={go} disabled={busy} id="confirm-ok">
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function PinModal({ onSubmit, onClose }) {
  const [pin, setPinValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  async function submit(e) {
    e.preventDefault();
    try {
      await onSubmit(pin);
      onClose();
    } catch (err) {
      setError(err.message);
      setPinValue('');
    }
  }
  return (
    <Modal title="Organizer access" onClose={onClose}>
      <p>Enter the organizer PIN to manage intake and groups.</p>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <input
          ref={inputRef}
          id="organizer-pin"
          className="input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPinValue(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!pin} id="organizer-pin-submit">Unlock</button>
        </div>
      </form>
    </Modal>
  );
}
