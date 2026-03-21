
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, User as UserIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ChatSystemProps {
  requestId: string;
  engineerId: string;
  engineerName: string;
  hospitalName?: string;
  onClose?: () => void;
}

export function ChatSystem({ requestId, engineerId, engineerName, hospitalName, onClose }: ChatSystemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !engineerId) return null;
    return query(
      collection(firestore, 'maintenanceRequests', requestId, 'chats', engineerId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, requestId, engineerId]);

  const { data: messages, isLoading } = useCollection(messagesRef);

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

      // إرسال تنبيه للطرف الآخر
      const recipientId = user.uid === engineerId ? (hospitalName ? 'hospital_user' : 'hospital_id') : engineerId;
      // ملاحظة: في نظام حقيقي نستخدم المعرف الفعلي للمستشفى من وثيقة الطلب
      
      addDocumentNonBlocking(collection(firestore, 'users', engineerId, 'notifications'), {
        userId: engineerId,
        message: `رسالة جديدة بخصوص طلب الصيانة: ${text.substring(0, 30)}...`,
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

  return (
    <div className="flex flex-col h-[500px] w-full bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-black text-sm">م. {engineerName}</p>
            <p className="text-[10px] opacity-70">جلسة تفاوض مباشرة</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarFallback className="bg-white/20"><UserIcon className="h-5 w-5" /></AvatarFallback>
          </Avatar>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages?.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={cn("flex w-full", isMe ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-muted text-foreground rounded-tl-none text-right"
                )}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 bg-muted/30 border-t flex gap-2 items-center">
        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="rounded-2xl h-12 w-12 shrink-0 shadow-lg">
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 rotate-180" />}
        </Button>
        <Input 
          placeholder="اكتب رسالتك للتفاوض..." 
          className="rounded-2xl h-12 text-right bg-white shadow-inner"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </form>
    </div>
  );
}
