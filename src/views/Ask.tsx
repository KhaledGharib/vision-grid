import { useEffect, useRef, useState } from 'react';
import { useT } from '../useT';

/**
 * In-app replacement for window.prompt / window.confirm.
 *
 * Native dialogs are unreliable: browsers suppress repeat dialogs, some
 * embedded/automated contexts never show them at all, and while one is open
 * the whole page is frozen. That made buttons look broken.
 */
export type AskState =
  | { kind: 'prompt'; title: string; placeholder?: string; value?: string; onOk: (v: string) => void }
  | { kind: 'confirm'; title: string; body?: string; danger?: boolean; onOk: () => void }
  | null;

export default function Ask({ state, onClose }: { state: AskState; onClose: () => void }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    if (state?.kind === 'prompt') {
      setVal(state.value ?? '');
      // focus after paint so the caret actually lands in the field
      setTimeout(() => inputRef.current?.select(), 30);
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onClose]);

  if (!state) return null;

  const submit = () => {
    if (state.kind === 'prompt') {
      const v = val.trim();
      if (!v) return;
      state.onOk(v);
    } else {
      state.onOk();
    }
    onClose();
  };

  return (
    <div className="ask-overlay" onClick={onClose}>
      <div className="ask" onClick={(e) => e.stopPropagation()}>
        <h3>{state.title}</h3>

        {state.kind === 'prompt' ? (
          <input
            ref={inputRef}
            value={val}
            placeholder={state.placeholder}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); submit(); }
            }}
          />
        ) : (
          state.body && <p className="ask-body">{state.body}</p>
        )}

        <div className="ask-actions">
          <button className="ghost" onClick={onClose}>{t('cancel')}</button>
          <button
            className={state.kind === 'confirm' && state.danger ? 'danger' : 'primary'}
            disabled={state.kind === 'prompt' && !val.trim()}
            onClick={submit}
          >
            {state.kind === 'prompt' ? t('create') : t('confirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
