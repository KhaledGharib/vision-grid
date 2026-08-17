// Board -> PNG. Renders elements onto a 2D canvas (no external dependency).

import { useStore } from './store';
import { bounds } from './canvas';
import { FONTS, isRtlText } from './types';
import { imageUrl } from './storage';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function exportBoardPng(scale = 2) {
  const s = useStore.getState();
  const board = s.activeBoard();
  const els = s.boardElements();
  if (!board) return;

  // Infinite canvas: crop to the content bounding box with padding.
  const bb = bounds(els);
  if (!bb) return;
  const pad = 48;
  const W = bb.w + pad * 2;
  const H = bb.h + pad * 2;

  const cv = document.createElement('canvas');
  cv.width = Math.round(W * scale);
  cv.height = Math.round(H * scale);
  const ctx = cv.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = board.bg || '#0d0f14';
  ctx.fillRect(0, 0, W, H);
  // shift world so content starts at the padding offset
  ctx.translate(-bb.x + pad, -bb.y + pad);

  for (const e of els) {
    ctx.save();
    ctx.globalAlpha = e.opacity ?? 1;
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate((e.rotation * Math.PI) / 180);
    ctx.translate(-e.w / 2, -e.h / 2);

    if (e.kind === 'vision') {
      const r = e.radius ?? 12;
      ctx.save();
      roundRect(ctx, 0, 0, e.w, e.h, r);
      ctx.clip();
      if (e.imageId) {
        const url = await imageUrl(e.imageId);
        if (url) {
          try {
            const img = await loadImg(url);
            const ir = img.width / img.height;
            const br = e.w / e.h;
            let dw = e.w, dh = e.h, dx = 0, dy = 0;
            const cover = (e.fit ?? 'cover') === 'cover';
            if (cover ? ir > br : ir < br) { dh = e.h; dw = dh * ir; dx = (e.w - dw) / 2; }
            else { dw = e.w; dh = dw / ir; dy = (e.h - dh) / 2; }
            ctx.drawImage(img, dx, dy, dw, dh);
          } catch { /* skip broken image */ }
        }
      } else {
        ctx.fillStyle = '#1b2029';
        ctx.fillRect(0, 0, e.w, e.h);
      }
      // caption bar
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, e.h - 34, e.w, 34);
      ctx.fillStyle = '#e6e9ef';
      ctx.font = '600 15px ui-sans-serif, Segoe UI, system-ui';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.title ?? '', 10, e.h - 17, e.w - 20);
      ctx.restore();
    }

    if (e.kind === 'shape') {
      ctx.fillStyle = e.fill ?? '#f0b429';
      ctx.strokeStyle = e.stroke ?? '#f0b429';
      ctx.lineWidth = e.strokeWidth ?? 0;
      if (e.shape === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(e.w / 2, e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (e.strokeWidth) ctx.stroke();
      } else if (e.shape === 'line') {
        ctx.fillStyle = e.stroke ?? '#f0b429';
        ctx.fillRect(0, 0, e.w, e.h);
      } else {
        roundRect(ctx, 0, 0, e.w, e.h, e.radius ?? 8);
        ctx.fill();
        if (e.strokeWidth) ctx.stroke();
      }
    }

    if (e.kind === 'draw' && e.points?.length) {
      ctx.strokeStyle = e.stroke ?? '#f0b429';
      ctx.lineWidth = e.strokeWidth ?? 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const P = e.points.map((p) => ({ x: p.x * e.w, y: p.y * e.h }));
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      if (P.length === 2) {
        ctx.lineTo(P[1].x, P[1].y);
      } else {
        for (let i = 1; i < P.length - 1; i++) {
          const mx = (P[i].x + P[i + 1].x) / 2;
          const my = (P[i].y + P[i + 1].y) / 2;
          ctx.quadraticCurveTo(P[i].x, P[i].y, mx, my);
        }
        const last = P[P.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    }

    if (e.kind === 'text') {
      ctx.fillStyle = e.color ?? '#e6e9ef';
      const style = e.italic ? 'italic ' : '';
      const fam = FONTS.find((f) => f.id === (e.fontFamily ?? 'sans'))?.css
        ?? 'ui-sans-serif, Segoe UI, system-ui';
      ctx.font = `${style}${e.fontWeight ?? 400} ${e.fontSize ?? 22}px ${fam}`;
      const rtl = e.dir === 'rtl' || (e.dir !== 'ltr' && isRtlText(e.text ?? ''));
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textBaseline = 'top';
      const align = e.align ?? 'left';
      ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
      const tx = align === 'center' ? e.w / 2 : align === 'right' ? e.w : 0;

      // naive word wrap
      const words = (e.text ?? '').split(/\s+/);
      const lh = (e.fontSize ?? 22) * 1.25;
      let line = '';
      let y = 0;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > e.w && line) {
          ctx.fillText(line, tx, y);
          line = word;
          y += lh;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, tx, y);
    }

    ctx.restore();
  }

  await new Promise<void>((resolve) => {
    cv.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${board.name.replace(/\s+/g, '-').toLowerCase()}-board.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      resolve();
    }, 'image/png');
  });
}
