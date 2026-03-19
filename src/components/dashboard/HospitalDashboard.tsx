"use client";

import React from 'react';
import { MOCK_HOSPITAL, MOCK_DEVICES, MOCK_REQUESTS } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export function HospitalDashboard() {
  const needsMaintenance = MOCK_DEVICES.filter(d => d.status === 'needs_maintenance').length;
  const activeRequests = MOCK_REQUESTS.filter(r => r.status === 'open' || r.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أهلاً بك، {MOCK_HOSPITAL.hospital_name}</h2>
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
            <div className="mt-2 text-3xl font-bold">{MOCK_DEVICES.length}</div>
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
            <div className="mt-2 text-3xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>الأجهزة المعطلة</CardTitle>
            <Link href="/devices" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DEVICES.filter(d => d.status !== 'operational').map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">{device.model} - {device.manufacturer}</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">بحاجة لصيانة</Badge>
                </div>
              ))}
              {MOCK_DEVICES.filter(d => d.status !== 'operational').length === 0 && (
                <p className="text-center py-4 text-muted-foreground italic">جميع الأجهزة تعمل بكفاءة.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أحدث الطلبات</CardTitle>
            <Link href="/requests" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_REQUESTS.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">التاريخ: {new Date(req.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">مفتوح</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
