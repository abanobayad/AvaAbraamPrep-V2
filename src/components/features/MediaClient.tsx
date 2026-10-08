"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Media } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addMedia } from "@/app/actions/db";
import { PlaySquare, Image as ImageIcon, FileText, Link as LinkIcon, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MediaClient({ initialMedia, role }: { initialMedia: Media[], role: string }) {
  const [mediaList, setMediaList] = useState(initialMedia);

  useEffect(() => {
    setMediaList(initialMedia);
  }, [initialMedia]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({ title: "", url: "", type: "video" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addMedia(formData);
      if (!res?.success) {
        throw new Error(res?.error || 'Failed to add media');
      }
      const newMedia = res.data || res;
      setMediaList([newMedia, ...mediaList]); router.refresh();
      setIsDialogOpen(false);
      toast({ title: "تم بنجاح", description: "تم إضافة الميديا بنجاح", className: "bg-success text-white" });
      setFormData({ title: "", url: "", type: "video" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlaySquare className="h-10 w-10 text-red-500" />;
      case 'image': return <ImageIcon className="h-10 w-10 text-blue-500" />;
      case 'document': return <FileText className="h-10 w-10 text-green-500" />;
      default: return <LinkIcon className="h-10 w-10 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {(role === 'superadmin' || role === 'admin') && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-2" /> إضافة ميديا</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة ميديا / رابط جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: ترنيمة جديدة" />
                </div>
                <div className="space-y-2">
                  <Label>الرابط (URL)</Label>
                  <Input required dir="ltr" type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">فيديو (YouTube)</SelectItem>
                      <SelectItem value="document">ملف (Drive/PDF)</SelectItem>
                      <SelectItem value="image">صورة</SelectItem>
                      <SelectItem value="link">رابط خارجي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>إضافة</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {mediaList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
          لا توجد ميديا مضافة حتى الآن.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map(m => (
            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block group">
              <Card className="h-full hover:shadow-md transition-shadow border-border hover:border-primary/50 overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full group-hover:scale-110 transition-transform">
                    {getIcon(m.type)}
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground line-clamp-2">{m.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
