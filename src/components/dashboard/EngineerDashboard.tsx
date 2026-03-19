
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  Briefcase, 
  Search, 
  DollarSign, 
  ArrowRight,
  MapPin,
  Clock,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export function EngineerDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  // جلب الملف الشخصي للمهندس
  const profileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'engineerProfiles'), where('userId', '==', user.uid), limit(1));
  }, [firestore, user]);

  const { data: profiles, isLoading: profileLoading } = useCollection(profileQuery);
  const profile = profiles?.[0];

  // جلب المهام المسندة للمهندس
  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('assignedEngineerId', '==', user.uid));
  }, [firestore, user]);

  const { data: activeJobs, isLoading: jobsLoading } = useCollection(bidsQuery);

  // جلب أحدث الطلبات العامة المتاحة (يجب التأكد من وجود مستخدم قبل الاستعلام)
  const openRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('status', '==', 'open'), limit(5));
  }, [firestore, user]);

  const { data: openRequests, isLoading: requestsLoading } = useCollection(openRequestsQuery);

  if (profileLoading || jobsLoading || requestsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
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
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أهلاً بك، {profile?.fullName || user?.email?.split('@')[0]}</h2>
          <p className="text-muted-foreground">تصفح الطلبات المتاحة وتابع مهامك النشطة.</p>
        </div>
        <Link href="/explore">
          <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
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
            <div className="mt-2 text-3xl font-bold">{profile?.rating || 0} / 5</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">المهام المكتملة</p>
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{profile?.totalJobs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">مهام نشطة</p>
              <Wrench className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{activeJobs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-80">سنوات الخبرة</p>
              <Clock className="h-4 w-4 opacity-80" />
            </div>
            <div className="mt-2 text-3xl font-bold">{profile?.yearsExperience || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">طلبات جديدة متاحة</CardTitle>
            <Link href="/explore" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {openRequests?.map(req => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <div className="p-4 rounded-xl border hover:border-primary transition-all bg-white group mb-3 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold group-hover:text-primary transition-colors">{req.title}</h4>
                      <Badge variant={req.urgency === 'critical' ? 'destructive' : 'secondary'}>
                        {req.urgency === 'critical' ? 'حرج' : req.urgency === 'high' ? 'عاجل' : 'عادي'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {req.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> متاح للمعاينة
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-primary hover:bg-primary/5">عرض التفاصيل</Button>
                    </div>
                  </div>
                </Link>
              ))}
              {(!openRequests || openRequests.length === 0) && (
                <p className="text-center py-10 text-muted-foreground italic text-sm">لا توجد طلبات جديدة حالياً.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">مهامك الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs?.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div>
                    <p className="font-bold">{job.title}</p>
                    <p className="text-xs text-muted-foreground">الحالة: {job.status === 'in_progress' ? 'قيد التنفيذ' : job.status}</p>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    نشط
                  </Badge>
                </div>
              ))}
              {(!activeJobs || activeJobs.length === 0) && (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد مهام مسندة إليك حالياً.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
