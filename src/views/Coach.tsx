import { useEffect, useState } from 'react';

/**
 * Help that stays out of the way.
 *
 * The old version was an inline card, open by default, ~480px tall — it filled
 * the whole screen and pushed the user's actual goals below the fold. You had
 * to scroll past a lecture to see your own work.
 *
 * Now it's a small "?" next to the heading that opens a panel on demand, and
 * once you've read it the app stops offering it.
 */
export function Coach({
  title,
  children,
}: {
  /** kept for call-site clarity; no longer used for persistence */
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const show = () => setOpen(true);

  return (
    <>
      <button
        className="coach-btn"
        onClick={show}
        title={title}
        aria-label={title}
      >
        ?
      </button>

      {open && (
        <div className="ask-overlay" onClick={() => setOpen(false)}>
          <div className="ask ask-wide coach-modal" onClick={(e) => e.stopPropagation()}>
            <h3>💡 {title}</h3>
            <div className="coach-body">{children}</div>
            <div className="ask-actions">
              <button className="primary" onClick={() => setOpen(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
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
