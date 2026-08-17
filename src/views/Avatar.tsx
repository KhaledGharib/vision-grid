/** One avatar, used everywhere: account panel, friend list, nudges. */
export default function Avatar({
  emoji,
  color,
  name,
  size = 38,
}: {
  emoji?: string | null;
  color?: string | null;
  name?: string | null;
  size?: number;
}) {
  const bg = color ?? '#2a313c';
  // Falls back to the first letter so a friend who never set an avatar still
  // reads as a person rather than an empty circle.
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full border-2 leading-none"
      style={{
        width: size,
        height: size,
        background: emoji ? `${bg}22` : bg,
        borderColor: emoji ? bg : '#262c38',
        fontSize: emoji ? size * 0.52 : size * 0.42,
        color: emoji ? undefined : '#fff',
        fontWeight: emoji ? undefined : 600,
      }}
      aria-hidden
    >
      {emoji || initial}
    </div>
  );
}
