import Image from "next/image";
import { CAT_PORTRAITS } from "@/lib/game/data";

export function CatPortrait({
  name,
  size = 56,
}: {
  name: string;
  size?: number;
}) {
  const src = CAT_PORTRAITS[name];
  if (!src) {
    return (
      <span
        className="shrink-0 rounded-2xl bg-[#1c2436] ring-1 ring-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-2xl bg-[#0a0e16] ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </span>
  );
}
