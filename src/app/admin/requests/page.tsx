
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ClipboardList, 
  Clock, 
  AlertTriangle, 
  ArrowLeft,
  Filter,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRequestsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const requestsRef = useMemoFirebase(() => firestore ? collection(firestore, 'maintenanceRequests') : null, [firestore]);
  const { data: requests, isLoading } = useCollection(requestsRef);

  const filteredRequests = requests?.filter(req => 
    req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">مفتوح</Badge>;
      case 'assigned': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">مسند</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700 border-green-200">مكتمل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Shell>
      <div className="space-y-6" dir="rtl">
        <div className="text-right">
          <h1 className="text-3xl font-black font-headline text-primary">مراقبة الطلبات</h1>
          <p className="text-muted-foreground">متابعة كافة طلبات الصيانة النشطة والمكتملة في النظام.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث بالعنوان أو الحالة..." 
              className="pr-10 h-12 rounded-xl text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 gap-2 rounded-xl">
            <Filter className="h-4 w-4" /> تصفية متقدمة
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)
          ) : (
            filteredRequests?.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className="hover:shadow-lg transition-all border-none shadow-md overflow-hidden group">
                  <div className={`h-1 w-full ${req.status === 'open' ? 'bg-blue-500' : req.status === 'assigned' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 text-right">
                        <div className="bg-muted p-3 rounded-2xl">
                          <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{req.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground justify-end sm:justify-start">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className={`h-3 w-3 ${req.urgency === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                              {req.urgency}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : '---'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right sm:text-left">
                          <p className="text-[10px] text-muted-foreground mb-1">حالة الطلب</p>
                          {getStatusBadge(req.status)}
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:-translate-x-1 transition-transform rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
          {filteredRequests?.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
              <Wrench className="h-16 w-16 text-muted/10 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات لعرضها حالياً.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
