
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  Clock, 
  DollarSign, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyBidsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // في نظام Firestore الحقيقي، سنستخدم collectionGroup للبحث عن العروض عبر جميع الطلبات
  // للتبسيط في الـ MVP، سنفترض وجود استعلام مخصص أو جلب الطلبات المسندة
  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // ملاحظة: هذا الاستعلام تجريبي للـ MVP
    return query(
      collection(firestore, 'maintenanceRequests'), 
      where('assignedEngineerId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: bids, isLoading } = useCollection(bidsQuery);

  return (
    <Shell role="engineer">
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold font-headline">عروضي ومهامي</h1>
          <p className="text-muted-foreground">تابع حالة العروض التي قدمتها والمهام المسندة إليك.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> المهام النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bids?.filter(b => b.status !== 'completed').map(bid => (
                    <div key={bid.id} className="p-4 rounded-xl border bg-muted/10 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{bid.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> تم الإسناد مؤخراً
                        </p>
                      </div>
                      <Link href={`/requests/${bid.id}`}>
                        <Button size="sm" variant="outline">عرض المهمة</Button>
                      </Link>
                    </div>
                  ))}
                  {(!bids || bids.filter(b => b.status !== 'completed').length === 0) && (
                    <p className="text-center py-8 text-muted-foreground italic text-sm">لا توجد مهام نشطة حالياً.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-center">
              <Gavel className="h-12 w-12 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">استكشف المزيد من الفرص</h3>
              <p className="text-muted-foreground mb-6">هناك العديد من المستشفيات التي تبحث عن خبراتك الآن.</p>
              <Link href="/explore">
                <Button size="lg" className="rounded-2xl px-8 shadow-xl">الذهاب للمركز التجاري</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
