"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ClipboardList, 
  User, 
  Search,
  Bell,
  Menu,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShellProps {
  children: React.ReactNode;
  role: 'hospital' | 'engineer';
}

export function Shell({ children, role }: ShellProps) {
  const pathname = usePathname();

  const navItems = role === 'hospital' ? [
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground">
              <Wrench className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold font-headline hidden sm:block">
              مساعد صيانة الأجهزة
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-secondary rounded-full border-2 border-background"></span>
            </Button>
            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage src={`https://picsum.photos/seed/${role}/100/100`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="container px-4 sm:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
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

      {/* Desktop Sidebar (Implicitly shown via hidden md:block in some designs, 
          but here we use the top bar + larger main content for a clean look) */}
    </div>
  );
}
