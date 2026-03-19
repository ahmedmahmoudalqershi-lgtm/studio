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
  Hospital
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // 1. Get base user role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);

  // 2. Get detailed profile based on role
  const role = userData?.role || 'hospital';
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const collectionName = role === 'hospital' ? 'hospitalProfiles' : 'engineerProfiles';
    return doc(firestore, collectionName, user.uid);
  }, [firestore, user?.uid, role]);

  const { data: profile, isLoading } = useDoc(profileRef);

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
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
        description: "تم حفظ التغييرات الخاصة بك بنجاح في قاعدة البيانات.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "تعذر حفظ التغييرات، يرجى المحاولة لاحقاً.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <Shell>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>جاري تحميل ملفك الشخصي...</p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
        <div className="text-right">
          <h1 className="text-3xl font-black font-headline text-primary">إدارة الملف الشخصي</h1>
          <p className="text-muted-foreground">قم بتحديث معلوماتك المهنية وبيانات الاتصال الخاصة بك.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="h-24 bg-primary/10 w-full" />
            <CardContent className="pt-0 flex flex-col items-center text-center -mt-12">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/300/300`} />
                  <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer scale-95 group-hover:scale-100">
                  <Camera className="text-white h-8 w-8" />
                </div>
              </div>
              
              <h2 className="mt-4 text-xl font-black text-foreground">
                {role === 'hospital' ? profile?.hospitalName : profile?.fullName}
              </h2>
              
              <Badge variant="secondary" className="mt-2 px-4 py-1">
                {role === 'hospital' ? (
                  <span className="flex items-center gap-1"><Hospital className="h-3 w-3" /> مستشفى مسجل</span>
                ) : (
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> مهندس معتمد</span>
                )}
              </Badge>

              <div className="w-full border-t mt-8 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" /> {user?.email}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                    <Phone className="h-4 w-4" /> {profile.phone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-xl bg-white">
            <CardHeader className="text-right border-b pb-4 mb-4">
              <CardTitle className="text-xl font-bold">المعلومات الأساسية</CardTitle>
              <CardDescription>هذه البيانات تظهر للمستشفيات والمهندسين عند التعامل مع الطلبات.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-right">
              {role === 'hospital' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">اسم المستشفى</Label>
                    <Input 
                      value={formData.hospitalName || ""} 
                      onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      placeholder="أدخل اسم المستشفى الرسمي" 
                      className="text-right h-12" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">المدينة</Label>
                      <Input 
                        value={formData.city || ""} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="text-right h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">رقم التواصل</Label>
                      <Input 
                        value={formData.phone || ""} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="05XXXXXXXX"
                        className="text-right h-11" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">العنوان التفصيلي</Label>
                    <Input 
                      value={formData.address || ""} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="text-right h-11" 
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
                        className="text-right h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">رقم الجوال</Label>
                      <Input 
                        value={formData.phone || ""} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="text-right h-11" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="font-bold">التخصص الأساسي</Label>
                      <Input 
                        value={formData.specialization || ""} 
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="text-right h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">سنوات الخبرة</Label>
                      <Input 
                        type="number"
                        value={formData.yearsExperience || 0} 
                        onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
                        className="text-right h-11" 
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl flex items-center justify-between border border-primary/10">
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">التقييم الحالي</p>
                      <p className="text-2xl font-black">{profile?.rating || '5.0'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-muted-foreground">إجمالي المهام</p>
                      <p className="text-2xl font-black">{profile?.totalJobs || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="w-full sm:w-auto gap-2 px-10 h-12 shadow-lg shadow-primary/20 transition-all active:scale-95"
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
