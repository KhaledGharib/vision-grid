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
      className="avatar"
      style={{
        width: size,
        height: size,
        background: emoji ? `${bg}22` : bg,
        borderColor: emoji ? bg : 'var(--border)',
        fontSize: emoji ? size * 0.52 : size * 0.42,
        color: emoji ? undefined : '#fff',
      }}
      aria-hidden
    >
      {emoji || initial}
    </div>
  );
}
