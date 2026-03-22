
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  CheckCircle2,
  Loader2,
  MessageCircle,
  Zap,
  Target,
  UserCheck,
  PlayCircle,
  CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ChatSystem } from '@/components/requests/ChatSystem';

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bidPrice, setBidPrice] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [bidDesc, setBidDesc] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isHiring, setIsHiring] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [matchedEngineers, setMatchedEngineers] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);
  const isAdmin = userData?.role === 'admin';
  const isEngineer = userData?.role === 'engineer';

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !user) return null;
    return doc(firestore, 'maintenanceRequests', requestId as string);
  }, [firestore, requestId, user?.uid]);
  
  const { data: request, isLoading: requestLoading } = useDoc(requestRef);
  const isOwner = user?.uid === request?.hospitalId;
  const isAssignedEngineer = user?.uid === request?.assignedEngineerId;

  // استرجاع الملفات الشخصية اللازمة للمحادثة
  const hospitalProfileRef = useMemoFirebase(() => {
    if (!firestore || !request?.hospitalId) return null;
    return doc(firestore, 'hospitalProfiles', request.hospitalId);
  }, [firestore, request?.hospitalId]);
  const { data: hospitalProfile } = useDoc(hospitalProfileRef);

  const assignedEngineerRef = useMemoFirebase(() => {
    if (!firestore || !request?.assignedEngineerId) return null;
    return doc(firestore, 'engineerProfiles', request.assignedEngineerId);
  }, [firestore, request?.assignedEngineerId]);
  const { data: assignedEngineerData } = useDoc(assignedEngineerRef);

  // منطق فتح الدردشة تلقائياً عند المجيء من إشعار
  useEffect(() => {
    const chatWith = searchParams.get('chatWith');
    if (chatWith && !requestLoading && request) {
      if (isEngineer && chatWith === user?.uid) {
        setActiveChat({ id: user!.uid, name: hospitalProfile?.hospitalName || "المستشفى" });
      } else if (isOwner) {
        setActiveChat({ id: chatWith, name: "المهندس" });
      }
    }
  }, [searchParams, requestLoading, request, isEngineer, isOwner, user?.uid, hospitalProfile]);

  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !requestId || !user || !request) return null;
    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    if (isAdmin) return bidsCol;
    if (user.uid === request.hospitalId) return query(bidsCol, where('hospitalId', '==', user.uid));
    return query(bidsCol, where('engineerId', '==', user.uid));
  }, [firestore, requestId, user?.uid, isAdmin, request]);
  const { data: bids } = useCollection(bidsQuery);

  const engineersRef = useMemoFirebase(() => firestore ? collection(firestore, 'engineerProfiles') : null, [firestore]);
  const { data: allEngineers } = useCollection(engineersRef);

  function handleSmartMatch() {
    if (!request || !allEngineers) return;
    setIsMatching(true);
    const requestText = (request.title + " " + (request.description || "")).toLowerCase();
    const matches = allEngineers
      .filter(e => e.fullName && e.specialization) 
      .map(eng => {
        let score = 50; 
        const spec = eng.specialization.toLowerCase();
        if (requestText.includes(spec)) score += 40;
        return {
          id: eng.id,
          fullName: eng.fullName,
          specialization: eng.specialization,
          matchScore: Math.min(score, 100),
          reason: `مهندس متخصص في ${eng.specialization}، مما يجعله الخيار الأمثل لهذا العطل.`
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    setMatchedEngineers(matches);
    setIsMatching(false);
  }

  const handleHireEngineer = (engineerId: string, engineerName: string) => {
    if (!firestore || !request) return;
    setIsHiring(engineerId);
    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
      status: 'assigned',
      assignedEngineerId: engineerId,
      updatedAt: serverTimestamp(),
    });
    addDocumentNonBlocking(collection(firestore, 'users', engineerId, 'notifications'), {
      userId: engineerId,
      message: `تم اختيارك وتوظيفك لصيانة: ${request.title}. يمكنك الآن البدء في التنفيذ.`,
      type: 'direct_hiring',
      requestId: requestId,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    toast({ title: "تم التوظيف", description: `تم إسناد المهمة للمهندس ${engineerName}.` });
    setIsHiring(null);
  };

  const handleAcceptBid = (bid: any) => {
    if (!firestore || !request) return;
    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
      status: 'assigned',
      assignedEngineerId: bid.engineerId,
      updatedAt: serverTimestamp(),
    });
    addDocumentNonBlocking(collection(firestore, 'users', bid.engineerId, 'notifications'), {
      userId: bid.engineerId,
      message: `تم قبول عرضك لطلب الصيانة: ${request.title}. يمكنك البدء الآن.`,
      type: 'bid_accepted',
      requestId: requestId,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    toast({ title: "تم قبول العرض", description: "تم إسناد المهمة للمهندس." });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!firestore || !request) return;
    setIsUpdatingStatus(true);
    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    let message = "";
    if (newStatus === 'in_progress') message = `بدأ المهندس في العمل على طلبك: ${request.title}`;
    else if (newStatus === 'completed') message = `أنهى المهندس صيانة جهازك بنجاح: ${request.title}`;

    if (message) {
      addDocumentNonBlocking(collection(firestore, 'users', request.hospitalId, 'notifications'), {
        userId: request.hospitalId,
        message: message,
        type: 'status_update',
        requestId: requestId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

    toast({ title: "تم تحديث الحالة", description: "تم تحديث حالة الطلب وإرسال تنبيه للمستشفى." });
    setIsUpdatingStatus(false);
  };

  function handleSendBid() {
    if (!user || !requestId || !firestore || !request) return;
    setIsSubmittingBid(true);
    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    addDocumentNonBlocking(bidsCol, {
      engineerId: user.uid,
      requestId: requestId,
      hospitalId: request.hospitalId,
      price: Number(bidPrice),
      estimatedDays: Number(bidDays),
      description: bidDesc,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    addDocumentNonBlocking(collection(firestore, 'users', request.hospitalId, 'notifications'), {
      userId: request.hospitalId,
      message: `وصلك عرض صيانة جديد لطلبك: ${request.title}`,
      type: 'new_bid',
      requestId: requestId,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    toast({ title: "تم تقديم العرض", description: "تم إرسال عرضك بنجاح." });
    router.push('/dashboard');
  }

  if (requestLoading) return <Shell><div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div></Shell>;
  if (!request) return <Shell><div className="text-center py-20"><h2 className="text-2xl font-bold">الطلب غير موجود</h2></div></Shell>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">مفتوح</Badge>;
      case 'assigned': return <Badge className="bg-amber-100 text-amber-700">تم الإسناد</Badge>;
      case 'in_progress': return <Badge className="bg-purple-100 text-purple-700">قيد التنفيذ</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700">مكتمل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-headline">{request.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(request.status)}
                {(isEngineer || isOwner) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-primary rounded-xl border-primary/20 bg-primary/5"
                    onClick={() => setActiveChat({ 
                      id: isEngineer ? user!.uid : request.assignedEngineerId!, 
                      name: isEngineer ? (hospitalProfile?.hospitalName || "المستشفى") : (assignedEngineerData?.fullName || "المهندس")
                    })}
                  >
                    <MessageCircle className="h-4 w-4" /> محادثة التفاوض
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {(isOwner || isAdmin) && request.status === 'open' && (
              <Button variant="outline" onClick={handleSmartMatch} disabled={isMatching} className="gap-2 border-primary text-primary rounded-xl bg-primary/5">
                {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                مطابقة واقتراح مهندسين
              </Button>
            )}
            
            {/* أزرار التحكم في الحالة للمهندس المسند إليه العمل */}
            {isAssignedEngineer && (
              <div className="flex gap-2">
                {request.status === 'assigned' && (
                  <Button 
                    onClick={() => handleUpdateStatus('in_progress')} 
                    disabled={isUpdatingStatus}
                    className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-xl"
                  >
                    <PlayCircle className="h-4 w-4" /> بدء تنفيذ المهمة
                  </Button>
                )}
                {request.status === 'in_progress' && (
                  <Button 
                    onClick={() => handleUpdateStatus('completed')} 
                    disabled={isUpdatingStatus}
                    className="bg-green-600 hover:bg-green-700 gap-2 rounded-xl"
                  >
                    <CheckCircle className="h-4 w-4" /> تم الإنجاز بنجاح
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {activeChat && (
          <div className="fixed bottom-24 left-6 z-50 w-full max-w-md animate-in slide-in-from-left-4 duration-300">
            <ChatSystem 
              requestId={requestId as string}
              engineerId={isEngineer ? user!.uid : activeChat.id}
              engineerName={isEngineer ? (assignedEngineerData?.fullName || "أنا") : activeChat.name}
              hospitalId={request.hospitalId}
              hospitalName={hospitalProfile?.hospitalName || "المستشفى"}
              onClose={() => setActiveChat(null)}
            />
          </div>
        )}

        {matchedEngineers.length > 0 && (isOwner || isAdmin) && request.status === 'open' && (
          <div className="bg-primary/5 p-8 rounded-[3rem] border-2 border-primary/10 space-y-6 animate-in zoom-in-95 duration-300 shadow-xl">
            <div className="flex items-center gap-3 justify-end text-primary text-right">
              <div>
                <h2 className="text-2xl font-black">المرشحون الأنسب لهذه المهمة</h2>
                <p className="text-xs opacity-70">نظام المطابقة البرمجي المنطقي.</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-2xl"><Target className="h-6 w-6" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {matchedEngineers.map((eng) => (
                <Card key={eng.id} className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col group hover:scale-[1.02] transition-transform">
                  <CardContent className="p-6 text-right flex-1 flex flex-col">
                    <Badge className="bg-emerald-500 px-4 py-1.5 font-black text-xs rounded-full w-fit mb-4">{eng.matchScore}% مطابقة</Badge>
                    <p className="font-black text-xl text-foreground">م. {eng.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4 font-bold">{eng.specialization}</p>
                    <div className="flex flex-col gap-2 mt-auto">
                      <Button variant="outline" onClick={() => setActiveChat({ id: eng.id, name: eng.fullName })} className="w-full h-11 rounded-xl border-primary/20 text-primary gap-2 font-bold">
                        <MessageCircle className="h-4 w-4" /> تفاوض دردشة
                      </Button>
                      <Button onClick={() => handleHireEngineer(eng.id, eng.fullName)} disabled={isHiring !== null} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
                        {isHiring === eng.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        توظيف مباشر
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-muted/30 border-b text-right">
                <CardTitle className="text-xl font-bold">وصف العطل التقني</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-right">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">{request.description}</p>
              </CardContent>
            </Card>

            <div className="space-y-4 text-right">
              <h2 className="text-2xl font-black">العروض المقدمة</h2>
              <div className="space-y-4">
                {bids?.map(bid => (
                  <Card key={bid.id} className="hover:shadow-xl transition-all overflow-hidden border-none shadow-md rounded-3xl bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-lg mb-2">عرض صيانة مقدم</p>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-2xl">{bid.description}</p>
                          <div className="mt-4 flex items-center gap-4 justify-end">
                             <Badge variant="outline" className="text-primary font-black px-4">{bid.price} ر.س</Badge>
                             <Badge variant="secondary" className="px-4">{bid.estimatedDays} أيام</Badge>
                             {(isOwner || isAdmin) && (
                               <Button variant="ghost" size="sm" className="gap-2 text-primary" onClick={() => setActiveChat({ id: bid.engineerId, name: 'صاحب العرض' })}>
                                 <MessageCircle className="h-4 w-4" /> تفاوض
                               </Button>
                             )}
                          </div>
                        </div>
                        {isOwner && request.status === 'open' && (
                          <div className="flex items-center justify-center sm:w-40 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l">
                            <Button className="w-full rounded-xl font-bold h-11" onClick={() => handleAcceptBid(bid)}>قبول العرض</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!bids || bids.length === 0) && (
                  <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed">
                    <p className="text-muted-foreground">لا توجد عروض مقدمة على هذا الطلب حتى الآن.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isOwner && !isAdmin && request.status === 'open' && !bids?.some(b => b.engineerId === user?.uid) && (
              <Card className="shadow-2xl border-t-4 border-t-primary rounded-3xl">
                <CardHeader className="text-right">
                  <CardTitle className="text-2xl font-black">تقديم عرض صيانة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold flex justify-end">التكلفة (ر.س)</Label>
                      <Input type="number" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="h-12 rounded-xl text-center font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex justify-end">المدة (أيام)</Label>
                      <Input type="number" value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="h-12 rounded-xl text-center font-bold" />
                    </div>
                  </div>
                  <Textarea placeholder="اشرح خطة الإصلاح الفنية..." value={bidDesc} onChange={(e) => setBidDesc(e.target.value)} className="min-h-[150px] rounded-xl text-right" />
                  <Button className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/20" onClick={handleSendBid} disabled={isSubmittingBid || !bidPrice}>
                    {isSubmittingBid ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إرسال العرض'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* عرض حالة التنفيذ للمستشفى */}
            {isOwner && request.status !== 'open' && (
              <Card className="shadow-xl rounded-3xl bg-primary/5 border-none">
                <CardHeader className="text-right">
                  <CardTitle className="text-lg font-bold">متابعة التنفيذ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <Badge variant={request.status === 'completed' ? 'default' : 'outline'} className={request.status === 'completed' ? 'bg-green-500' : ''}>
                        {request.status === 'completed' ? 'تمت الصيانة' : 'قيد المعالجة'}
                      </Badge>
                      <span className="font-bold">الحالة الحالية</span>
                    </div>
                    {assignedEngineerData && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-primary font-bold">{assignedEngineerData.fullName}</span>
                        <span className="text-xs text-muted-foreground">المهندس المسؤول</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
