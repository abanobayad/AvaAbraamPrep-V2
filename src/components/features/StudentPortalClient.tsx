"use client"
import { useState } from "react";
import { Student } from "@prisma/client";
import { Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionHistoryDialog } from "./TransactionHistoryDialog";
import { useToast } from "@/components/ui/use-toast";

export function StudentPortalClient({ students, currentStudentId }: { students: Student[], currentStudentId: string | undefined }) {
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();

  let currentRank = 1;
  let prevPoints: number | null = null;
  let rankOffset = 0;
  
  const rankedStudents = students.map((s, idx) => {
    if (prevPoints !== null && s.totalPoints === prevPoints) {
      rankOffset++;
    } else {
      currentRank += rankOffset;
      if (prevPoints === null) currentRank = 1; 
      else currentRank = idx + 1;
      rankOffset = 0;
    }
    prevPoints = s.totalPoints;
    return { ...s, rank: currentRank };
  });

  const myStudent = rankedStudents.find(s => s.id === currentStudentId);

  return (
    <div className="space-y-4">
      <TransactionHistoryDialog 
        student={historyStudent} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      
      {myStudent && (
        <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center shadow-lg font-bold">
          <h2 className="text-xl">ترتيبك: {myStudent.rank} من {rankedStudents.length}</h2>
          <p className="text-3xl mt-2">{myStudent.totalPoints} نقطة</p>
        </div>
      )}

      <h3 className="text-2xl font-bold text-primary flex items-center gap-2 mt-8">
        <Award className="h-6 w-6" /> لوحة الشرف (جميع الفصول)
      </h3>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">الترتيب</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفصل</TableHead>
              <TableHead className="text-left">النقاط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedStudents.map((s) => {
              const isMe = s.id === currentStudentId;
              return (
                <TableRow key={s.id} className={isMe ? "bg-primary/20 font-bold" : ""}>
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${s.rank <= 3 ? 'bg-amber-100 text-amber-700 font-bold text-lg' : 'bg-muted text-muted-foreground'}`}>
                      {s.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.name} 
                    {isMe && <span className="inline-block mr-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">أنت</span>}
                  </TableCell>
                  <TableCell>{s.studentClass}</TableCell>
                  <TableCell 
                    className={`text-left text-lg font-black rounded transition-colors ${isMe ? 'cursor-pointer hover:bg-amber-100/50' : 'cursor-not-allowed opacity-90'} ${s.totalPoints < 0 ? 'text-destructive' : 'text-amber-500'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMe) {
                        setHistoryStudent(s as any);
                        setIsHistoryOpen(true);
                      } else {
                        toast({ variant: "destructive", title: "مرفوض", description: "غير مصرح لك برؤية سجل هذا الطالب." });
                      }
                    }}
                    title={isMe ? "اضغط هنا لرؤية سجل نقاطك" : "غير مصرح"}
                  >
                    <span className={isMe ? `border-b-2 border-dashed pb-0.5 ${s.totalPoints < 0 ? 'border-destructive/50' : 'border-amber-500/50'}` : ""} dir="ltr">
                      {s.totalPoints}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
