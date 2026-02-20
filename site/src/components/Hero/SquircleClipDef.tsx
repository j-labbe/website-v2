/**
 * Hidden SVG that defines the squircle (superellipse) clip-path.
 * Uses clipPathUnits="objectBoundingBox" so the path scales responsively
 * to any element size. Reference via: style={{ clipPath: 'url(#squircle-clip)' }}
 *
 * The control points (0.875/0.125) produce a pronounced superellipse shape
 * that is noticeably different from a standard border-radius rounded rectangle.
 */
export function SquircleClipDef() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute' }}
    >
      <defs>
        <clipPath id="squircle-clip" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.875 0, 1 0.125, 1 0.5 C 1 0.875, 0.875 1, 0.5 1 C 0.125 1, 0 0.875, 0 0.5 C 0 0.125, 0.125 0, 0.5 0 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
