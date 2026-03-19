
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Wrench, Hospital, ShieldCheck, Loader2 } from 'lucide-react';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const db = getFirestore();
  const router = useRouter();

  async function handleAuth(type: 'login' | 'signup', role: 'hospital' | 'engineer') {
    setIsLoading(true);
    try {
      if (type === 'signup') {
        // Simple non-blocking sign up logic
        // In a real app, we'd wait for the auth state change in a root listener
        // But for this MVP, we'll proceed with simple setup
        initiateEmailSignUp(auth, email, password);
      } else {
        initiateEmailSignIn(auth, email, password);
      }
      
      // Artificial delay to wait for auth state
      setTimeout(() => {
        router.push(`/dashboard?role=${role}`);
      }, 2000);
    } catch (error) {
      console.error(error);
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
