
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

  // جلب بيانات الدور
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);

  const userRole = userData?.role || 'hospital';
  
  // جلب الملف الشخصي للصور والأسماء الحقيقية
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const collectionName = userRole === 'hospital' ? 'hospitalProfiles' : 'engineerProfiles';
    return doc(firestore, collectionName, user.uid);
  }, [firestore, user?.uid, userRole]);
  const { data: profile } = useDoc(profileRef);

  // الإشعارات
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

  const navItems = userRole === 'hospital' ? [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'أجهزتي', icon: Stethoscope, href: '/devices' },
    { name: 'طلباتي', icon: ClipboardList, href: '/requests' },
    { name: 'الملف الشخصي', icon: User, href: '/profile' },
  ] : [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'استكشاف', icon: Search, href: '/explore' },
    { name: 'عروضي', icon: ClipboardList, href: '/bids' },
    { name: 'الملف الشخصي', icon: User, href: '/profile' },
  ];

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Wrench className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const currentProfileImage = profile?.profileImageUrl || `https://picsum.photos/seed/${user?.uid}/100/100`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-xl text-primary-foreground group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Wrench className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-black font-headline hidden sm:block tracking-tight">صيانة بلس</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-full transition-colors">
                  <Bell className="h-5 w-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-2xl" dir="rtl">
                <DropdownMenuLabel className="font-bold px-3 py-2 text-right">الإشعارات الأخيرة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-xl hover:bg-muted transition-colors text-right">
                      <p className="text-sm font-medium w-full">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {notif.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA')}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">لا توجد إشعارات حالياً.</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-primary/10 hover:ring-primary/40 transition-all overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage 
                      src={currentProfileImage} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-primary font-bold">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl" dir="rtl">
                <DropdownMenuLabel className="px-3 py-3 text-right">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black leading-none">{profile?.fullName || profile?.hospitalName || user?.email}</p>
                    <p className="text-[10px] leading-none text-muted-foreground capitalize mt-1">
                      {userRole === 'hospital' ? 'مستشفى مسجل' : 'مهندس صيانة معتمد'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors justify-end">
                    <span>الملف الشخصي</span>
                    <User className="h-4 w-4" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer flex items-center gap-2 p-3 rounded-xl hover:bg-destructive/10 transition-colors justify-end">
                  <span>تسجيل الخروج</span>
                  <LogOut className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-12">
        <div className="container px-6 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 border bg-white/90 backdrop-blur-xl md:hidden rounded-2xl shadow-2xl border-white/20">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
                  isActive ? "text-primary font-bold scale-110" : "text-muted-foreground/60"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
