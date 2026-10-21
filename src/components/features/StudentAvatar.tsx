import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Six fixed avatar colours; a student always gets the same one.
const HUES = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#E11D48"];

export function avatarHue(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

/** First letter of the name, for a student without a photo. */
export function initialOf(name: string): string {
  return name.trim().charAt(0) || "؟";
}

export function StudentAvatar({
  name,
  id,
  size = 44,
  className,
  style,
}: {
  name: string;
  id?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 select-none place-items-center rounded-full font-black text-white", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: avatarHue(id ?? name), ...style }}
    >
      {initialOf(name)}
    </span>
  );
}
