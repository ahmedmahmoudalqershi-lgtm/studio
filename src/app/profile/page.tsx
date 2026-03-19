
"use client";

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  ShieldCheck, 
  Save,
  Loader2,
  Camera,
  MapPin,
  Phone,
  Briefcase,
  Hospital,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingImage, setIsChangingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);

  const role = userData?.role || 'hospital';
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const collectionName = role === 'hospital' ? 'hospitalProfiles' : 'engineerProfiles';
    return doc(firestore, collectionName, user.uid);
  }, [firestore, user?.uid, role]);

  const { data: profile, isLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setNewImageUrl(profile.profileImageUrl || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firestore || !user || !profileRef) return;
    setIsSaving(true);
    
    try {
      updateDocumentNonBlocking(profileRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ بياناتك بنجاح.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "تعذر حفظ التغييرات.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateImage = () => {
    if (!profileRef || !firestore) return;
    updateDocumentNonBlocking(profileRef, {
      profileImageUrl: newImageUrl,
      updatedAt: serverTimestamp()
    });
    setIsChangingImage(false);
    toast({ title: "تم تحديث الصورة", description: "تم تحديث صورتك الشخصية بنجاح." });
  };

  if (isLoading) return (
    <Shell>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>جاري تحميل ملفك الشخصي...</p>
      </div>
    </Shell>
  );

  const currentProfileImage = profile?.profileImageUrl || `https://picsum.photos/seed/${user?.uid}/300/300`;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
        <div className="text-right">
          <h1 className="text-3xl font-black font-headline text-primary">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة المعلومات المهنية وصورة الحساب الحقيقية.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-none shadow-xl overflow-hidden rounded-3xl">
            <div className="h-32 bg-gradient-to-br from-primary to-primary/80 w-full" />
            <CardContent className="pt-0 flex flex-col items-center text-center -mt-16">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-8 ring-white shadow-2xl">
                  <AvatarImage 
                    src={currentProfileImage} 
                    className="object-cover"
                    data-ai-hint={role === 'hospital' ? 'hospital building' : 'professional portrait'}
                  />
                  <AvatarFallback className="text-4xl font-bold bg-muted text-primary">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <Dialog open={isChangingImage} onOpenChange={setIsChangingImage}>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                      <Camera className="text-white h-8 w-8" />
                    </div>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>تغيير الصورة الشخصية</DialogTitle>
                      <DialogDescription>أدخل رابط الصورة الجديدة أو اختر صورة حقيقية من ملفاتك.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>رابط الصورة</Label>
                        <div className="relative">
                          <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            className="pr-10" 
                            value={newImageUrl} 
                            onChange={(e) => setNewImageUrl(e.target.value)} 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">يمكنك استخدام رابط صورة من جهازك أو من الإنترنت.</p>
                      </div>
                      {newImageUrl && (
                        <div className="flex justify-center">
                          <img src={newImageUrl} alt="Preview" className="h-24 w-24 rounded-full object-cover border" />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUpdateImage} className="w-full">تحديث الصورة الآن</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <h2 className="mt-4 text-xl font-black text-foreground">
                {role === 'hospital' ? profile?.hospitalName : profile?.fullName}
              </h2>
              
              <Badge variant="secondary" className="mt-2 px-4 py-1 rounded-lg">
                {role === 'hospital' ? (
                  <span className="flex items-center gap-1"><Hospital className="h-3 w-3" /> مستشفى</span>
                ) : (
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> مهندس معتمد</span>
                )}
              </Badge>

              <div className="w-full border-t mt-8 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                  <Mail className="h-4 w-4" /> {user?.email}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-xl rounded-3xl">
            <CardHeader className="text-right border-b pb-4 mb-4">
              <CardTitle className="text-xl font-bold">المعلومات المهنية</CardTitle>
              <CardDescription>هذه البيانات تظهر عند التعامل مع الطلبات في المنصة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-right">
              {role === 'hospital' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">اسم المستشفى الرسمي</Label>
                    <Input 
                      value={formData.hospitalName || ""} 
                      onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      className="text-right h-12 rounded-xl" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">المدينة</Label>
                      <Input 
                        value={formData.city || ""} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">رقم التواصل</Label>
                      <Input 
                        value={formData.phone || ""} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">العنوان</Label>
                    <Input 
                      value={formData.address || ""} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="text-right h-11 rounded-xl" 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">الاسم الكامل</Label>
                      <Input 
                        value={formData.fullName || ""} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">رقم الجوال</Label>
                      <Input 
                        value={formData.phone || ""} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="font-bold">التخصص</Label>
                      <Input 
                        value={formData.specialization || ""} 
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">سنوات الخبرة</Label>
                      <Input 
                        type="number"
                        value={formData.yearsExperience || 0} 
                        onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
                        className="text-right h-11 rounded-xl" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="w-full sm:w-auto gap-2 px-10 h-12 rounded-xl shadow-lg"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ البيانات الشخصية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
