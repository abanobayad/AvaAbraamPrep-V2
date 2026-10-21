import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CLASSES } from "@/config/classes";

export type ClassCounts = Record<string, number>;

/** Counts students per class, always listing the three known classes in order. */
export function countByClass(students: { studentClass: string }[]): ClassCounts {
  const counts: ClassCounts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  for (const s of students) counts[s.studentClass] = (counts[s.studentClass] ?? 0) + 1;
  return counts;
}

/** Single-series horizontal bar chart: number of students in each class. */
export function ClassCountsChart({ counts }: { counts: ClassCounts }) {
  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  const max = Math.max(1, ...entries.map(([, n]) => n));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>عدد المخدومين في كل مرحلة</CardTitle>
        <CardDescription>
          الإجمالي: <span className="font-bold text-foreground" dir="ltr">{total}</span> مخدوم
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4" aria-label="عدد المخدومين لكل مرحلة">
          {entries.map(([cls, n]) => (
            <li key={cls} className="space-y-1.5" title={`${cls}: ${n} مخدوم`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{cls}</span>
                <span className="font-bold text-primary" dir="ltr">{n}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${cls}: ${n}`}>
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${Math.round((n / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
