"use client"
import { useState } from "react";
import { Student } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { awardPoints } from "@/app/actions/db";
import { Award, Plus, Minus } from "lucide-react";
import { POINTS_CONFIG } from "@/config/points";
import { TransactionHistoryDialog } from "./TransactionHistoryDialog";

export function PointsLeaderboardClient({ initialStudents, currentUser }: { initialStudents: Student[], currentUser: string }) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customPoints, setCustomPoints] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { toast } = useToast();

  const sortedStudents = [...students].sort((a, b) => b.totalPoints - a.totalPoints);

  const handleAward = async (studentId: string, points: number, reason: string) => {
    try {
      const updatedStudent = await awardPoints(studentId, points, reason, currentUser);
      setStudents(students.map(s => s.id === studentId ? updatedStudent : s));
      toast({ title: "تم بنجاح", description: `تمت إضافة النقاط بنجاح (${reason})`, className: "bg-success text-white" });
      setCustomPoints("");
      setCustomReason("");
      setIsAwardDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    }
  };

  const handleCustomPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !customPoints || !customReason) return;
    const pts = parseInt(customPoints, 10);
    handleAward(selectedStudent.id, pts, customReason);
  };

  return (
    <div className="space-y-4">
      <TransactionHistoryDialog 
        student={historyStudent} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة نقاط: {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">نقاط سريعة</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleAward(selectedStudent!.id, POINTS_CONFIG.MASS.value, POINTS_CONFIG.MASS.label)}>{POINTS_CONFIG.MASS.label} (+{POINTS_CONFIG.MASS.value})</Button>
                <Button variant="outline" onClick={() => handleAward(selectedStudent!.id, POINTS_CONFIG.HYMNS.value, POINTS_CONFIG.HYMNS.label)}>{POINTS_CONFIG.HYMNS.label} (+{POINTS_CONFIG.HYMNS.value})</Button>
                <Button variant="outline" onClick={() => handleAward(selectedStudent!.id, POINTS_CONFIG.SUNDAY_SCHOOL.value, POINTS_CONFIG.SUNDAY_SCHOOL.label)}>{POINTS_CONFIG.SUNDAY_SCHOOL.label} (+{POINTS_CONFIG.SUNDAY_SCHOOL.value})</Button>
                <Button variant="outline" onClick={() => handleAward(selectedStudent!.id, POINTS_CONFIG.PRAISE_VESPERS.value, POINTS_CONFIG.PRAISE_VESPERS.label)}>{POINTS_CONFIG.PRAISE_VESPERS.label} (+{POINTS_CONFIG.PRAISE_VESPERS.value})</Button>
                <Button variant="outline" className="col-span-2" onClick={() => handleAward(selectedStudent!.id, POINTS_CONFIG.BIBLE_STUDY.value, POINTS_CONFIG.BIBLE_STUDY.label)}>{POINTS_CONFIG.BIBLE_STUDY.label} (+{POINTS_CONFIG.BIBLE_STUDY.value})</Button>
              </div>
            </div>

            <hr />

            <form onSubmit={handleCustomPoints} className="space-y-4">
              <Label className="text-muted-foreground">نقاط مخصصة (إضافة / خصم)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>النقاط (يمكن أن تكون بالسالب)</Label>
                  <Input type="number" dir="ltr" value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder="مثال: 5 أو -2" required />
                </div>
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="سبب الإضافة/الخصم" required />
                </div>
              </div>
              <Button type="submit" className="w-full">حفظ النقاط المخصصة</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">المركز</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفصل</TableHead>
              <TableHead>تاريخ آخر تحديث</TableHead>
              <TableHead>مجموع النقاط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((s, index) => (
              <TableRow 
                key={s.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSelectedStudent(s);
                  setIsAwardDialogOpen(true);
                }}
              >
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-bold text-primary">{s.name}</TableCell>
                <TableCell>{s.studentClass}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('ar-EG') : "-"}
                </TableCell>
                <TableCell 
                  className="text-xl font-black text-amber-500 hover:bg-amber-100 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistoryStudent(s);
                    setIsHistoryOpen(true);
                  }}
                  title="عرض سجل النقاط"
                >
                  <span className="border-b-2 border-dashed border-amber-500/50 pb-0.5">{s.totalPoints}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
