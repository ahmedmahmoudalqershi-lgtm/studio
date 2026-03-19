
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
  Users,
  ShieldCheck,
  Settings,
  Check,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, doc, serverTimestamp } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  const { data: userData } = useDoc(userRef);

  const userRole = userData?.role || 'hospital';
  
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const collectionName = userRole === 'hospital' ? 'hospitalProfiles' : userRole === 'engineer' ? 'engineerProfiles' : null;
    return collectionName ? doc(firestore, collectionName, user.uid) : null;
  }, [firestore, user?.uid, userRole]);
  const { data: profile } = useDoc(profileRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
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

  const markAsRead = (notifId: string) => {
    if (!firestore || !user) return;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'notifications', notifId), {
      isRead: true
    });
  };

  const getNavItems = () => {
    switch(userRole) {
      case 'admin':
        return [
          { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
          { name: 'المستخدمين', icon: Users, href: '/admin/users' },
          { name: 'الطلبات', icon: ClipboardList, href: '/admin/requests' },
          { name: 'الملف الشخصي', icon: Settings, href: '/profile' },
        ];
      case 'hospital':
        return [
          { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
          { name: 'أجهزتي', icon: Stethoscope, href: '/devices' },
          { name: 'طلباتي', icon: ClipboardList, href: '/requests' },
          { name: 'الملف الشخصي', icon: User, href: '/profile' },
        ];
      default:
        return [
          { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
          { name: 'استكشاف', icon: Search, href: '/explore' },
          { name: 'عروضي', icon: Briefcase, href: '/bids' },
          { name: 'الملف الشخصي', icon: User, href: '/profile' },
        ];
    }
  };

  const navItems = getNavItems();
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

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
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
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
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-2xl" dir="rtl">
                <DropdownMenuLabel className="font-bold px-3 py-2 text-right flex justify-between items-center">
                  <span>الإشعارات الأخيرة</span>
                  {unreadCount > 0 && <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full">{unreadCount} جديد</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id} 
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer rounded-xl transition-colors text-right relative mb-1",
                          !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <p className={cn("text-xs leading-relaxed", !notif.isRead ? "font-bold text-foreground" : "text-muted-foreground")}>{notif.message}</p>
                          {!notif.isRead && <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1" />}
                        </div>
                        <span className="text-[9px] text-muted-foreground mr-auto mt-1">
                          {notif.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 opacity-10" />
                      لا توجد إشعارات حالياً.
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-primary/10 hover:ring-primary/40 transition-all overflow-hidden shadow-sm">
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
                    <p className="text-sm font-black leading-none">{profile?.fullName || profile?.hospitalName || (userRole === 'admin' ? 'مدير النظام' : user?.email)}</p>
                    <p className="text-[10px] leading-none text-muted-foreground capitalize mt-1">
                      {userRole === 'hospital' ? 'مستشفى مسجل' : userRole === 'engineer' ? 'مهندس معتمد' : 'إدارة عليا'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors justify-end group">
                    <span className="group-hover:text-primary">الملف الشخصي</span>
                    <User className="h-4 w-4 group-hover:text-primary" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer flex items-center gap-2 p-3 rounded-xl hover:bg-destructive/10 transition-colors justify-end group">
                  <span className="font-bold">تسجيل الخروج</span>
                  <LogOut className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-12">
        <div className="container px-6 py-8 mx-auto">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-6 left-6 right-6 z-50 border bg-white/90 backdrop-blur-xl md:hidden rounded-[2rem] shadow-2xl border-white/20">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 transition-all rounded-2xl h-12",
                  isActive ? "text-primary font-bold bg-primary/5" : "text-muted-foreground/60 hover:text-primary/60"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                <span className="text-[9px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

