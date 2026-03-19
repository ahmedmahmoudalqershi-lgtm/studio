
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * مكون مسؤول عن مراقبة الإشعارات في Firestore وإرسال تنبيهات حقيقية للمتصفح.
 */
export function NotificationManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const lastNotifiedId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user || !firestore) return;

    // طلب إذن التنبيهات من المتصفح عند التحميل
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // استعلام لمراقبة أحدث الإشعارات غير المقروءة
    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        isFirstLoad.current = false;
        return;
      }

      const newestDoc = snapshot.docs[0];
      const data = newestDoc.data();

      // تجنب التنبيه عند التحميل الأول (للإشعارات القديمة) أو تكرار نفس التنبيه
      if (!isFirstLoad.current && newestDoc.id !== lastNotifiedId.current) {
        lastNotifiedId.current = newestDoc.id;
        
        // 1. إظهار إشعار المتصفح (Native Push)
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification('صيانة بلس: تنبيه جديد', {
            body: data.message,
            icon: '/favicon.ico', // يمكنك استبداله بأيقونة التطبيق
          });
        }

        // 2. إظهار إشعار داخلي (Toast)
        toast({
          title: "تنبيه جديد",
          description: data.message,
        });
      }
      
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  return null; // مكون وظيفي فقط لا يظهر في الواجهة
}
