
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Hospital, ShieldCheck, Loader2, User as UserIcon, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const APP_LOGO_URL = `https://img.icons8.com/fluency/240/key.png`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeRole, setActiveRole] = useState<'hospital' | 'engineer' | 'admin'>('hospital');
  
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

        await setDoc(doc(firestore, 'users', newUser.uid), {
          id: newUser.uid,
          email: newUser.email,
          role: activeRole,
          status: 'verified',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (activeRole === 'admin') {
          await setDoc(doc(firestore, 'roles_admin', newUser.uid), {
            id: newUser.uid,
            email: newUser.email,
            createdAt: serverTimestamp(),
          });
        }

        if (activeRole === 'hospital') {
          await setDoc(doc(firestore, 'hospitalProfiles', newUser.uid), {
            id: newUser.uid,
            userId: newUser.uid,
            hospitalName: name,
            address: "المملكة العربية السعودية",
            city: "الرياض",
            phone: "05XXXXXXXX",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (activeRole === 'engineer') {
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

        toast({ title: "مرحباً بك!", description: "تم إنشاء حسابك بنجاح." });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "تم الدخول", description: "مرحباً بعودتك إلى المنصة." });
      }
    } catch (err: any) {
      let message = "فشلت العملية، يرجى التحقق من البيانات.";
      if (err.code === 'auth/email-already-in-use') message = "هذا البريد مسجل بالفعل.";
      else if (err.code === 'auth/invalid-credential') message = "بيانات الدخول غير صحيحة.";
      
      toast({ variant: "destructive", title: "خطأ", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-[3rem] z-10 relative bg-white/95 backdrop-blur-xl ring-1 ring-black/5">
        <div className="bg-primary p-10 text-center text-primary-foreground relative overflow-hidden">
          <div className="bg-white mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center mb-6 p-4 shadow-2xl overflow-hidden transform hover:scale-105 transition-transform">
            <Image 
              src={APP_LOGO_URL} 
              alt="صيانة بلس" 
              width={140} 
              height={140} 
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-3xl font-black font-headline tracking-tighter">بوابة صيانة بلس</CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-2 font-medium">المنصة المتقدمة للهندسة الطبية</CardDescription>
        </div>

        <CardContent className="pt-8 px-8 sm:px-10 pb-10">
          <Tabs defaultValue="hospital" className="w-full" onValueChange={(v) => setActiveRole(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1.5 h-14 rounded-2xl">
              <TabsTrigger value="hospital" className="gap-1.5 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:shadow-md">
                <Hospital className="h-4 w-4" /> مستشفى
              </TabsTrigger>
              <TabsTrigger value="engineer" className="gap-1.5 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:shadow-md">
                <ShieldCheck className="h-4 w-4" /> مهندس
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-1.5 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:shadow-md">
                <Settings className="h-4 w-4" /> مدير
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-foreground/80 pr-2">{activeRole === 'hospital' ? 'اسم المستشفى' : activeRole === 'admin' ? 'الاسم الإداري' : 'الاسم الكامل'}</Label>
                  <div className="relative">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="name" placeholder="أدخل الاسم هنا..." className="pr-12 h-14 rounded-2xl border-2 focus:border-primary/50 bg-slate-50/50" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-foreground/80 pr-2">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="example@email.com" className="h-14 rounded-2xl text-right border-2 focus:border-primary/50 bg-slate-50/50" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-foreground/80 pr-2">كلمة المرور</Label>
                <Input id="password" type="password" placeholder="••••••••" className="h-14 rounded-2xl text-right border-2 focus:border-primary/50 bg-slate-50/50" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button onClick={handleAuth} disabled={isLoading} className="w-full h-15 text-lg rounded-[1.5rem] shadow-xl shadow-primary/20 mt-4 font-black tracking-wide">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isSignUp ? 'إنشاء حساب جديد' : 'دخول المنصة')}
              </Button>

              <div className="text-center pt-2">
                <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-bold text-primary/80 hover:text-primary transition-colors">
                  {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground justify-center border-t py-6 bg-slate-50 font-medium">
          دخول آمن ومشفر • صيانة بلس • {new Date().getFullYear()}
        </CardFooter>
      </Card>
    </div>
  );
}
