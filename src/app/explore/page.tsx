"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Wrench, ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();

  const engineerProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'engineerProfiles', user.uid);
  }, [firestore, user?.uid]);
  const { data: engineerProfile } = useDoc(engineerProfileRef);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'maintenanceRequests'), 
      where('status', '==', 'open')
    );
  }, [firestore, user?.uid]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const filteredRequests = requests?.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMatch = (reqTitle: string) => {
    if (!engineerProfile?.specialization) return false;
    const spec = engineerProfile.specialization.toLowerCase();
    const title = reqTitle.toLowerCase();
    return title.includes(spec) || spec.includes(title.split(' ')[0]);
  };

  return (
    <Shell role="engineer">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4 text-right justify-end sm:justify-start">
          <h1 className="text-3xl font-black font-headline text-primary">استكشاف الفرص المتاحة</h1>
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
              placeholder="ابحث عن أجهزة، أعطال، أو تخصصات..." 
              className="pr-10 h-14 rounded-2xl text-right shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 px-8 gap-2 rounded-2xl border-2">
            <Filter className="h-4 w-4" /> تصفية النتائج
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests?.map(req => {
              const matched = isMatch(req.title);
              return (
                <Card key={req.id} className={`overflow-hidden hover:shadow-2xl transition-all border-none shadow-lg rounded-[2.5rem] bg-white group ${matched ? 'ring-2 ring-emerald-400' : ''}`}>
                  <div className={`h-3 w-full ${matched ? 'bg-emerald-500' : 'bg-primary/20'}`} />
                  <CardHeader className="text-right pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={req.urgency === 'critical' ? 'destructive' : 'outline'} className="rounded-full px-4 font-bold text-[10px]">
                        {req.urgency === 'critical' ? 'حرج فوري' : req.urgency === 'high' ? 'عاجل' : 'عادي'}
                      </Badge>
                      {matched && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none gap-1 px-3 py-1 text-[10px] font-black">
                          <Target className="h-3 w-3" /> يطابق خبرتك
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4 text-xl font-black group-hover:text-primary transition-colors">{req.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-right">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                      {req.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-4 border-t justify-end">
                      <span className="font-bold">مستشفى الملك فهد، الرياض</span>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <Link href={`/requests/${req.id}`}>
                      <Button className="w-full h-12 rounded-xl font-bold">عرض التفاصيل والتقديم</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
