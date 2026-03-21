
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, User as UserIcon, X, Hospital } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ChatSystemProps {
  requestId: string;
  engineerId: string;
  engineerName: string;
  hospitalId: string; // أضفت معرف المستشفى لضمان إرسال الإشعارات له
  hospitalName?: string;
  onClose?: () => void;
}

export function ChatSystem({ requestId, engineerId, engineerName, hospitalId, hospitalName, onClose }: ChatSystemProps) {
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

      // منطق الإشعارات الذكي
      const isEngineerSending = user.uid === engineerId;
      const recipientId = isEngineerSending ? hospitalId : engineerId;
      const senderName = isEngineerSending ? `المهندس ${engineerName}` : hospitalName || "المستشفى";

      addDocumentNonBlocking(collection(firestore, 'users', recipientId, 'notifications'), {
        userId: recipientId,
        message: `رسالة جديدة من ${senderName}: ${text.substring(0, 40)}...`,
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

  return (
    <div className="flex flex-col h-[500px] w-full bg-white rounded-[2rem] shadow-2xl border-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 border border-primary/10">
      <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-black text-sm">{isMeEngineer ? hospitalName : `م. ${engineerName}`}</p>
            <p className="text-[10px] opacity-70">جلسة تفاوض مباشرة</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white/20 shadow-sm">
            <AvatarFallback className="bg-white/20">
              {isMeEngineer ? <Hospital className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 bg-slate-50/30">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isSenderMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex w-full", isSenderMe ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                    isSenderMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-foreground rounded-tl-none text-right border border-slate-100"
                  )}>
                    {msg.text}
                    <div className={cn("text-[8px] mt-1 opacity-60", isSenderMe ? "text-white" : "text-muted-foreground")}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-muted-foreground/40 italic flex flex-col items-center gap-2">
              <UserIcon className="h-12 w-12 opacity-5" />
              <p>ابدأ التفاوض الآن للوصول لاتفاق</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2 items-center">
        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="rounded-2xl h-12 w-12 shrink-0 shadow-lg bg-primary hover:bg-primary/90">
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 rotate-180" />}
        </Button>
        <Input 
          placeholder="اكتب ردك للتفاوض..." 
          className="rounded-2xl h-12 text-right bg-slate-50 border-none focus-visible:ring-primary/20"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </form>
    </div>
  );
}
