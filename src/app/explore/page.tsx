
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Wrench, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();

  const requestsQuery = useMemoFirebase(() => {
    // ننتظر حتى يتوفر firestore والمستخدم المسجل قبل تنفيذ الاستعلام
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'maintenanceRequests'), 
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const filteredRequests = requests?.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell role="engineer">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4 text-right justify-end sm:justify-start">
          <h1 className="text-3xl font-bold font-headline">استكشاف طلبات الصيانة</h1>
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن أجهزة، أعطال، أو كلمات مفتاحية..." 
              className="pr-10 h-12 rounded-xl text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl border-2">
            <Filter className="h-4 w-4" /> تصفية
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests?.map(req => (
              <Card key={req.id} className="overflow-hidden hover:shadow-xl transition-all border-none shadow-md group">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="text-right">
                  <div className="flex justify-between items-start">
                    <Badge variant={req.urgency === 'critical' ? 'destructive' : 'outline'} className="rounded-md">
                      {req.urgency === 'critical' ? 'حرج فوري' : req.urgency === 'high' ? 'عاجل' : 'عادي'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 group-hover:text-primary transition-colors">{req.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {req.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t justify-end">
                    <span>الرياض، مستشفى الملك عبدالعزيز</span>
                    <MapPin className="h-3 w-3" />
                  </div>
                  <Link href={`/requests/${req.id}`}>
                    <Button className="w-full mt-2 rounded-xl">عرض التفاصيل والتقديم</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {filteredRequests?.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center space-y-4">
                <Wrench className="h-16 w-16 text-muted/20 mx-auto" />
                <p className="text-xl text-muted-foreground font-medium">لا توجد طلبات مطابقة لبحثك حالياً.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
