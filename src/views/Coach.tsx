import { useState } from 'react';

/**
 * Collapsible inline coaching. Explains how to phrase a goal at this level,
 * with good/bad examples. Remembers its open/closed state per key.
 */
export function Coach({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const key = `vg:coach:${id}`;
  const [open, setOpen] = useState(() => localStorage.getItem(key) !== 'closed');

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(key, next ? 'open' : 'closed');
  };

  return (
    <div className={`coach${open ? ' open' : ''}`}>
      <button className="coach-head" onClick={toggle}>
        <span className="coach-ico">💡</span>
        <span className="coach-title">{title}</span>
        <span className="coach-chev">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="coach-body">{children}</div>}
    </div>
  );
}

/** A good/bad example pair. */
export function Example({ bad, good, why }: { bad: string; good: string; why: string }) {
  return (
    <div className="ex">
      <div className="ex-row bad">
        <span className="ex-tag">✗</span>
        <span>{bad}</span>
      </div>
      <div className="ex-row good">
        <span className="ex-tag">✓</span>
        <span>{good}</span>
      </div>
      <div className="ex-why">{why}</div>
    </div>
  );
}
