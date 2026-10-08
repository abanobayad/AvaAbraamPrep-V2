"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, PlaySquare, Image as ImageIcon, FileText, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react"
import { addMedia } from "@/app/actions/db"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { List, ListLink, EmptyState } from "@/components/ui/list"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"

type MediaRow = { id: string; title: string; url: string; type: string; createdAt: string }

const TYPES = [
  { value: "video", label: "فيديو", icon: PlaySquare },
  { value: "document", label: "ملف", icon: FileText },
  { value: "image", label: "صورة", icon: ImageIcon },
  { value: "link", label: "رابط", icon: LinkIcon },
]

function TypeIcon({ type }: { type: string }) {
  const Icon = TYPES.find((t) => t.value === type)?.icon ?? LinkIcon
  return <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
}

export function MediaClient({ initialMedia, canAdd }: { initialMedia: MediaRow[]; canAdd: boolean }) {
  const [items, setItems] = useState<MediaRow[]>(initialMedia)
  useEffect(() => setItems(initialMedia), [initialMedia])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: "", url: "", type: "video" })
  const { toast } = useToast()
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await addMedia(form)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setItems((prev) => [res.data, ...prev])
      router.refresh()
      setOpen(false)
      setForm({ title: "", url: "", type: "video" })
      toast({ variant: "success", title: "تمت الإضافة", description: res.data.title })
    } catch (err: any) {
      toast({ variant: "destructive", title: "لم تتم الإضافة", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {canAdd ? (
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus />
          إضافة رابط
        </Button>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="لا توجد روابط بعد" hint={canAdd ? "أضف فيديو أو ملف أو رابط ليظهر للمخدومين." : "سيظهر هنا ما يشاركه الخدام."} />
      ) : (
        <List>
          {items.map((m) => (
            <ListLink key={m.id} href={m.url} external>
              <TypeIcon type={m.type} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </ListLink>
          ))}
        </List>
      )}

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة رابط</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="m-title">العنوان</Label>
              <Input id="m-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: ترنيمة الأسبوع" disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-url">الرابط</Label>
              <Input id="m-url" required type="url" inputMode="url" dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} disabled={busy}>
                <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              إضافة
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
