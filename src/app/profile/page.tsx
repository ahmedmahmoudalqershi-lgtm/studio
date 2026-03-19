
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, limit } from 'firebase/firestore';

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const profileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'engineerProfiles'), where('userId', '==', user.uid), limit(1));
  }, [firestore, user?.uid]);

  const { data: profiles, isLoading } = useCollection(profileQuery);
  const profile = profiles?.[0];

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ التغييرات الخاصة بك بنجاح.",
      });
    }, 1500);
  };

  return (
    <Shell role={profile ? "engineer" : "hospital"}>
      <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
        <div className="text-right">
          <h1 className="text-3xl font-bold font-headline">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة معلومات حسابك وتفضيلات الإشعارات.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-none shadow-lg">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                  <AvatarFallback className="text-4xl">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white h-8 w-8" />
                </div>
              </div>
              <h2 className="mt-4 text-xl font-bold">{profile?.fullName || user?.email?.split('@')[0]}</h2>
              <Badge variant="secondary" className="mt-1">
                {profile ? 'مهندس معتمد' : 'مستشفى مسجل'}
              </Badge>
              <div className="w-full border-t mt-6 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                  <Mail className="h-4 w-4" /> {user?.email}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-lg">
            <CardHeader className="text-right">
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>هذه المعلومات ستظهر للأطراف الأخرى عند التعامل مع الطلبات.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input defaultValue={profile?.fullName || ""} placeholder="أدخل اسمك الكامل" className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <Input defaultValue={profile?.phone || ""} placeholder="05xxxxxxxx" className="text-right" />
                </div>
              </div>

              {profile && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-bold flex items-center gap-2 justify-end">
                    تفاصيل المهنة <ShieldCheck className="h-4 w-4 text-primary" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>التخصص</Label>
                      <Input defaultValue={profile.specialization} className="text-right" />
                    </div>
                    <div className="space-y-2">
                      <Label>سنوات الخبرة</Label>
                      <Input type="number" defaultValue={profile.yearsExperience} className="text-right" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto gap-2 px-8">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
