"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { awardPoints } from "@/app/actions/db";
import { Loader2 } from "lucide-react";
import { TransactionHistoryDialog } from "./TransactionHistoryDialog";
import { SERVER_UNREACHABLE } from "@/lib/messages";

const SPIRITUAL_BUTTONS = [
  { label: "حضور قداس", value: 25, variant: "outline" },
  { label: "تسبحة وعشية", value: 20, variant: "outline" },
  { label: "طقس ألحان", value: 15, variant: "outline" },
  { label: "مدارس الأحد", value: 15, variant: "outline" },
  { label: "درس كتاب مقدس", value: 15, variant: "outline" },
];

const SPORT_BUTTONS = [
  { label: "دوري كورة", value: 10, variant: "outline" },
  { label: "دوري شطرنج", value: 15, variant: "outline" },
  { label: "دوري بلايستيشن", value: 15, variant: "outline" },
  { label: "دوري بينج بونج", value: 15, variant: "outline" },
];

const PENALTY_BUTTONS = [
  { label: "خصم سلوك", value: -5, variant: "destructive" },
];


export function PointsLeaderboardClient({ initialStudents }: { initialStudents: any[] }) {
  const [students, setStudents] = useState(initialStudents);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isDeductConfirmOpen, setIsDeductConfirmOpen] = useState(false);
  
  const [historyStudent, setHistoryStudent] = useState<any | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [customPoints, setCustomPoints] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [deductReason, setDeductReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const sortedStudents = [...students].sort((a, b) => {
    const ptsB = b.totalPoints || 0;
    const ptsA = a.totalPoints || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    return a.name.localeCompare(b.name, 'ar');
  });

  const handleAward = async (studentId: string, points: number, reason: string) => {
    setLoading(true);
    try {
      const updatedStudent = await awardPoints(studentId, points, reason);
      if (!updatedStudent?.success) {
        throw new Error(updatedStudent?.error || SERVER_UNREACHABLE);
      }
      
      const finalStudent = updatedStudent.data;
      setStudents(prev => prev.map(s => s.id === studentId ? finalStudent : s));
        router.refresh();
      
      toast({ title: "تم بنجاح", description: `تم حفظ النقاط (${reason})`, className: "bg-success text-white" });
      setCustomPoints("");
      setCustomReason("");
      setDeductReason("");
      setIsAwardDialogOpen(false);
      setIsDeductConfirmOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !customPoints || !customReason) return;
    const pts = parseInt(customPoints, 10);
    handleAward(selectedStudent.id, pts, customReason);
  };

  const handleQuickButton = (btn: any) => {
    if (btn.label === "خصم سلوك") {
      setIsAwardDialogOpen(false);
      setIsDeductConfirmOpen(true);
    } else {
      handleAward(selectedStudent!.id, btn.value, btn.label);
    }
  };

  return (
    <div className="space-y-4">
      <TransactionHistoryDialog 
        student={historyStudent} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      {/* Deduct Confirm Dialog */}
      <Dialog open={isDeductConfirmOpen} onOpenChange={(open) => !loading && setIsDeductConfirmOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد خصم سلوك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Label>سبب الخصم (اختياري)</Label>
            <Input 
              value={deductReason} 
              onChange={e => setDeductReason(e.target.value)} maxLength={88}
              placeholder="مثال: شغب في الفصل..." 
              disabled={loading}
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-start mt-4">
            <Button 
              variant="destructive" 
              disabled={loading}
              onClick={() => handleAward(selectedStudent!.id, -5, deductReason ? `خصم سلوك: ${deductReason}` : "خصم سلوك")}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الخصم (-5)
            </Button>
            <Button variant="outline" disabled={loading} onClick={() => {
              setIsDeductConfirmOpen(false);
              setIsAwardDialogOpen(true);
            }}>
              رجوع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={(open) => !loading && setIsAwardDialogOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل نقاط: {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">أزرار سريعة</Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary">إضافات روحية</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPIRITUAL_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} (+{btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary">إضافات نشاط</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPORT_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} (+{btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-destructive">خصومات</Label>
                  <div className="flex flex-wrap gap-2">
                    {PENALTY_BUTTONS.map((btn) => (
                      <Button key={btn.label} variant={btn.variant as any} disabled={loading} onClick={() => handleQuickButton(btn)} size="sm">
                        {btn.label} ({btn.value})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <form onSubmit={handleCustomPoints} className="space-y-4">
              <Label className="text-muted-foreground">إضافة مخصصة (نقاط / خصم)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>النقاط</Label>
                  <Input type="number" dir="ltr" value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder="مثال: 5 أو -2" required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Input value={customReason} onChange={e => setCustomReason(e.target.value)} maxLength={100} placeholder="السبب..." required disabled={loading} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                حفظ
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">الترتيب</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفصل</TableHead>
              <TableHead>إجمالي النقاط</TableHead>
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
                <TableCell 
                  className={`text-xl font-black rounded transition-colors ${s.totalPoints < 0 ? 'text-destructive hover:bg-destructive/10' : 'text-amber-500 hover:bg-amber-100'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistoryStudent(s);
                    setIsHistoryOpen(true);
                  }}
                  title="سجل النقاط"
                >
                  <span className={`border-b-2 border-dashed pb-0.5 ${s.totalPoints < 0 ? 'border-destructive/50' : 'border-amber-500/50'}`}>
                    <span dir="ltr">{s.totalPoints}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
