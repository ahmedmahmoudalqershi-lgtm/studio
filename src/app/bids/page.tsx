"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  Clock, 
  DollarSign, 
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyBidsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // جلب المهام المسندة
  const activeJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('assignedEngineerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: activeJobs, isLoading: jobsLoading } = useCollection(activeJobsQuery);

  return (
    <Shell>
      <div className="space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">مهامي وعروضي</h1>
            <p className="text-muted-foreground">تتبع حالة المشاريع التي تعمل عليها والعروض المقدمة.</p>
          </div>
          <Link href="/explore">
            <Button className="gap-2">
              <Search className="h-4 w-4" /> استكشاف طلبات جديدة
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> المهام النشطة (قيد العمل)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {activeJobs?.filter(j => j.status === 'assigned').map(job => (
                  <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold">{job.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> تم الإسناد</span>
                        <Badge variant="secondary" className="text-[10px]">قيد التنفيذ</Badge>
                      </div>
                    </div>
                    <Link href={`/requests/${job.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" /> عرض التفاصيل
                      </Button>
                    </Link>
                  </div>
                ))}
                {(!activeJobs || activeJobs.filter(j => j.status === 'assigned').length === 0) && !jobsLoading && (
                  <div className="py-12 text-center text-muted-foreground">لا توجد مهام نشطة حالياً.</div>
                )}
                {jobsLoading && <div className="p-4"><Skeleton className="h-12 w-full" /></div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" /> المهام المكتملة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {activeJobs?.filter(j => j.status === 'completed').map(job => (
                  <div key={job.id} className="p-4 flex items-center justify-between opacity-80">
                    <div className="space-y-1">
                      <p className="font-bold line-through">{job.title}</p>
                      <p className="text-xs text-muted-foreground">تم الانتهاء بنجاح</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">مكتمل</Badge>
                  </div>
                ))}
                {(!activeJobs || activeJobs.filter(j => j.status === 'completed').length === 0) && !jobsLoading && (
                  <div className="py-12 text-center text-muted-foreground">لا توجد مهام مكتملة بعد.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

import { CheckCircle2 } from 'lucide-react';
