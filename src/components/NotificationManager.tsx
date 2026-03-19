
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * مكون مسؤول عن مراقبة الإشعارات في Firestore وإرسال تنبيهات حقيقية للمتصفح.
 * تم تعديل الاستعلام ليتجنب الحاجة لفهارس مركبة (Composite Indexes).
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

    // استعلام لمراقبة الإشعارات غير المقروءة فقط (بدون orderBy لتجنب خطأ الفهرس)
    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false),
      limit(10) // جلب آخر مجموعة للتأكد من التقاط الجديد
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        isFirstLoad.current = false;
        return;
      }

      // في حالة التحميل الأول، فقط نسجل المعرفات الموجودة ولا ننبه المستخدم
      if (isFirstLoad.current) {
        const newestDoc = snapshot.docs[0];
        lastNotifiedId.current = newestDoc.id;
        isFirstLoad.current = false;
        return;
      }

      // البحث عن أي إشعار جديد لم يتم التنبيه عنه من قبل
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const docId = change.doc.id;

          if (docId !== lastNotifiedId.current) {
            lastNotifiedId.current = docId;

            // 1. إظهار إشعار المتصفح (Native Push)
            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification('صيانة بلس: تنبيه جديد', {
                  body: data.message,
                  icon: '/favicon.ico',
                });
              } catch (e) {
                console.warn("Notification API not supported or failed.");
              }
            }

            // 2. إظهار إشعار داخلي (Toast)
            toast({
              title: "تنبيه جديد",
              description: data.message,
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  return null;
}
