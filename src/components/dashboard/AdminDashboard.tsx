
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Stethoscope, 
  ClipboardList, 
  TrendingUp, 
  ShieldCheck, 
  Hospital, 
  User as UserIcon,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export function AdminDashboard() {
  const firestore = useFirestore();

  // Memoizing all collection references to prevent the "not properly memoized" error
  const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const requestsRef = useMemoFirebase(() => firestore ? collection(firestore, 'maintenanceRequests') : null, [firestore]);
  const devicesRef = useMemoFirebase(() => firestore ? collection(firestore, 'devices') : null, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersRef);
  const { data: requests, isLoading: requestsLoading } = useCollection(requestsRef);
  const { data: devices, isLoading: devicesLoading } = useCollection(devicesRef);

  if (usersLoading || requestsLoading || devicesLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'إجمالي المستخدمين', value: users?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'طلبات الصيانة', value: requests?.length || 0, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'الأجهزة المسجلة', value: devices?.length || 0, icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'العمليات النشطة', value: requests?.filter(r => r.status === 'assigned').length || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-black font-headline text-primary">لوحة الإدارة المركزية</h1>
        <p className="text-muted-foreground">نظرة عامة على نشاط المنصة والمستخدمين.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-2xl`}>
                   <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-sm font-bold text-muted-foreground">{stat.title}</p>
              </div>
              <p className="text-4xl font-black">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-6 text-right">
            <CardTitle className="text-xl font-bold flex items-center gap-2 justify-end">
              <span>أحدث المستخدمين</span>
              <Users className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-right">
              {users?.slice(0, 5).map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <Badge variant="outline" className="capitalize">
                    {u.role === 'hospital' ? <><Hospital className="h-3 w-3 ml-1 inline" /> مستشفى</> : u.role === 'engineer' ? <><ShieldCheck className="h-3 w-3 ml-1 inline" /> مهندس</> : 'مدير'}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-sm">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground">تاريخ الانضمام: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : 'غير معروف'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-xl">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-6 text-right">
            <CardTitle className="text-xl font-bold flex items-center gap-2 justify-end">
              <span>نشاط الطلبات الأخير</span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-right">
              {requests?.slice(0, 5).map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === 'open' ? 'secondary' : 'default'} className="text-[10px]">
                      {req.status === 'open' ? 'مفتوح' : req.status === 'assigned' ? 'مسند' : 'مكتمل'}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{req.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{req.description}</p>
                  </div>
                </div>
              ))}
              {(!requests || requests.length === 0) && (
                <div className="p-8 text-center text-muted-foreground italic">لا توجد طلبات مسجلة بعد.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
