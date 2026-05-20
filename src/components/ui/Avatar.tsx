interface AvatarProps {
  name?: string;
  initials?: string;
  size?: number;
}

export function Avatar({ name, initials, size = 28 }: AvatarProps) {
  const inits =
    initials ||
    (name || '')
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  // Deterministic hue from initials so each user has a stable color
  const hue =
    (inits.charCodeAt(0) + (inits.charCodeAt(1) || 0) * 7) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `oklch(0.93 0.04 ${hue})`,
        color: `oklch(0.38 0.10 ${hue})`,
        display: 'grid',
        placeItems: 'center',
        fontSize: size <= 24 ? 10 : 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {inits}
    </div>
  );
}
