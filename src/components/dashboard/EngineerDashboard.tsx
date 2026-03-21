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
  ArrowRight,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Award,
  MessageSquareQuote,
  Target
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
    return query(collection(firestore, 'maintenanceRequests'), where('status', '==', 'open'), limit(10));
  }, [firestore, user?.uid]);

  const { data: openRequests, isLoading: requestsLoading } = useCollection(openRequestsQuery);

  const matchedRequests = openRequests?.filter(req => {
    if (!profile?.specialization) return false;
    const spec = profile.specialization.toLowerCase();
    return req.title.toLowerCase().includes(spec) || req.description.toLowerCase().includes(spec);
  }) || [];

  if (profileLoading || jobsLoading || requestsLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
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
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2 fill-yellow-500" />
            <p className="text-sm font-bold text-muted-foreground">تقييمك الحالي</p>
            <p className="text-3xl font-black">{profile?.rating || '5.0'}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-muted-foreground">مهام منجزة</p>
            <p className="text-3xl font-black">{profile?.totalJobs || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-emerald-50 border-2 border-emerald-100">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-700">طلبات مطابقة</p>
            <p className="text-3xl font-black text-emerald-900">{matchedRequests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-muted-foreground">تخصصك</p>
            <p className="text-sm font-black truncate">{profile?.specialization || 'صيانة عامة'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-emerald-50 border-b p-6">
               <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500">نظام المطابقة الذكي</Badge>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                     <span>فرص تناسب مهاراتك</span>
                     <Target className="h-5 w-5 text-emerald-600" />
                  </CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {matchedRequests.length > 0 ? matchedRequests.map(req => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <div className="p-5 border-2 border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 rounded-2xl transition-all cursor-pointer group shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200">مطابقة عالية</Badge>
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{req.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 text-right">{req.description}</p>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-10 text-muted-foreground italic">
                   لا توجد طلبات تطابق تخصصك الدقيق حالياً.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="bg-primary/5 border-b p-6 text-right">
               <CardTitle className="text-xl font-bold flex items-center gap-2 justify-end text-primary">
                  <span>المهام النشطة</span>
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
                      <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">قيد العمل <Clock className="h-3 w-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
              {(!activeJobs || activeJobs.filter(j => j.status === 'assigned').length === 0) && (
                 <div className="text-center py-10 text-muted-foreground">لا توجد مهام نشطة حالياً.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
