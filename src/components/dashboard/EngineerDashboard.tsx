"use client";

import React from 'react';
import { MOCK_ENGINEER, MOCK_REQUESTS, MOCK_BIDS } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Briefcase, 
  Search, 
  DollarSign, 
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export function EngineerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أهلاً بك، {MOCK_ENGINEER.full_name}</h2>
          <p className="text-muted-foreground">تصفح الطلبات المتاحة وتابع عروضك النشطة.</p>
        </div>
        <Link href="/explore">
          <Button className="w-full sm:w-auto gap-2">
            <Search className="h-4 w-4" /> استكشاف الفرص
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">التقييم العام</p>
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="mt-2 text-3xl font-bold">{MOCK_ENGINEER.rating} / 5</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">المهام المكتملة</p>
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{MOCK_ENGINEER.total_jobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">عروض قيد الانتظار</p>
              <Clock className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{MOCK_BIDS.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-80">الأرباح المتوقعة</p>
              <DollarSign className="h-4 w-4 opacity-80" />
            </div>
            <div className="mt-2 text-3xl font-bold">4,200 ر.س</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>طلبات متاحة قريبة منك</CardTitle>
            <Link href="/explore" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_REQUESTS.map(req => (
                <div key={req.id} className="p-4 rounded-xl border hover:border-primary transition-colors bg-white group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold group-hover:text-primary transition-colors">{req.title}</h4>
                    <Badge variant={req.urgency === 'high' ? 'destructive' : 'secondary'}>
                      {req.urgency === 'high' ? 'عاجل' : 'عادي'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {req.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> الرياض، العليا
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-primary">تقديم عرض</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>حالة عروضك</CardTitle>
            <Link href="/bids" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_BIDS.map(bid => (
                <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">عرض طلب: #{bid.request_id}</p>
                    <p className="text-xs text-muted-foreground">السعر: {bid.price} ر.س</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">
                    قيد الدراسة
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
