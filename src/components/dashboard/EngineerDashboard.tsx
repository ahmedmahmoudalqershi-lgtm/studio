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
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';

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
    // Simplified query for mobile/initial access without complex indexes
    return query(collection(firestore, 'maintenanceRequests'), where('status', '==', 'open'), limit(5));
  }, [firestore, user?.uid]);

  const { data: openRequests, isLoading: requestsLoading } = useCollection(openRequestsQuery);

  if (profileLoading || jobsLoading || requestsLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
           <Skeleton className="h-64 w-full rounded-3xl" />
           <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-right">
          <h2 className="text-3xl font-black font-headline tracking-tight">مرحباً، م. {profile?.fullName || user?.email?.split('@')[0]}</h2>
          <p className="text-muted-foreground">أنت تساهم في الحفاظ على استمرارية الرعاية الطبية.</p>
        </div>
        <Link href="/explore">
          <Button className="w-full sm:w-auto gap-2 h-12 px-6 rounded-xl shadow-xl shadow-primary/20">
            <Search className="h-5 w-5" /> استكشاف طلبات جديدة
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-2 rounded-xl">
                 <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">التقييم العام</p>
            </div>
            <p className="text-4xl font-black">{profile?.rating || '5.0'}</p>
            <p className="text-xs text-muted-foreground mt-2">بناءً على التقييمات الأخيرة</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-2 rounded-xl">
                 <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">مهام منجزة</p>
            </div>
            <p className="text-4xl font-black">{profile?.totalJobs || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">إجمالي عمليات الإصلاح الناجحة</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-2 rounded-xl">
                 <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">مهام نشطة</p>
            </div>
            <p className="text-4xl font-black">{activeJobs?.filter(j => j.status === 'assigned').length || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">قيد التنفيذ حالياً</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-primary text-primary-foreground group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                 <Award className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-bold opacity-80">الخبرة المهنية</p>
            </div>
            <p className="text-4xl font-black">{profile?.yearsExperience || 0} سنة</p>
            <p className="text-xs opacity-70 mt-2">تخصص: {profile?.specialization}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-6">
             <div className="flex items-center justify-between">
                <Link href="/explore">
                   <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">عرض الكل</Button>
                </Link>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                   <span>أحدث الفرص المتاحة</span>
                   <TrendingUp className="h-5 w-5 text-primary" />
                </CardTitle>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {openRequests?.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <div className="p-5 border-2 border-transparent hover:border-primary/20 bg-muted/20 hover:bg-white rounded-2xl transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={req.urgency === 'critical' ? 'destructive' : 'outline'} className="text-[10px] rounded-lg">
                       {req.urgency === 'critical' ? 'حرج' : 'عادي'}
                    </Badge>
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{req.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed text-right mb-4">{req.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-end">
                     <span>الرياض، مستشفى التخصصي</span>
                     <MapPin className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
            {(!openRequests || openRequests.length === 0) && (
               <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">لا توجد طلبات جديدة حالياً.</p>
               </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-primary/5 border-b p-6 text-right">
             <CardTitle className="text-xl font-bold flex items-center gap-2 justify-end text-primary">
                <span>المهام التي تعمل عليها</span>
                <Briefcase className="h-5 w-5" />
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {activeJobs?.filter(j => j.status === 'assigned').map(job => (
              <Link key={job.id} href={`/requests/${job.id}`}>
                <div className="p-5 border border-primary/20 bg-primary/5 hover:bg-white rounded-2xl flex items-center justify-between transition-all group shadow-sm">
                  <ArrowRight className="h-5 w-5 text-primary rotate-180 group-hover:-translate-x-1 transition-transform" />
                  <div className="text-right">
                    <p className="font-black text-lg text-primary">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1 justify-end">
                       <span className="text-xs text-muted-foreground flex items-center gap-1">قيد العمل <Clock className="h-3 w-3" /></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {(!activeJobs || activeJobs.filter(j => j.status === 'assigned').length === 0) && (
               <div className="text-center py-16 text-muted-foreground italic">
                  <p className="text-sm">لا توجد مهام نشطة قيد العمل حالياً.</p>
                  <Link href="/explore">
                     <Button variant="link" className="mt-2">استكشف الطلبات للبدء</Button>
                  </Link>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
