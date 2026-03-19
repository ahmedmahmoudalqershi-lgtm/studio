"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  Wrench, 
  User, 
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  Star,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { analyzeBids } from '@/ai/flows/analyze-bids';
import { troubleshootDevice, type TroubleshootOutput } from '@/ai/flows/troubleshoot-device';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bidPrice, setBidPrice] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [bidDesc, setBidDesc] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootOutput | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !user) return null;
    return doc(firestore, 'maintenanceRequests', requestId as string);
  }, [firestore, requestId, user]);
  
  const { data: request, isLoading: requestLoading } = useDoc(requestRef);

  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !requestId || !user) return null;
    return query(collection(firestore, 'maintenanceRequests', requestId as string, 'bids'));
  }, [firestore, requestId, user]);
  
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsQuery);

  const isOwner = user?.uid === request?.hospitalId;

  const handleAcceptBid = (bid: any) => {
    if (!firestore || !request) return;

    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
      status: 'assigned',
      assignedEngineerId: bid.engineerId,
      updatedAt: serverTimestamp(),
    });

    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id, 'bids', bid.id), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    addDocumentNonBlocking(collection(firestore, 'users', bid.engineerId, 'notifications'), {
      userId: bid.engineerId,
      message: `تم قبول عرضك لطلب: ${request.title}`,
      type: 'bid_accepted',
      isRead: false,
      createdAt: serverTimestamp(),
    });

    toast({ title: "تم قبول العرض", description: "تم إسناد المهمة للمهندس بنجاح." });
  };

  const handleCompleteJob = () => {
    if (!firestore || !request) return;

    updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    // إضافة التقييم
    addDocumentNonBlocking(collection(firestore, 'reviews'), {
      requestId: request.id,
      hospitalId: user?.uid,
      engineerId: request.assignedEngineerId,
      rating: reviewRating,
      comment: reviewComment,
      createdAt: serverTimestamp(),
    });

    // تحديث إحصائيات المهندس
    updateDocumentNonBlocking(doc(firestore, 'engineerProfiles', request.assignedEngineerId), {
      totalJobs: increment(1),
      // ملاحظة: تحديث التقييم العام يفضل أن يكون عبر Cloud Function، للتبسيط سنقوم بزيادته هنا
      updatedAt: serverTimestamp(),
    });

    toast({ title: "تم إكمال المهمة", description: "شكراً لتقييمك، تم إغلاق الطلب بنجاح." });
    router.push('/dashboard');
  };

  async function handleAnalyzeBids() {
    if (!bids || bids.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeBids({
        requestTitle: request?.title || "طلب صيانة",
        requestDescription: request?.description || "",
        bids: bids.map(b => ({
          engineerName: "مهندس متخصص",
          price: b.price,
          estimatedDays: b.estimatedDays,
          description: b.description,
          rating: 4.5
        }))
      });
      setAiAnalysis(result);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ في التحليل", description: "تعذر تحليل العروض حالياً." });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleTroubleshoot() {
    if (!request) return;
    setIsTroubleshooting(true);
    try {
      const result = await troubleshootDevice({
        deviceName: request.title,
        issueDescription: request.description
      });
      setTroubleshootResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحصول على نصائح تقنية." });
    } finally {
      setIsTroubleshooting(false);
    }
  }

  function handleSendBid() {
    if (!user || !requestId || !firestore) return;
    setIsSubmittingBid(true);
    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    addDocumentNonBlocking(bidsCol, {
      engineerId: user.uid,
      price: Number(bidPrice),
      estimatedDays: Number(bidDays),
      description: bidDesc,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast({ title: "تم تقديم العرض", description: "تم إرسال عرضك بنجاح." });
    router.push('/dashboard');
  }

  if (requestLoading) return <Shell><div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div></Shell>;
  if (!request) return <Shell><div className="text-center py-20"><h2 className="text-2xl font-bold">الطلب غير موجود</h2><Button onClick={() => router.back()} className="mt-4">العودة</Button></div></Shell>;

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
              <Badge className="mt-1" variant={request.status === 'open' ? 'secondary' : 'default'}>
                {request.status === 'open' ? 'مفتوح للمزايدة' : request.status === 'assigned' ? 'قيد العمل' : 'مكتمل'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isOwner && request.status === 'open' && (
              <Button variant="outline" onClick={handleTroubleshoot} disabled={isTroubleshooting} className="gap-2 border-primary/50 text-primary">
                {isTroubleshooting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                استكشاف الأعطال ذكياً
              </Button>
            )}
            {isOwner && request.status === 'assigned' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 gap-2">
                    <CheckCircle2 className="h-4 w-4" /> إتمام وتقييم
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>تقييم جودة الصيانة</DialogTitle></DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-10 w-10 cursor-pointer ${reviewRating >= s ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} onClick={() => setReviewRating(s)} />
                      ))}
                    </div>
                    <Textarea placeholder="اكتب رأيك في عمل المهندس..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  </div>
                  <DialogFooter><Button onClick={handleCompleteJob} className="w-full">حفظ وإغلاق</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {troubleshootResult && (
          <Card className="bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <Info className="h-5 w-5" /> نصائح المساعد الذكي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="font-bold text-blue-800">السبب المحتمل: {troubleshootResult.potentialCause}</p>
                <ul className="mt-2 space-y-1 text-sm list-disc pr-4">
                  {troubleshootResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>{troubleshootResult.safetyWarning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">وصف الطلب</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{request.description}</p>
                <div className="flex gap-4 mt-6 pt-6 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> الأهمية: {request.urgency}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> تاريخ الطلب: {request.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'اليوم'}</span>
                </div>
              </CardContent>
            </Card>

            {isOwner && request.status === 'open' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">العروض المستلمة ({bids?.length || 0})</h2>
                  {bids && bids.length > 0 && (
                    <Button onClick={handleAnalyzeBids} disabled={isAnalyzing} variant="outline" className="gap-2 bg-secondary/10">
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      تحليل العروض
                    </Button>
                  )}
                </div>

                {aiAnalysis && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                    <p className="font-bold text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> توصية الذكاء الاصطناعي:</p>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="font-black text-lg">{aiAnalysis.bestOption.engineerName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{aiAnalysis.bestOption.reason}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {bids?.map(bid => (
                    <Card key={bid.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-bold">مهندس متخصص</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{bid.description}</p>
                            <p className="mt-2 text-primary font-black text-lg">{bid.price} ر.س</p>
                          </div>
                          <div className="text-left space-y-2">
                            <Badge variant="outline">{bid.estimatedDays} أيام</Badge>
                            <Button size="sm" className="w-full" onClick={() => handleAcceptBid(bid)}>قبول العرض</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {!isOwner && request.status === 'open' && (
              <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader><CardTitle>تقديم عرض صيانة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input type="number" placeholder="السعر (ر.س)" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} />
                  <Input type="number" placeholder="المدة المتوقعة (أيام)" value={bidDays} onChange={(e) => setBidDays(e.target.value)} />
                  <Textarea placeholder="تفاصيل العرض التقنية..." value={bidDesc} onChange={(e) => setBidDesc(e.target.value)} />
                  <Button className="w-full h-12" onClick={handleSendBid} disabled={isSubmittingBid || !bidPrice || !bidDays}>
                    {isSubmittingBid ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال العرض'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
