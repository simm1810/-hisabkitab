const COLORS = ['#0f766e', '#f97316', '#0d5f59', '#ea5f0a', '#149a8f', '#ff9d4d'];

function colorForName(name = '') {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx] || COLORS[0];
}

export default function Avatar({ name, url, size = 40, ring = false }) {
  const initials = (name || '?')
    .trim()
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const style = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${ring ? 'ring-2 ring-white' : ''}`}
      />
    );
  }

  return (
    <div
      style={{ ...style, backgroundColor: colorForName(name) }}
      className={`rounded-full flex items-center justify-center text-white font-semibold ${ring ? 'ring-2 ring-white' : ''}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initials}</span>
    </div>
  );
}
