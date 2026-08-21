import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useStore, useStoreData } from '../store';
import { deleteImage, prepareImage, putImage } from '../storage';
import { FONTS, PALETTE } from '../types';
import type { BoardElement } from '../types';
import { useT } from '../useT';
import {
  AlignStart, AlignHCenter, AlignEnd, AlignTop, AlignVCenter, AlignBottom,
  ToFront, Forward, Backward, ToBack, Lock, Unlock,
} from '../icons';

export default function Inspector() {
  useStoreData();
  const t = useT();
  const els = useStore((s) => s.boardElements)();
  const selection = useStore((s) => s.selection);
  const updateEl = useStore((s) => s.updateEl);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const bringForward = useStore((s) => s.bringForward);
  const sendBackward = useStore((s) => s.sendBackward);
  const align = useStore((s) => s.align);
  const updateLive = useStore((s) => s.updateLive);
  const commit = useStore((s) => s.commit);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);
  /** True once this focus or drag has already taken its single undo snapshot. */
  const editing = useRef(false);

  const sel = els.filter((e) => selection.includes(e.id));
  const one = sel.length === 1 ? sel[0] : null;

  // No selection, no panel. Every hook above has already run, so returning
  // here does not change the hook order between renders.
  if (sel.length === 0) return null;

  /**
   * A continuous control — a text field or a slider — is one edit, not one edit
   * per keystroke. beginEdit() takes the snapshot once when the control is
   * engaged; live() then mutates without touching the undo stack, and with the
   * write to disk coalesced.
   *
   * Before this, typing a 20-character goal title pushed 20 full-state
   * snapshots, so a 50-step history held about two titles and Ctrl+Z walked
   * back one character at a time.
   */
  const beginEdit = () => {
    if (editing.current) return;
    commit();
    editing.current = true;
  };
  const endEdit = () => { editing.current = false; };
  const live = (id: string, patch: Partial<BoardElement>) => updateLive({ [id]: patch });

  return (
    <aside className="inspector">
      {sel.length > 1 && (
        <>
          <h4>{sel.length} {t('selectedCount')}</h4>
          <div className="field">
            <label>{t('alignLabel')}</label>
            <div className="btn-grid">
              <button onClick={() => align('left')} title={t('alignLeftEdge')} aria-label={t('alignLeftEdge')}>
                <AlignStart className="icon" />
              </button>
              <button onClick={() => align('hcenter')} title={t('alignHCenter')} aria-label={t('alignHCenter')}>
                <AlignHCenter className="icon" />
              </button>
              <button onClick={() => align('right')} title={t('alignRightEdge')} aria-label={t('alignRightEdge')}>
                <AlignEnd className="icon" />
              </button>
              <button onClick={() => align('top')} title={t('alignTop')} aria-label={t('alignTop')}>
                <AlignTop className="icon" />
              </button>
              <button onClick={() => align('vcenter')} title={t('alignVCenter')} aria-label={t('alignVCenter')}>
                <AlignVCenter className="icon" />
              </button>
              <button onClick={() => align('bottom')} title={t('alignBottom')} aria-label={t('alignBottom')}>
                <AlignBottom className="icon" />
              </button>
            </div>
          </div>
        </>
      )}

      {one && (
        <>
          <h4>{one.kind === 'vision' ? t('vision') : one.kind === 'text' ? t('text') : t('shape')}</h4>

          {one.kind === 'vision' && (
            <>
              <div className="field">
                <label>{t('title')}</label>
                <input
                  value={one.title ?? ''}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => live(one.id, { title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>{t('whyMatters')}</label>
                <textarea rows={3} value={one.why ?? ''}
                  placeholder={t('whyPlaceholder')}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => live(one.id, { why: e.target.value })} />
              </div>
              <div className="field">
                <label>{t('targetDate')}</label>
                <input type="date" value={one.targetDate ?? ''}
                  onChange={(e) => updateEl(one.id, { targetDate: e.target.value || null })} />
              </div>
              <div className="field">
                <label>{t('imageFit')}</label>
                <div className="btn-row">
                  <button className={one.fit === 'cover' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { fit: 'cover' })}>{t('cover')}</button>
                  <button className={one.fit === 'contain' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { fit: 'contain' })}>{t('contain')}</button>
                </div>
              </div>
              <div className="field">
                <label>{t('cornerRadius')} — {one.radius ?? 12}px</label>
                <input type="range" min={0} max={80} value={one.radius ?? 12}
                  onPointerDown={beginEdit} onPointerUp={endEdit}
                  onFocus={beginEdit} onBlur={endEdit}
                  onChange={(e) => live(one.id, { radius: +e.target.value })} />
              </div>
              <button onClick={() => fileRef.current?.click()}>{t('replaceImage')}</button>
              {imgErr && <p className="muted small" role="alert">{imgErr}</p>}
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = ''; // so the same file can be picked twice
                  if (!f) return;
                  setImgErr(null);
                  const previous = one.imageId;
                  try {
                    const blob = await prepareImage(f);
                    const id = nanoid();
                    await putImage(id, blob);
                    updateEl(one.id, { imageId: id });
                    // Only now is the old blob unreferenced. Leaving it behind
                    // orphaned it in IndexedDB and in the storage bucket.
                    if (previous) void deleteImage(previous);
                  } catch (err) {
                    setImgErr(err instanceof Error && err.message === 'image_too_large'
                      ? t('imageTooLarge')
                      : t('imageInvalid'));
                  }
                }} />
            </>
          )}

          {one.kind === 'text' && (
            <>
              <div className="field">
                <label>{t('text')}</label>
                <textarea rows={3} value={one.text ?? ''}
                  onFocus={beginEdit}
                  onBlur={endEdit}
                  onChange={(e) => live(one.id, { text: e.target.value })} />
              </div>
              <div className="field">
                <label>{t('size')} — {one.fontSize}px</label>
                <input type="range" min={10} max={120} value={one.fontSize ?? 22}
                  onPointerDown={beginEdit} onPointerUp={endEdit}
                  onFocus={beginEdit} onBlur={endEdit}
                  onChange={(e) => live(one.id, { fontSize: +e.target.value })} />
              </div>
              <div className="field">
                <label>{t('weight')}</label>
                <div className="btn-row">
                  {[400, 600, 800].map((w) => (
                    <button key={w} className={one.fontWeight === w ? 'on' : ''}
                      onClick={() => updateEl(one.id, { fontWeight: w })}>
                      {w === 400 ? t('weightRegular') : w === 600 ? t('weightSemi') : t('weightBold')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>{t('alignLabel')}</label>
                <div className="btn-row">
                  {/* 'left' is the LEADING edge, so label it that way — in Arabic
                      the leading edge is the right-hand side. */}
                  <button className={one.align === 'left' ? 'on' : ''}
                    title={t('alignStart')} aria-label={t('alignStart')}
                    onClick={() => updateEl(one.id, { align: 'left' })}>
                    <AlignStart className="icon icon-logical" />
                  </button>
                  <button className={one.align === 'center' ? 'on' : ''}
                    title={t('alignHCenter')} aria-label={t('alignHCenter')}
                    onClick={() => updateEl(one.id, { align: 'center' })}>
                    <AlignHCenter className="icon" />
                  </button>
                  <button className={one.align === 'right' ? 'on' : ''}
                    title={t('alignEnd')} aria-label={t('alignEnd')}
                    onClick={() => updateEl(one.id, { align: 'right' })}>
                    <AlignEnd className="icon icon-logical" />
                  </button>
                </div>
              </div>
              <div className="field">
                <label>{t('colour')}</label>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button key={c} className={`sw${one.color === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => updateEl(one.id, { color: c })} />
                  ))}
                </div>
              </div>
              <div className="field">
                <label>{t('font')}</label>
                <div className="btn-row">
                  {FONTS.map((f) => (
                    <button key={f.id} className={(one.fontFamily ?? 'sans') === f.id ? 'on' : ''}
                      onClick={() => updateEl(one.id, { fontFamily: f.id })}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>{t('direction')}</label>
                <div className="btn-row">
                  <button className={(one.dir ?? 'auto') === 'auto' ? 'on' : ''}
                    title={t('auto')}
                    onClick={() => updateEl(one.id, { dir: 'auto' })}>{t('auto')}</button>
                  <button className={one.dir === 'ltr' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { dir: 'ltr' })}>LTR</button>
                  <button className={one.dir === 'rtl' ? 'on' : ''}
                    onClick={() => updateEl(one.id, { dir: 'rtl' })}>RTL</button>
                </div>
              </div>
            </>
          )}

          {one.kind === 'shape' && (
            <>
              <div className="field">
                <label>{t('fill')}</label>
                <div className="swatches">
                  {PALETTE.map((c) => (
                    <button key={c} className={`sw${one.fill === c ? ' on' : ''}`}
                      style={{ background: c }} onClick={() => updateEl(one.id, { fill: c })} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* shared */}
          <div className="field">
            <label>{t('arrange')}</label>
            <div className="btn-grid four">
              <button onClick={() => bringToFront(one.id)} title={t('toFront')} aria-label={t('toFront')}>
                <ToFront className="icon" />
              </button>
              <button onClick={() => bringForward(one.id)} title={t('forward')} aria-label={t('forward')}>
                <Forward className="icon" />
              </button>
              <button onClick={() => sendBackward(one.id)} title={t('backward')} aria-label={t('backward')}>
                <Backward className="icon" />
              </button>
              <button onClick={() => sendToBack(one.id)} title={t('toBack')} aria-label={t('toBack')}>
                <ToBack className="icon" />
              </button>
            </div>
          </div>
          <button className="with-icon" onClick={() => updateEl(one.id, { locked: !one.locked })}>
            {one.locked ? <Unlock className="icon" /> : <Lock className="icon" />}
            {one.locked ? t('unlock') : t('lock')}
          </button>
        </>
      )}
    </aside>
  );
}
