'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, User as UserIcon, X, Hospital, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ChatSystemProps {
  requestId: string;
  engineerId: string;
  engineerName: string;
  hospitalId: string;
  hospitalName?: string;
  onClose?: () => void;
}

/**
 * نظام دردشة متطور (يشبه واتساب) مخصص للتفاوض بين المستشفى والمهندس.
 * يدعم المزامنة اللحظية والإشعارات المتبادلة.
 */
export function ChatSystem({ requestId, engineerId, engineerName, hospitalId, hospitalName, onClose }: ChatSystemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // استرجاع الرسائل مرتبة زمنياً
  const messagesRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !engineerId) return null;
    return query(
      collection(firestore, 'maintenanceRequests', requestId, 'chats', engineerId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, requestId, engineerId]);

  const { data: messages, isLoading } = useCollection(messagesRef);

  // التمرير التلقائي لآخر رسالة عند التحديث
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !firestore || isSending) return;

    setIsSending(true);
    const text = newMessage;
    setNewMessage('');

    try {
      const msgCol = collection(firestore, 'maintenanceRequests', requestId, 'chats', engineerId, 'messages');
      await addDoc(msgCol, {
        senderId: user.uid,
        text: text,
        createdAt: serverTimestamp(),
      });

      // تحديد المستقبل بناءً على هوية المرسل الحالي
      const isEngineerSending = user.uid === engineerId;
      const recipientId = isEngineerSending ? hospitalId : engineerId;
      const senderDisplayName = isEngineerSending ? `المهندس ${engineerName}` : hospitalName || "المستشفى";

      // إرسال إشعار للمستقبل
      addDocumentNonBlocking(collection(firestore, 'users', recipientId, 'notifications'), {
        userId: recipientId,
        message: `رسالة جديدة من ${senderDisplayName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        type: 'chat_message',
        isRead: false,
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const isMeEngineer = user?.uid === engineerId;
  const chatPartnerName = isMeEngineer ? (hospitalName || "المستشفى") : `م. ${engineerName}`;

  return (
    <div className="flex flex-col h-[550px] w-full bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in fade-in slide-in-from-bottom-8 border border-primary/10">
      {/* رأس الدردشة */}
      <div className="bg-primary p-5 text-primary-foreground flex justify-between items-center shadow-md">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-black text-base">{chatPartnerName}</p>
            <p className="text-[10px] opacity-80 flex items-center gap-1 justify-end">
              جاري التفاوض الآن <MessageCircle className="h-2 w-2 animate-pulse" />
            </p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-white/30 shadow-sm">
            <AvatarFallback className="bg-white/20 font-bold">
              {isMeEngineer ? <Hospital className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <ScrollArea className="flex-1 p-6 bg-slate-50/50">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-xs text-muted-foreground">جاري تحميل المحادثة...</p>
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isSenderMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex w-full", isSenderMe ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-all hover:shadow-md",
                    isSenderMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-foreground rounded-tl-none text-right border border-slate-200"
                  )}>
                    {msg.text}
                    <div className={cn(
                      "text-[9px] mt-2 opacity-60 flex items-center gap-1",
                      isSenderMe ? "text-white justify-end" : "text-muted-foreground justify-start"
                    )}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-24 text-muted-foreground/30 flex flex-col items-center gap-4">
              <div className="bg-muted p-6 rounded-full">
                <MessageCircle className="h-12 w-12 opacity-10" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground/40">لا توجد رسائل بعد</p>
                <p className="text-xs">ابدأ التفاوض الآن للوصول لاتفاق مهني سريع</p>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* حقل الإدخال */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3 items-center shadow-inner">
        <Button 
          type="submit" 
          size="icon" 
          disabled={isSending || !newMessage.trim()} 
          className="rounded-[1.25rem] h-12 w-12 shrink-0 shadow-lg bg-primary hover:bg-primary/90 transition-transform active:scale-95"
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 rotate-180" />}
        </Button>
        <Input 
          placeholder="اكتب رسالتك للتفاوض هنا..." 
          className="rounded-[1.25rem] h-12 text-right bg-slate-100 border-none focus-visible:ring-primary/30 text-base"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </form>
    </div>
  );
}
