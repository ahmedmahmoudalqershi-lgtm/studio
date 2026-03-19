
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const APP_ICON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232862B4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/%3E%3Ccircle cx='12' cy='12' r='10' stroke-opacity='0.1'/%3E%3C/svg%3E`;

/**
 * مكون مسؤول عن مراقبة الإشعارات في Firestore وإرسال تنبيهات حقيقية للمتصفح.
 * يستخدم الأيقونة الطبية المخصصة للتنبيهات.
 */
export function NotificationManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const lastNotifiedId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user || !firestore) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        isFirstLoad.current = false;
        return;
      }

      if (isFirstLoad.current) {
        const newestDoc = snapshot.docs[0];
        lastNotifiedId.current = newestDoc.id;
        isFirstLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const docId = change.doc.id;

          if (docId !== lastNotifiedId.current) {
            lastNotifiedId.current = docId;

            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification('صيانة بلس الطبية', {
                  body: data.message,
                  icon: APP_ICON_SVG,
                });
              } catch (e) {
                console.warn("Notification API failed.");
              }
            }

            toast({
              title: "تنبيه جديد من صيانة بلس",
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
