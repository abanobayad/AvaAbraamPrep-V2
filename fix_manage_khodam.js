const fs = require('fs');

let c = fs.readFileSync('src/components/features/ManageKhodamClient.tsx', 'utf8');

if (!c.includes('resetKhademPassword')) {
  c = c.replace(/import \{ addKhadem, deleteKhadem \} from "@\/app\/actions\/db";/, 'import { addKhadem, deleteKhadem } from "@/app/actions/db";\nimport { resetKhademPassword } from "@/app/actions/auth";');
}
if (!c.includes('KeyRound')) {
  c = c.replace(/import \{ Trash2, UserPlus \} from "lucide-react";/, 'import { Trash2, UserPlus, KeyRound, Copy } from "lucide-react";');
}

if (!c.includes('function ChangePasswordDialog')) {
  const dialogCode = `
function ChangePasswordDialog({ khademId, khademName }: { khademId: string, khademName: string }) {
  const [open, setOpen] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [successPass, setSuccessPass] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomArray = new Uint8Array(10);
    crypto.getRandomValues(randomArray);
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars[randomArray[i] % chars.length];
    }
    setNewPass(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetKhademPassword(khademId, newPass);
    setLoading(false);
    if (res.success) {
      setSuccessPass(newPass);
    } else {
      toast({ variant: "destructive", title: "خطأ", description: res.error });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(successPass);
    toast({ title: "تم النسخ", description: "تم نسخ كلمة السر للحافظة" });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) { setNewPass(""); setSuccessPass(""); }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <KeyRound className="h-4 w-4 ml-1" /> كلمة السر
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير كلمة السر: {khademName}</DialogTitle>
        </DialogHeader>
        {successPass ? (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 text-success rounded-md border border-success/20">
              <p className="font-bold mb-2">تم التغيير بنجاح!</p>
              <p className="text-sm">احفظ كلمة السر دي دلوقتي، مش هتظهر تاني:</p>
              <div className="flex items-center gap-2 mt-4">
                <code className="flex-1 p-2 bg-background border rounded text-center text-lg select-all" dir="ltr">
                  {successPass}
                </code>
                <Button onClick={copyToClipboard} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة السر الجديدة</Label>
              <div className="flex gap-2">
                <Input required dir="ltr" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={loading} minLength={8} maxLength={64} />
                <Button type="button" variant="secondary" onClick={handleGenerate} disabled={loading}>توليد تلقائي</Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>حفظ</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
`;
  c = c.replace(/export function ManageKhodamClient/, dialogCode + '\nexport function ManageKhodamClient');
}

c = c.replace(/<TableCell className="text-left">\s*<Button variant="destructive"/, 
  `<TableCell className="text-left flex items-center justify-end gap-2">
                  <ChangePasswordDialog khademId={k.id} khademName={k.name} />
                  <Button variant="destructive"`);

fs.writeFileSync('src/components/features/ManageKhodamClient.tsx', c);
