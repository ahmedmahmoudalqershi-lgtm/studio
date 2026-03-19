
'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { HospitalDashboard } from '@/components/dashboard/HospitalDashboard';
import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userRef);

  if (isUserLoading || isRoleLoading) {
    return (
      <Shell>
        <div className="space-y-6" dir="rtl">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
        </div>
      </Shell>
    );
  }

  const role = userData?.role || 'hospital';

  return (
    <Shell>
      {role === 'admin' ? (
        <AdminDashboard />
      ) : role === 'hospital' ? (
        <HospitalDashboard />
      ) : (
        <EngineerDashboard />
      )}
    </Shell>
  );
}
