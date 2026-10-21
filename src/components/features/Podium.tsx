import { cn } from "@/lib/utils";
import { pointsWord } from "@/config/meetings";
import { StudentAvatar } from "./StudentAvatar";

export type PodiumEntry = { id: string; name: string; studentClass: string; totalPoints: number };

// Gold, silver, bronze.
const MEDALS = ["#F5B301", "#B8BFCB", "#D08A4B"];
const BASE_HEIGHT = [62, 44, 30];
const AVATAR_SIZE = [84, 64, 64];
export const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** Ranks a list already sorted by points, students tied on points sharing the same rank. */
export function rankWithTies<T extends { totalPoints: number }>(sorted: T[]): (T & { rank: number })[] {
  let rank = 1;
  let prev: number | null = null;
  return sorted.map((s, i) => {
    if (i === 0 || s.totalPoints !== prev) rank = i + 1;
    prev = s.totalPoints;
    return { ...s, rank };
  });
}

/**
 * Top-three podium: second · first · third, the winner in the middle on the tallest
 * base. The medal shows the rank, so students tied on points share the same number.
 * `highlightId` marks the viewer's own slot.
 */
export function Podium({ entries, highlightId }: { entries: PodiumEntry[]; highlightId?: string }) {
  const top = rankWithTies(entries).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid grid-cols-[1fr_1.2fr_1fr] items-end gap-2 px-2.5 pt-5">
        {[1, 0, 2].map((i) => {
          const s = top[i];
          if (!s) return <div key={`empty-${i}`} />;
          const medal = MEDALS[i];
          const isMe = highlightId === s.id;
          return (
            <div key={s.id} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <div className="relative mb-2">
                <StudentAvatar
                  name={s.name}
                  id={s.id}
                  size={AVATAR_SIZE[i]}
                  style={{ boxShadow: `0 0 0 4px ${medal}, 0 12px 24px -12px rgba(46,16,101,.5)` }}
                />
                <span
                  className="absolute -bottom-2 grid h-7 w-7 place-items-center rounded-full text-[0.8rem] font-black text-white shadow"
                  style={{ background: medal, insetInlineEnd: -4 }}
                >
                  {s.rank}
                </span>
              </div>
              <p className={cn("max-w-full truncate text-sm font-extrabold", isMe ? "text-primary" : "text-foreground")}>
                {s.name}
                {isMe && (
                  <span className="mr-1 inline-block rounded-full bg-primary px-2 py-px align-middle text-[0.68rem] font-extrabold text-primary-foreground">
                    أنت
                  </span>
                )}
              </p>
              <p className={cn("font-black tabular-nums", s.totalPoints < 0 ? "text-destructive" : "text-primary")}>
                <span dir="ltr">{s.totalPoints}</span>{" "}
                <small className="text-[0.7rem] font-bold text-muted-foreground">{pointsWord(s.totalPoints)}</small>
              </p>
              <div
                className="w-full rounded-t-[14px] opacity-40"
                style={{ height: BASE_HEIGHT[i], background: `linear-gradient(180deg, ${medal}, rgba(255,255,255,0))` }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
