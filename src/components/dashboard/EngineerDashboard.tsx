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
  Wrench,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export function EngineerDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const profileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'engineerProfiles'), where('userId', '==', user.uid), limit(1));
  }, [firestore, user?.uid]);

  const { data: profiles, isLoading: profileLoading } = useCollection(profileQuery);
  const profile = profiles?.[0];

  const activeJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('assignedEngineerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: activeJobs, isLoading: jobsLoading } = useCollection(activeJobsQuery);

  const openRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('status', '==', 'open'), limit(5));
  }, [firestore, user?.uid]);

  const { data: openRequests, isLoading: requestsLoading } = useCollection(openRequestsQuery);

  if (profileLoading || jobsLoading || requestsLoading) {
    return <div className="space-y-6"><Skeleton className="h-12 w-64" /><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مرحباً، {profile?.fullName || user?.email?.split('@')[0]}</h2>
          <p className="text-muted-foreground">أنت الآن في لوحة التحكم الخاصة بالمهندسين.</p>
        </div>
        <Link href="/explore">
          <Button className="w-full sm:w-auto gap-2">
            <Search className="h-4 w-4" /> استكشاف الفرص
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">التقييم</p>
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-3xl font-black">{profile?.rating || '5.0'}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">مهام منجزة</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-black">{profile?.totalJobs || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">مهام نشطة</p>
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-black">{activeJobs?.filter(j => j.status === 'assigned').length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-80">الخبرة</p>
              <Briefcase className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-3xl font-black">{profile?.yearsExperience || 0} سنة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader><CardTitle className="text-lg">طلبات جديدة للمزايدة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {openRequests?.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <div className="p-4 border rounded-xl hover:border-primary transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold group-hover:text-primary">{req.title}</h4>
                    <Badge variant="outline" className="text-[10px]">{req.urgency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                </div>
              </Link>
            ))}
            {(!openRequests || openRequests.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">لا توجد طلبات جديدة حالياً.</p>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader><CardTitle className="text-lg">المهام الحالية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeJobs?.filter(j => j.status === 'assigned').map(job => (
              <Link key={job.id} href={`/requests/${job.id}`}>
                <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold">{job.title}</p>
                    <p className="text-xs text-muted-foreground">الحالة: قيد العمل</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary rotate-180" />
                </div>
              </Link>
            ))}
            {(!activeJobs || activeJobs.filter(j => j.status === 'assigned').length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام نشطة حالياً.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
