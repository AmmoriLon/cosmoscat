export function CatPortrait({
  fur,
  size = 56,
  hat,
}: {
  fur: string;
  size?: number;
  hat?: boolean;
}) {
  const ear = shade(fur, -18);
  const nose = "#e08a7a";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0 rounded-2xl ring-1 ring-white/10"
      aria-hidden
    >
      <rect width="64" height="64" rx="16" fill="#121826" />
      <path d="M10 28 L18 8 L28 24 Z" fill={ear} />
      <path d="M54 28 L46 8 L36 24 Z" fill={ear} />
      <circle cx="32" cy="36" r="18" fill={fur} />
      <circle cx="25" cy="34" r="3.2" fill="#1a140f" />
      <circle cx="39" cy="34" r="3.2" fill="#1a140f" />
      <circle cx="24.2" cy="33.1" r="1" fill="#fff6e8" />
      <circle cx="38.2" cy="33.1" r="1" fill="#fff6e8" />
      <ellipse cx="32" cy="40" rx="2.2" ry="1.5" fill={nose} />
      <path d="M32 41.5 Q28 45 24 43" stroke="#3a2a22" fill="none" strokeWidth="1.2" />
      <path d="M32 41.5 Q36 45 40 43" stroke="#3a2a22" fill="none" strokeWidth="1.2" />
      {hat ? <path d="M18 22 h28 l-4 -8 h-20 z" fill="#e8a25a" /> : null}
    </svg>
  );
}

function shade(hex: string, amt: number) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
