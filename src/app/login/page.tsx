'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Wrench, Hospital, ShieldCheck, Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // حقل الاسم الجديد لجعل الملف الشخصي حقيقياً
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeRole, setActiveRole] = useState<'hospital' | 'engineer'>('hospital');
  
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, router, isLoading]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  async function handleAuth() {
    if (!email || !password || (isSignUp && !name)) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال جميع الحقول المطلوبة." });
      return;
    }

    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "بريد غير صالح", description: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUser = userCredential.user;

        // 1. إنشاء وثيقة المستخدم الأساسية
        await setDoc(doc(firestore, 'users', newUser.uid), {
          id: newUser.uid,
          email: newUser.email,
          role: activeRole,
          status: 'verified',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. إنشاء الملف الشخصي المتخصص بالاسم الحقيقي المختار
        if (activeRole === 'hospital') {
          await setDoc(doc(firestore, 'hospitalProfiles', newUser.uid), {
            id: newUser.uid,
            userId: newUser.uid,
            hospitalName: name,
            address: "الرياض، المملكة العربية السعودية",
            city: "الرياض",
            phone: "05XXXXXXXX",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(firestore, 'engineerProfiles', newUser.uid), {
            id: newUser.uid,
            userId: newUser.uid,
            fullName: name,
            phone: "05XXXXXXXX",
            specialization: "صيانة أجهزة طبية",
            yearsExperience: 2,
            rating: 5,
            totalJobs: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        toast({ title: "مرحباً بك!", description: "تم إنشاء حسابك الحقيقي بنجاح." });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "تم الدخول", description: "مرحباً بعودتك إلى المنصة." });
      }
    } catch (err: any) {
      let message = "فشلت العملية، يرجى التحقق من البيانات.";
      if (err.code === 'auth/email-already-in-use') message = "هذا البريد مسجل بالفعل.";
      else if (err.code === 'auth/wrong-password') message = "كلمة المرور غير صحيحة.";
      
      toast({ variant: "destructive", title: "خطأ في الدخول", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-3xl">
        <div className="bg-primary p-8 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="bg-white/20 backdrop-blur-md mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-black font-headline">بوابة الصيانة</CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-2">نظام صيانة الأجهزة الطبية المتكامل</CardDescription>
        </div>

        <CardContent className="pt-8">
          <Tabs defaultValue="hospital" className="w-full" onValueChange={(v) => setActiveRole(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 h-14 rounded-2xl">
              <TabsTrigger value="hospital" className="gap-2 rounded-xl data-[state=active]:shadow-md">
                <Hospital className="h-4 w-4" /> مستشفى
              </TabsTrigger>
              <TabsTrigger value="engineer" className="gap-2 rounded-xl data-[state=active]:shadow-md">
                <ShieldCheck className="h-4 w-4" /> مهندس
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">{activeRole === 'hospital' ? 'اسم المستشفى' : 'الاسم الكامل'}</Label>
                  <div className="relative">
                    <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder={activeRole === 'hospital' ? 'مثال: مستشفى التخصصي' : 'مثال: م. أحمد علي'} className="pr-10 h-12 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="example@email.com" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button onClick={handleAuth} disabled={isLoading} className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 mt-4">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'إنشاء حساب حقيقي' : 'تسجيل الدخول')}
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm">
                  {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground justify-center border-t py-4 bg-muted/20">
          بالدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية.
        </CardFooter>
      </Card>
    </div>
  );
}