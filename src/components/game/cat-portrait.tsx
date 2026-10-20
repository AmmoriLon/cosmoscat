export function CatPortrait({
  fur,
  size = 56,
  hat,
}: {
  fur: string;
  size?: number;
  hat?: boolean;
}) {
  const ear = shade(fur, 12);
  const nose = "#e08a7a";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0 rounded-2xl ring-1 ring-white/10"
      aria-hidden
    >
      <rect width="64" height="64" rx="16" fill="#1c2436" />
      <path d="M8 32 L16 4 L30 26 Z" fill={ear} />
      <path d="M56 32 L48 4 L34 26 Z" fill={ear} />
      <path d="M14 18 L16 8 L22 20 Z" fill="#f6d7c8" />
      <path d="M50 18 L48 8 L42 20 Z" fill="#f6d7c8" />
      <circle cx="32" cy="38" r="18" fill={fur} />
      <circle cx="25" cy="36" r="3.4" fill="#1a140f" />
      <circle cx="39" cy="36" r="3.4" fill="#1a140f" />
      <circle cx="24.1" cy="35" r="1.1" fill="#fff6e8" />
      <circle cx="38.1" cy="35" r="1.1" fill="#fff6e8" />
      <ellipse cx="32" cy="42" rx="2.3" ry="1.6" fill={nose} />
      <path d="M32 43.6 Q27 47 23 45" stroke="#3a2a22" fill="none" strokeWidth="1.3" />
      <path d="M32 43.6 Q37 47 41 45" stroke="#3a2a22" fill="none" strokeWidth="1.3" />
      {hat ? <path d="M16 20 h32 l-5 -9 h-22 z" fill="#e8a25a" /> : null}
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
