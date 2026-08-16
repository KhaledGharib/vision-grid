import { useRef } from 'react';
import { nanoid } from 'nanoid';
import { useStore } from '../store';
import { putImage } from '../storage';
import { PALETTE } from '../types';

export default function Inspector() {
  const els = useStore((s) => s.boardElements)();
  const selection = useStore((s) => s.selection);
  const updateEl = useStore((s) => s.updateEl);
  const board = useStore((s) => s.activeBoard)();
  const setBoardBg = useStore((s) => s.setBoardBg);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const bringForward = useStore((s) => s.bringForward);
  const sendBackward = useStore((s) => s.sendBackward);
  const align = useStore((s) => s.align);
  const select = useStore((s) => s.select);
  const fileRef = useRef<HTMLInputElement>(null);

  const sel = els.filter((e) => selection.includes(e.id));
  const one = sel.length === 1 ? sel[0] : null;

  return (
    <aside className="inspector">
      {sel.length === 0 && (
        <>
          <h4>Board</h4>
          <div className="field">
            <label>Background</label>
            <div className="swatches">
              {PALETTE.map((c) => (
                <button key={c} className={`sw${board?.bg === c ? ' on' : ''}`}
                  style={{ background: c }} onClick={() => setBoardBg(c)} />
              ))}
            </div>
          </div>
          <p className="muted small">
            Click an element to edit it. Drag on empty space to marquee-select.
          </p>
          <h4 style={{ marginTop: 18 }}>Layers</h4>
          <div className="layers">
            {[...els].reverse().map((e) => (
              <button key={e.id} className="layer" onClick={() => select([e.id])}>
                <span className="layer-ico">
                  {e.kind === 'vision' ? '🖼' : e.kind === 'text' ? 'T' : '◻'}
                </span>
                <span className="layer-name">
                  {e.kind === 'vision' ? e.title : e.kind === 'text' ? e.text : e.shape}
                </span>
                {e.locked && <span>🔒</span>}
              </button>
            ))}
            {els.length === 0 && <p className="muted small">Nothing on the board yet.</p>}
          </div>
        </>
      )}

      {sel.length > 1 && (
        <>
          <h4>{sel.length} selected</h4>
          <div className="field">
            <label>Align</label>
            <div className="btn-grid">
              <button onClick={() => align('left')} title="Align left">⇤</button>
              <button onClick={() => align('hcenter')} title="Center horizontally">↔</button>
              <button onClick={() => align('right')} title="Align right">⇥</button>
              <button onClick={() => align('top')} title="Align top">⇡</button>
              <button onClick={() => align('vcenter')} title="Center vertically">↕</button>
              <button onClick={() => align('bottom')} title="Align bottom">⇣</button>
            </div>
          </div>
        </>
      )}

      {one && (
        <>
          <h4>{one.kind === 'vision' ? 'Vision' : one.kind === 'text' ? 'Text' : 'Shape'}</h4>

          {one.kind === 'vision' && (
            <>
              <div className="field">
                <label>Title</label>
                <input value={one.title ?? ''} onChange={(e) => updateEl(one.id, { title: e.target.value })} />
              </div>
              <div className="field">
                <label>Why does this matter?</label>
                <textarea rows={3} value={one.why ?? ''}
                  placeholder="The reason you'll still care in November..."
                  onChange={(e) => updateEl(one.id, { why: e.target.value })} />
              </div>
              <div className="field">
                <label>Target date</label>
                <input type="date" value={one.targetDate ?? ''}
                  onChange={(e) => updateEl(one.id, { targetDate: e.target.value || null })} />
              </div>
              <div className="field">
                <label>Image fit</label>
                <div className="btn-row">
                  <button className={one.fit === 'cover' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { fit: 'cover' })}>Cover</button>
                  <button className={one.fit === 'contain' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { fit: 'contain' })}>Contain</button>
                </div>
              </div>
              <div className="field">
                <label>Corner radius — {one.radius ?? 12}px</label>
                <input type="range" min={0} max={80} value={one.radius ?? 12}
                  onChange={(e) => updateEl(one.id, { radius: +e.target.value }, false)} />
              </div>
              <button onClick={() => fileRef.current?.click()}>Replace image…</button>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const id = nanoid();
                  await putImage(id, f);
                  updateEl(one.id, { imageId: id });
                }} />
            </>
          )}

          {one.kind === 'text' && (
            <>
              <div className="field">
                <label>Text</label>
                <textarea rows={3} value={one.text ?? ''}
                  onChange={(e) => updateEl(one.id, { text: e.target.value })} />
              </div>
              <div className="field">
                <label>Size — {one.fontSize}px</label>
                <input type="range" min={10} max={120} value={one.fontSize ?? 22}
                  onChange={(e) => updateEl(one.id, { fontSize: +e.target.value }, false)} />
              </div>
              <div className="field">
                <label>Weight</label>
                <div className="btn-row">
                  {[400, 600, 800].map((w) => (
                    <button key={w} className={one.fontWeight === w ? 'on' : ''}
                      onClick={() => updateEl(one.id, { fontWeight: w })}>
                      {w === 400 ? 'Reg' : w === 600 ? 'Semi' : 'Bold'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Align</label>
                <div className="btn-row">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button key={a} className={one.align === a ? 'on' : ''}
                      onClick={() => updateEl(one.id, { align: a })}>{a[0].toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Colour</label>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button key={c} className={`sw${one.color === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => updateEl(one.id, { color: c })} />
                  ))}
                </div>
              </div>
            </>
          )}

          {one.kind === 'shape' && (
            <>
              <div className="field">
                <label>Fill</label>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button key={c} className={`sw${one.fill === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => updateEl(one.id, { fill: c })} />
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Border width — {one.strokeWidth ?? 0}px</label>
                <input type="range" min={0} max={20} value={one.strokeWidth ?? 0}
                  onChange={(e) => updateEl(one.id, { strokeWidth: +e.target.value }, false)} />
              </div>
              <div className="field">
                <label>Border colour</label>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button key={c} className={`sw${one.stroke === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => updateEl(one.id, { stroke: c })} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* shared */}
          <div className="field">
            <label>Opacity — {Math.round((one.opacity ?? 1) * 100)}%</label>
            <input type="range" min={10} max={100} value={(one.opacity ?? 1) * 100}
              onChange={(e) => updateEl(one.id, { opacity: +e.target.value / 100 }, false)} />
          </div>
          <div className="field">
            <label>Rotation — {one.rotation}°</label>
            <input type="range" min={-180} max={180} value={one.rotation}
              onChange={(e) => updateEl(one.id, { rotation: +e.target.value }, false)} />
          </div>
          <div className="field">
            <label>Arrange</label>
            <div className="btn-grid four">
              <button onClick={() => bringToFront(one.id)} title="Bring to front">⤒</button>
              <button onClick={() => bringForward(one.id)} title="Forward">↑</button>
              <button onClick={() => sendBackward(one.id)} title="Backward">↓</button>
              <button onClick={() => sendToBack(one.id)} title="Send to back">⤓</button>
            </div>
          </div>
          <button onClick={() => updateEl(one.id, { locked: !one.locked })}>
            {one.locked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
        </>
      )}
    </aside>
  );
}
