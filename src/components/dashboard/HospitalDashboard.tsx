
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export function HospitalDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'devices'), where('hospitalId', '==', user.uid));
  }, [firestore, user]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('hospitalId', '==', user.uid));
  }, [firestore, user]);

  const { data: devices, isLoading: devicesLoading } = useCollection(devicesQuery);
  const { data: requests, isLoading: requestsLoading } = useCollection(requestsQuery);

  const needsMaintenance = devices?.filter(d => d.status === 'needs_maintenance').length || 0;
  const activeRequests = requests?.filter(r => r.status === 'open' || r.status === 'in_progress').length || 0;

  if (devicesLoading || requestsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مستشفى {user?.email?.split('@')[0]}</h2>
          <p className="text-muted-foreground">نظرة عامة على حالة أجهزتك الطبية وطلبات الصيانة.</p>
        </div>
        <Link href="/requests/new">
          <Button className="w-full sm:w-auto shadow-lg shadow-primary/20">
            <Plus className="ml-2 h-4 w-4" /> طلب صيانة جديد
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-80">إجمالي الأجهزة</p>
              <Activity className="h-4 w-4 opacity-80" />
            </div>
            <div className="mt-2 text-3xl font-bold">{devices?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">بحاجة لصيانة</p>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 text-3xl font-bold">{needsMaintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">طلبات نشطة</p>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{activeRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">مكتملة مؤخراً</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 text-3xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>الأجهزة التي تتطلب انتباهك</CardTitle>
            <Link href="/devices" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices?.filter(d => d.status !== 'operational').map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">{device.model} - {device.manufacturer}</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">بحاجة لصيانة</Badge>
                </div>
              ))}
              {(!devices || devices.filter(d => d.status !== 'operational').length === 0) && (
                <p className="text-center py-4 text-muted-foreground italic text-sm">جميع الأجهزة تعمل بكفاءة.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أحدث طلبات الصيانة</CardTitle>
            <Link href="/requests" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests?.slice(0, 5).map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">الحالة: {req.status === 'open' ? 'مفتوح' : 'قيد التنفيذ'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{req.urgency === 'critical' ? 'حرج' : 'عادي'}</Badge>
                </div>
              ))}
              {(!requests || requests.length === 0) && (
                <p className="text-center py-4 text-muted-foreground italic text-sm">لا توجد طلبات نشطة حالياً.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
