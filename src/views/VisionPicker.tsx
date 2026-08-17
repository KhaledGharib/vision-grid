import { useState } from 'react';
import type { BoardElement } from '../types';
import { useImage } from '../hooks/useImage';
import { useT } from '../useT';

function Thumb({ el, size = 34 }: { el: BoardElement; size?: number }) {
  const url = useImage(el.imageId);
  return url ? (
    <img src={url} alt="" className="vp-thumb" style={{ width: size, height: size }} draggable={false} />
  ) : (
    <div className="vp-thumb vp-ph" style={{ width: size, height: size }}>🎯</div>
  );
}

/**
 * Vision picker showing the actual picture.
 *
 * A native <select> can only render text, so choosing which vision a goal
 * serves meant reading filenames like "Screenshot 2026-05-31" — the whole
 * point of a vision board is that you recognise the image, not the name.
 */
export default function VisionPicker({
  visions,
  value,
  onChange,
}: {
  visions: BoardElement[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const picked = visions.find((v) => v.id === value);

  return (
    <div className="vp">
      <button
        type="button"
        className={`vp-trigger${picked ? ' has' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {picked ? (
          <>
            <Thumb el={picked} />
            <span className="vp-name">{picked.title}</span>
          </>
        ) : (
          <span className="vp-name muted">{t('pickVision')}</span>
        )}
        <span className="vp-chev">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <>
          <div className="vp-backdrop" onClick={() => setOpen(false)} />
          <div className="vp-menu">
            {visions.map((v) => (
              <button
                type="button"
                key={v.id}
                className={`vp-item${v.id === value ? ' on' : ''}`}
                onClick={() => { onChange(v.id); setOpen(false); }}
              >
                <Thumb el={v} size={42} />
                <span className="vp-name">{v.title}</span>
                {v.id === value && <span className="vp-tick">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
