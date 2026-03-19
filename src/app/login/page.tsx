
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Wrench, Hospital, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  async function handleAuth(type: 'login' | 'signup', role: 'hospital' | 'engineer') {
    if (!email || !password) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال البريد الإلكتروني وكلمة المرور." });
      return;
    }

    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "بريد إلكتروني غير صالح", description: "يرجى إدخال بريد إلكتروني بصيغة صحيحة." });
      return;
    }

    setIsLoading(true);
    
    try {
      if (type === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUser = userCredential.user;

        // إنشاء وثيقة المستخدم الأساسية
        await setDoc(doc(firestore, 'users', newUser.uid), {
          id: newUser.uid,
          email: newUser.email,
          role: role,
          status: 'verified',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // إنشاء ملف التعريف الأولي
        const profileCol = role === 'hospital' ? 'hospitalProfiles' : 'engineerProfiles';
        await setDoc(doc(firestore, profileCol, newUser.uid), {
          userId: newUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(role === 'engineer' ? { fullName: email.split('@')[0], rating: 5, totalJobs: 0, specialization: 'General' } : { hospitalName: email.split('@')[0] })
        });

        toast({ title: "تم إنشاء الحساب", description: `مرحباً بك كـ ${role === 'hospital' ? 'مستشفى' : 'مهندس'}!` });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "تم تسجيل الدخول", description: "مرحباً بعودتك!" });
      }
    } catch (err: any) {
      let message = "حدث خطأ أثناء محاولة الدخول.";
      if (err.code === 'auth/invalid-credential') message = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      else if (err.code === 'auth/email-already-in-use') message = "هذا البريد الإلكتروني مسجل مسبقاً.";
      
      toast({ variant: "destructive", title: "فشل العملية", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="bg-primary mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-primary-foreground mb-4">
            <Wrench className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-black font-headline">مرحباً بك</CardTitle>
          <CardDescription>اختر نوع الحساب وقم بتسجيل الدخول للبدء</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hospital" className="w-full" onValueChange={(v) => setActiveRole(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="hospital" className="gap-2">
                <Hospital className="h-4 w-4" /> مستشفى
              </TabsTrigger>
              <TabsTrigger value="engineer" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> مهندس
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={() => handleAuth('login', activeRole)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
                </Button>
                <Button variant="outline" onClick={() => handleAuth('signup', activeRole)} disabled={isLoading}>
                  تسجيل جديد
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground justify-center">
          بالدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية.
        </CardFooter>
      </Card>
    </div>
  );
}
