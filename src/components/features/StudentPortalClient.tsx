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

  return (
    <div className="space-y-4">
      <TransactionHistoryDialog 
        student={historyStudent} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
        <Award className="h-6 w-6" /> لوحة الشرف
      </h3>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">المركز</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفصل</TableHead>
              <TableHead className="text-left">النقاط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s, index) => {
              const isMe = s.id === currentStudentId;
              return (
                <TableRow key={s.id} className={isMe ? "bg-primary/10 font-bold" : ""}>
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.name} 
                    {isMe && <span className="inline-block mr-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">أنت</span>}
                  </TableCell>
                  <TableCell>{s.studentClass}</TableCell>
                  <TableCell 
                    className={`text-left text-lg font-black text-amber-500 rounded transition-colors ${isMe ? 'cursor-pointer hover:bg-amber-100' : 'cursor-not-allowed opacity-90'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMe) {
                        setHistoryStudent(s);
                        setIsHistoryOpen(true);
                      } else {
                        toast({ variant: "destructive", title: "عفواً", description: "غير مصرح لك برؤية تفاصيل هذا المخدوم" });
                      }
                    }}
                    title={isMe ? "عرض سجل النقاط الخاص بي" : "غير مصرح"}
                  >
                    <span className={isMe ? "border-b-2 border-dashed border-amber-500/50 pb-0.5" : ""}>{s.totalPoints}</span>
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
