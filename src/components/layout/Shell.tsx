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
  LogOut,
  ChevronLeft
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Wrench className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-muted-foreground font-medium">جاري تهيئة المنصة...</p>
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
              <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                <Wrench className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-black font-headline hidden sm:block">مساعد الصيانة الطبي</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-full">
                  <Bell className="h-5 w-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" dir="rtl">
                <DropdownMenuLabel className="font-bold">الإشعارات الأخيرة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-muted/50 border-b last:border-0">
                      <p className="text-sm font-medium leading-snug">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LayoutDashboard className="h-3 w-3" /> {notif.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA')}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 opacity-20" />
                    لا توجد إشعارات جديدة حالياً.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" dir="rtl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{userData?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userRole === 'hospital' ? 'مستشفى مسجل' : 'مهندس معتمد'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" /> الملف الشخصي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="container px-4 sm:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 text-[10px] transition-all",
                  isActive ? "text-primary font-bold scale-110" : "text-muted-foreground opacity-60"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (Optional, here we use top nav mostly but keeping consistency) */}
    </div>
  );
}
