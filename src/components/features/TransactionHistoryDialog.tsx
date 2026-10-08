"use client"
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, Student } from "@prisma/client";
import { getStudentHistory } from "@/app/actions/db";
import { Loader2 } from "lucide-react";

export function TransactionHistoryDialog({ 
  student, 
  isOpen, 
  onClose 
}: { 
  student: Student | null, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      getStudentHistory(student.id).then(res => {
        const txs = res?.success ? res.data : [];
        setTransactions(txs);
        setLoading(false);
      });
    }
  }, [isOpen, student]);

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>سجل نقاط: {student.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              لا توجد حركات مسجلة حتى الآن.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {transactions.map((tx, i) => (
                <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <span dir="ltr" className={`font-bold ${tx.pointsChanged > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.pointsChanged > 0 ? '+' : ''}{tx.pointsChanged}
                    </span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border border-border shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-card-foreground ml-2">{tx.actionName}</div>
                      <time className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString('ar-EG')}</time>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      تمت الإضافة بواسطة: {tx.addedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
