
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Wrench, Hospital, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  async function handleAuth(type: 'login' | 'signup', role: 'hospital' | 'engineer') {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "بريد إلكتروني غير صالح",
        description: "يرجى إدخال بريد إلكتروني بصيغة صحيحة.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'signup') {
        initiateEmailSignUp(auth, email.trim(), password);
        toast({
          title: "جاري إنشاء الحساب",
          description: "يتم الآن إعداد حسابك الجديد...",
        });
      } else {
        initiateEmailSignIn(auth, email.trim(), password);
        toast({
          title: "جاري تسجيل الدخول",
          description: "مرحباً بعودتك!",
        });
      }
      
      // Artificial delay to wait for auth state or simulate redirect
      setTimeout(() => {
        router.push(`/dashboard?role=${role}`);
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "خطأ في المصادقة",
        description: "حدث خطأ أثناء محاولة الدخول. يرجى التأكد من البيانات والمحاولة لاحقاً.",
      });
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
          <Tabs defaultValue="hospital" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="hospital" className="gap-2">
                <Hospital className="h-4 w-4" /> مستشفى
              </TabsTrigger>
              <TabsTrigger value="engineer" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> مهندس
              </TabsTrigger>
            </TabsList>
            
            {['hospital', 'engineer'].map((role) => (
              <TabsContent key={role} value={role}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-email`}>البريد الإلكتروني</Label>
                    <Input 
                      id={`${role}-email`}
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-password`}>كلمة المرور</Label>
                    <Input 
                      id={`${role}-password`}
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      onClick={() => handleAuth('login', role as any)} 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleAuth('signup', role as any)}
                      disabled={isLoading}
                    >
                      تسجيل جديد
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground justify-center">
          بالدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية.
        </CardFooter>
      </Card>
    </div>
  );
}
