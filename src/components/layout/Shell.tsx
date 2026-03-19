
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ClipboardList, 
  User, 
  Search,
  Bell,
  Wrench,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  // جلب بيانات المستخدم لمعرفة الدور (Role)
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: notifications } = useCollection(notificationsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const userRole = userData?.role || 'hospital';

  const navItems = userRole === 'hospital' ? [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'أجهزتي', icon: Stethoscope, href: '/devices' },
    { name: 'طلباتي', icon: ClipboardList, href: '/requests' },
    { name: 'الملف الشخصي', icon: User, href: '/profile' },
  ] : [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'استكشاف الطلبات', icon: Search, href: '/explore' },
    { name: 'عروضي', icon: ClipboardList, href: '/bids' },
    { name: 'الملف الشخصي', icon: User, href: '/profile' },
  ];

  if (isUserLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Wrench className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-muted-foreground font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-primary-foreground">
                <Wrench className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold font-headline hidden sm:block">مساعد صيانة الأجهزة</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" dir="rtl">
                <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                      <p className="text-sm font-medium">{notif.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {notif.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA')}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات حالياً.</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="container px-4 sm:px-8 py-6">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-md md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 text-xs transition-colors",
                  isActive ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
