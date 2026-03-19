
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyRequestsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'maintenanceRequests'), 
      where('hospitalId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">مفتوح للمزايدة</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">قيد التنفيذ</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">مكتمل</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Shell role="hospital">
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline">طلبات الصيانة الخاصة بي</h1>
            <p className="text-muted-foreground">تابع تقدم طلبات الصيانة والعروض المقدمة من المهندسين.</p>
          </div>
          <Link href="/requests/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> طلب جديد
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {requests?.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className="hover:shadow-md transition-all border-none shadow-sm group">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4">
                        <div className="bg-primary/5 p-3 rounded-2xl">
                          <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{req.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {req.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'اليوم'}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className={cn(
                                "h-3 w-3",
                                req.urgency === 'critical' ? "text-destructive" : "text-yellow-500"
                              )} /> 
                              {req.urgency === 'critical' ? 'حرج' : 'عادي'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                        {getStatusBadge(req.status)}
                        <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:translate-x-[-4px] transition-transform rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {requests?.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                <ClipboardList className="h-16 w-16 text-muted/20 mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">لا توجد طلبات صيانة حالياً.</p>
                <Link href="/requests/new">
                  <Button variant="link" className="mt-2">ابدأ بإنشاء طلبك الأول الآن</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
