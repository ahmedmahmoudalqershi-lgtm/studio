
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Clock, 
  Search, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyBidsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const activeJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('assignedEngineerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: activeJobs, isLoading: jobsLoading } = useCollection(activeJobsQuery);

  return (
    <Shell>
      <div className="space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
          <div className="flex-1">
            <h1 className="text-3xl font-black font-headline text-primary">مهامي وعروضي</h1>
            <p className="text-muted-foreground">تتبع حالة المشاريع التي تعمل عليها والمهام المسندة إليك.</p>
          </div>
          <Link href="/explore">
            <Button className="gap-2 rounded-xl shadow-lg">
              <Search className="h-4 w-4" /> استكشاف طلبات جديدة
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5 text-right">
              <CardTitle className="text-lg flex items-center gap-2 justify-end">
                <span>المهام النشطة (قيد التنفيذ)</span>
                <Briefcase className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-right">
                {activeJobs?.filter(j => j.status === 'assigned').map(job => (
                  <div key={job.id} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <Link href={`/requests/${job.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
                        <ExternalLink className="h-4 w-4" /> عرض التفاصيل
                      </Button>
                    </Link>
                    <div className="space-y-1">
                      <p className="font-black text-lg">{job.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground justify-end">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">قيد العمل</Badge>
                        <span className="flex items-center gap-1">تم الإسناد <Clock className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!activeJobs || activeJobs.filter(j => j.status === 'assigned').length === 0) && !jobsLoading && (
                  <div className="py-16 text-center text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p>لا توجد مهام نشطة حالياً. ابدأ بالتقديم على الطلبات المتاحة.</p>
                  </div>
                )}
                {jobsLoading && <div className="p-6"><Skeleton className="h-20 w-full rounded-2xl" /></div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-green-50 text-right">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 justify-end">
                <span>المهام المكتملة</span>
                <CheckCircle2 className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-right">
                {activeJobs?.filter(j => j.status === 'completed').map(job => (
                  <div key={job.id} className="p-6 flex items-center justify-between opacity-80">
                    <Badge className="bg-green-100 text-green-700">مكتمل</Badge>
                    <div className="space-y-1">
                      <p className="font-bold text-lg line-through text-muted-foreground">{job.title}</p>
                      <p className="text-xs text-green-600">تم الانتهاء من الصيانة بنجاح</p>
                    </div>
                  </div>
                ))}
                {(!activeJobs || activeJobs.filter(j => j.status === 'completed').length === 0) && !jobsLoading && (
                  <div className="py-12 text-center text-muted-foreground italic">لا توجد مهام مكتملة بعد.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
