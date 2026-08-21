// Vision Grid icon set — "Style A", drawn in Figma and mirrored here.
// Source of truth for the geometry: the Figma library at
// https://www.figma.com/design/uhIEMyeHrK9kjjsRaEeu5r ("Style A · Lucide-matched").
//
// These replace the emoji and Unicode glyphs that used to stand in for icons.
// Glyphs were a real problem, not a style preference: they cannot inherit
// currentColor, so hover and disabled states could not tint them; and symbols
// like ⤒ ⤓ ⇤ ▭ have thin font coverage, so they fell back to whatever face the
// Arabic stack resolved next — a different weight and baseline from the Latin
// text beside them, and tofu on machines missing the glyph entirely.
//
// The set matches lucide's conventions on purpose (24×24 box, 2px stroke, round
// caps and joins, `currentColor`) so these sit beside the lucide icons already
// used in the dialogs and planning views with no visible seam.

import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Pixel size for both axes, default 24. A Tailwind class such as `h-4 w-4`
   * still wins — CSS beats the width/height attributes — so existing call
   * sites keep sizing icons the way they already do.
   */
  size?: number | string;
}

function svgProps({ size = 24, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    // Decorative by default: every call site pairs the icon with a title or
    // aria-label on the control itself.
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

/* ---------------- align ----------------
   One guide line plus two object bars, so the six read as a system: the line
   is the edge being aligned to, the bars are what moves. */

export const AlignStart = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 3v18" />
    <rect x="7" y="5" width="13" height="5" rx="1.5" />
    <rect x="7" y="14" width="9" height="5" rx="1.5" />
  </svg>
);

export const AlignHCenter = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3v18" />
    <rect x="5.5" y="5" width="13" height="5" rx="1.5" />
    <rect x="7.5" y="14" width="9" height="5" rx="1.5" />
  </svg>
);

export const AlignEnd = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M21 3v18" />
    <rect x="4" y="5" width="13" height="5" rx="1.5" />
    <rect x="8" y="14" width="9" height="5" rx="1.5" />
  </svg>
);

export const AlignTop = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 3h18" />
    <rect x="5" y="7" width="5" height="13" rx="1.5" />
    <rect x="14" y="7" width="5" height="9" rx="1.5" />
  </svg>
);

export const AlignVCenter = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 12h18" />
    <rect x="5" y="5.5" width="5" height="13" rx="1.5" />
    <rect x="14" y="7.5" width="5" height="9" rx="1.5" />
  </svg>
);

export const AlignBottom = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 21h18" />
    <rect x="5" y="4" width="5" height="13" rx="1.5" />
    <rect x="14" y="8" width="5" height="9" rx="1.5" />
  </svg>
);

/* ---------------- arrange ----------------
   A rail means "all the way"; no rail means "one step". */

export const ToFront = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 3h16" />
    <path d="M12 20V8" />
    <path d="M8 12l4-4 4 4" />
  </svg>
);

export const Forward = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 19V9" />
    <path d="M8 13l4-4 4 4" />
  </svg>
);

export const Backward = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 5v10" />
    <path d="M8 11l4 4 4-4" />
  </svg>
);

export const ToBack = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 21h16" />
    <path d="M12 4v12" />
    <path d="M8 12l4 4 4-4" />
  </svg>
);

/* ---------------- board toolbar ---------------- */

export const AddVision = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="M20.5 16.5L15 11l-6.5 6.5" />
  </svg>
);

export const TextHeading = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7V5h16v2" />
    <path d="M12 5v14" />
    <path d="M9 19h6" />
  </svg>
);

export const TextBody = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
  </svg>
);

export const Quote = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M6 17c3.2 0 5.2-2.1 5.2-5.3V7H5.8v5.2h3" />
    <path d="M15.4 17c3.2 0 5.2-2.1 5.2-5.3V7h-5.4v5.2h3" />
  </svg>
);

export const ShapeRect = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
  </svg>
);

export const ShapeEllipse = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <ellipse cx="12" cy="12" rx="8.5" ry="7" />
  </svg>
);

export const Undo = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3.5 9.5h10a5.5 5.5 0 0 1 0 11H9" />
    <path d="M7.5 5.5l-4 4 4 4" />
  </svg>
);

export const Redo = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M20.5 9.5h-10a5.5 5.5 0 0 0 0 11H15" />
    <path d="M16.5 5.5l4 4-4 4" />
  </svg>
);

export const Duplicate = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </svg>
);

export const Delete = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7h16" />
    <path d="M10 4h4" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10.5 11v6" />
    <path d="M13.5 11v6" />
  </svg>
);

export const ZoomOut = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20.5 20.5l-5-5" />
    <path d="M7.5 10.5h6" />
  </svg>
);

export const ZoomIn = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20.5 20.5l-5-5" />
    <path d="M7.5 10.5h6" />
    <path d="M10.5 7.5v6" />
  </svg>
);

/** Four corners pushing outward — "frame everything". */
export const FitAll = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 9V4h5" />
    <path d="M20 9V4h-5" />
    <path d="M4 15v5h5" />
    <path d="M20 15v5h-5" />
  </svg>
);

export const ExportPng = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

/* ---------------- shell and canvas ---------------- */

/** The app mark: the ◈ glyph as real geometry. */
export const LogoDiamond = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 2.5L21.5 12 12 21.5 2.5 12z" />
    <path d="M12 8l4 4-4 4-4-4z" />
  </svg>
);

export const Rename = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M16.4 3.6a2.6 2.6 0 0 1 3.7 3.7L7.6 19.8 3.2 21l1.2-4.4z" />
    <path d="M14.5 5.5l4 4" />
  </svg>
);

export const NewBoard = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export const Help = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2A2.6 2.6 0 0 1 12 7.4c1.5 0 2.6 1 2.6 2.3 0 1.1-.7 1.6-1.5 2.1-.7.5-1.1.9-1.1 1.9" />
    <path d="M12 16.6v1.2" />
  </svg>
);

export const DownloadJson = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M12 11.5v5.5" />
    <path d="M9.5 14.5L12 17l2.5-2.5" />
  </svg>
);

export const SyncCloud = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M17.3 19H7a4.6 4.6 0 0 1-.6-9.1A6.1 6.1 0 0 1 18 11.4a3.8 3.8 0 0 1-.7 7.6z" />
  </svg>
);

export const SyncError = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3.6L2.6 20h18.8z" />
    <path d="M12 9.6v4.2" />
    <path d="M12 16.6v1.2" />
  </svg>
);

export const Lock = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5v-3a4 4 0 0 1 8 0v3" />
  </svg>
);

export const Unlock = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5v-3a4 4 0 0 1 7.5-1.9" />
  </svg>
);

export const Minimap = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 3.5L3.5 5.8v14.7L9 18.2l6 2.3 5.5-2.3V3.5L15 5.8z" />
    <path d="M9 3.5v14.7" />
    <path d="M15 5.8v14.7" />
  </svg>
);
