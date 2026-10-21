import { Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export type PodiumEntry = { id: string; name: string; studentClass: string; totalPoints: number };

const PLACES = [
  { rank: 1, label: "الأول", ring: "ring-amber-400", badge: "bg-amber-400 text-amber-950", glow: "shadow-amber-200/60 dark:shadow-amber-900/40", height: "md:-translate-y-4" },
  { rank: 2, label: "الثاني", ring: "ring-slate-300", badge: "bg-slate-300 text-slate-900", glow: "shadow-slate-200/60 dark:shadow-slate-800/40", height: "" },
  { rank: 3, label: "الثالث", ring: "ring-orange-300", badge: "bg-orange-300 text-orange-950", glow: "shadow-orange-200/60 dark:shadow-orange-900/40", height: "" },
] as const;

/**
 * Top-three podium. Visual order (RTL): second · first · third, with the first lifted.
 * `highlightId` marks the viewer's own card.
 */
export function Podium({ entries, highlightId }: { entries: PodiumEntry[]; highlightId?: string }) {
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;
  // Render order second, first, third so the winner sits in the middle.
  const order = [top[1], top[0], top[2]].filter(Boolean) as PodiumEntry[];

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-6">
      {order.map((s) => {
        const place = PLACES[top.indexOf(s)];
        const isMe = highlightId === s.id;
        return (
          <div
            key={s.id}
            className={cn(
              "relative rounded-2xl bg-card border ring-2 p-3 md:p-5 text-center shadow-lg transition-transform",
              place.ring,
              place.glow,
              place.height,
              isMe && "outline outline-2 outline-primary outline-offset-2"
            )}
          >
            <div className={cn("absolute -top-4 right-1/2 translate-x-1/2 h-9 w-9 rounded-full flex items-center justify-center font-black shadow", place.badge)}>
              {place.rank === 1 ? <Crown className="h-5 w-5" /> : place.rank}
            </div>
            <Medal className={cn("mx-auto mt-3 h-7 w-7 md:h-9 md:w-9", place.rank === 1 ? "text-amber-500" : place.rank === 2 ? "text-slate-400" : "text-orange-500")} />
            <p className="mt-2 font-bold text-sm md:text-lg leading-tight line-clamp-2">{s.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.studentClass}</p>
            <p className={cn("mt-2 text-2xl md:text-3xl font-black", s.totalPoints < 0 ? "text-destructive" : "text-primary")} dir="ltr">
              {s.totalPoints}
            </p>
            <p className="text-[11px] text-muted-foreground">نقطة · المركز {place.label}</p>
            {isMe && <span className="mt-2 inline-block text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">أنت</span>}
          </div>
        );
      })}
    </div>
  );
}
