"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
  Info,
  DollarSign,
  Timer,
  Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { analyzeBids } from '@/ai/flows/analyze-bids';
import { troubleshootDevice, type TroubleshootOutput } from '@/ai/flows/troubleshoot-device';
import { generateBidDescription } from '@/ai/flows/generate-bid-description';
import { matchEngineers } from '@/ai/flows/match-engineers';
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
  const [isGeneratingBidAI, setIsGeneratingBidAI] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootOutput | null>(null);
  const [matchedEngineers, setMatchedEngineers] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);
  const isAdmin = userData?.role === 'admin';

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !user) return null;
    return doc(firestore, 'maintenanceRequests', requestId as string);
  }, [firestore, requestId, user?.uid]);
  
  const { data: request, isLoading: requestLoading } = useDoc(requestRef);

  const isOwner = user?.uid === request?.hospitalId;

  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !requestId || !user || !request) return null;
    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    
    if (isAdmin) return bidsCol;
    if (user.uid === request.hospitalId) return query(bidsCol, where('hospitalId', '==', user.uid));
    return query(bidsCol, where('engineerId', '==', user.uid));
  }, [firestore, requestId, user?.uid, request?.hospitalId, isAdmin, request]);
  
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsQuery);

  const engineersRef = useMemoFirebase(() => firestore ? collection(firestore, 'engineerProfiles') : null, [firestore]);
  const { data: allEngineers } = useCollection(engineersRef);

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
      message: `تم قبول عرضك لطلب الصيانة: ${request.title}`,
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
    if (request.assignedEngineerId) {
      addDocumentNonBlocking(collection(firestore, 'reviews'), {
        requestId: request.id,
        hospitalId: user?.uid,
        engineerId: request.assignedEngineerId,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp(),
      });
      updateDocumentNonBlocking(doc(firestore, 'engineerProfiles', request.assignedEngineerId), {
        totalJobs: increment(1),
        updatedAt: serverTimestamp(),
      });
      addDocumentNonBlocking(collection(firestore, 'users', request.assignedEngineerId, 'notifications'), {
        userId: request.assignedEngineerId,
        message: `تم إكمال وتقييم مهمتك لطلب: ${request.title}`,
        type: 'job_completed',
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
    toast({ title: "تم إكمال المهمة", description: "تم إغلاق الطلب بنجاح." });
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

  async function handleSmartMatch() {
    if (!request || !allEngineers || allEngineers.length === 0) return;
    setIsMatching(true);
    try {
      const result = await matchEngineers({
        requestTitle: request.title,
        requestDescription: request.description,
        deviceSpecialization: "Medical Equipment",
        availableEngineers: allEngineers.map(e => ({
          id: e.id,
          fullName: e.fullName,
          specialization: e.specialization,
          yearsExperience: e.yearsExperience,
          rating: e.rating,
          totalJobs: e.totalJobs
        }))
      });
      
      const enrichedMatches = result.recommendations.map(match => {
        const eng = allEngineers.find(e => e.id === match.engineerId);
        return { ...match, ...eng };
      });
      setMatchedEngineers(enrichedMatches);
      toast({ title: "تمت المطابقة", description: "تم العثور على أفضل المهندسين المناسبين لهذا الطلب." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل نظام المطابقة في العمل." });
    } finally {
      setIsMatching(false);
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

  async function handleGenerateAIBid() {
    if (!request) return;
    setIsGeneratingBidAI(true);
    try {
      const result = await generateBidDescription({
        requestTitle: request.title,
        requestDescription: request.description,
        engineerNotes: bidDesc
      });
      setBidDesc(result.professionalDescription);
      toast({ title: "تم توليد العرض", description: "قام المساعد الذكي بصياغة عرض تقني احترافي لك." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل توليد العرض الذكي." });
    } finally {
      setIsGeneratingBidAI(false);
    }
  }

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
      isRead: false,
      createdAt: serverTimestamp(),
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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={request.status === 'open' ? 'secondary' : 'default'} className="rounded-lg">
                  {request.status === 'open' ? 'مفتوح للمزايدة' : request.status === 'assigned' ? 'قيد العمل' : 'مكتمل'}
                </Badge>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {request.urgency === 'critical' ? 'حرج فوري' : request.urgency === 'high' ? 'عاجل' : 'عادي'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isOwner && request.status === 'open' && (
              <>
                <Button variant="outline" onClick={handleSmartMatch} disabled={isMatching} className="gap-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50">
                  {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  مطابقة المهندسين
                </Button>
                <Button variant="outline" onClick={handleTroubleshoot} disabled={isTroubleshooting} className="gap-2 border-primary/50 text-primary rounded-xl">
                  {isTroubleshooting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  استكشاف الأعطال
                </Button>
              </>
            )}
            {isOwner && request.status === 'assigned' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 gap-2 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" /> إتمام وتقييم المهمة
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="rounded-3xl">
                  <DialogHeader><DialogTitle className="text-xl">تقييم جودة الصيانة</DialogTitle></DialogHeader>
                  <div className="space-y-6 py-4">
                    <p className="text-center text-muted-foreground text-sm">كيف تقيم أداء المهندس في هذه العملية؟</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-10 w-10 cursor-pointer transition-all ${reviewRating >= s ? "text-yellow-500 fill-yellow-500 scale-110" : "text-muted hover:text-yellow-200"}`} onClick={() => setReviewRating(s)} />
                      ))}
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="font-bold">ملاحظات إضافية</Label>
                      <Textarea placeholder="اكتب رأيك في عمل المهندس..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="rounded-xl min-h-[100px]" />
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCompleteJob} className="w-full h-12 rounded-xl">حفظ وإغلاق الطلب</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {matchedEngineers.length > 0 && isOwner && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="col-span-full flex items-center gap-2 text-emerald-700 font-black mb-2 justify-end">
              <span>المهندسون الأكثر مطابقة لهذا الطلب (AI Recommendation)</span>
              <Target className="h-5 w-5" />
            </div>
            {matchedEngineers.map((eng, idx) => (
              <Card key={eng.id} className="border-2 border-emerald-100 bg-emerald-50/30 rounded-3xl overflow-hidden hover:border-emerald-500 transition-all group">
                <CardContent className="p-4 text-right relative">
                  <Badge className="absolute top-2 left-2 bg-emerald-500 font-bold">{eng.matchScore}% مطابقة</Badge>
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-emerald-700" />
                    </div>
                    <p className="font-black text-emerald-900">{eng.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{eng.specialization}</p>
                    <div className="flex gap-1 text-yellow-500">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${eng.rating >= s ? "fill-current" : ""}`} />)}
                    </div>
                    <p className="text-[10px] text-emerald-800 font-medium text-center mt-2 line-clamp-2">"{eng.reason}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {troubleshootResult && (
          <Card className="bg-blue-50 border-blue-200 rounded-3xl overflow-hidden shadow-lg border-2">
            <CardHeader className="bg-blue-100/50 pb-2 text-right">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800 justify-end">
                <span>مساعد التشخيص الذكي</span>
                <Sparkles className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-right">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                <p className="font-bold text-blue-900 mb-2">السبب المحتمل: {troubleshootResult.potentialCause}</p>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-blue-800">خطوات مقترحة:</p>
                  <ul className="space-y-2 text-sm pr-0">
                    {troubleshootResult.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 justify-end">
                        <span>{s}</span>
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b text-right">
                <CardTitle className="text-xl font-bold">وصف العطل</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-right">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">{request.description}</p>
              </CardContent>
            </Card>

            <div className="space-y-4 text-right">
              <div className="flex items-center justify-between flex-row-reverse">
                <h2 className="text-2xl font-black">{isOwner || isAdmin ? `العروض المتاحة (${bids?.length || 0})` : 'عروضك لهذا الطلب'}</h2>
                {isOwner && bids && bids.length > 0 && (
                  <Button onClick={handleAnalyzeBids} disabled={isAnalyzing} variant="outline" className="gap-2 border-primary/20 text-primary rounded-xl">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    تحليل العروض ذكياً
                  </Button>
                )}
              </div>

              {isOwner && aiAnalysis && (
                <Card className="bg-primary/5 border-primary/20 p-6 rounded-3xl shadow-lg border-2 text-right">
                  <p className="font-bold text-primary flex items-center gap-2 justify-end mb-4"><span>التوصية الذكية للاختيار:</span> <Sparkles className="h-4 w-4" /></p>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                    <p className="font-black text-xl text-primary">{aiAnalysis.bestOption.engineerName}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{aiAnalysis.bestOption.reason}</p>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {bids?.map(bid => (
                  <Card key={bid.id} className="hover:shadow-xl transition-all overflow-hidden border-none shadow-md rounded-3xl">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 text-right order-1 sm:order-2">
                          <div className="flex items-center gap-3 mb-3 justify-end">
                            <div>
                              <p className="font-bold text-lg">مهندس صيانة متخصص</p>
                              <div className="flex items-center gap-1 justify-end text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-2xl">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-2xl">{bid.description}</p>
                          <div className="mt-4 flex items-center gap-4 justify-end">
                             <Badge variant="outline" className="text-primary font-black text-lg">{bid.price} ر.س</Badge>
                             <Badge variant="outline" className="text-muted-foreground">{bid.estimatedDays} أيام</Badge>
                          </div>
                        </div>
                        {isOwner && request.status === 'open' && (
                          <div className="flex items-center justify-center sm:w-40 order-2 sm:order-1 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                            <Button className="w-full rounded-xl" onClick={() => handleAcceptBid(bid)}>قبول العرض</Button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                          <div className="flex items-center justify-center sm:w-40 order-2 sm:order-1 text-green-600 font-bold bg-green-50 rounded-xl p-2">
                            تم القبول
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isOwner && !isAdmin && request.status === 'open' && (
              <Card className="shadow-2xl border-t-4 border-t-primary rounded-3xl sticky top-24">
                <CardHeader className="text-right">
                  <CardTitle className="text-2xl font-black">تقديم عرض</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold flex justify-end">السعر <DollarSign className="h-3 w-3 mr-1" /></Label>
                      <Input type="number" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="h-12 rounded-xl text-center font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex justify-end">المدة (أيام) <Timer className="h-3 w-3 mr-1" /></Label>
                      <Input type="number" value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="h-12 rounded-xl text-center font-bold" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Button variant="outline" size="sm" onClick={handleGenerateAIBid} disabled={isGeneratingBidAI} className="text-primary h-8 rounded-lg gap-1 border-primary/30">
                        {isGeneratingBidAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        صياغة ذكية
                      </Button>
                      <Label className="font-bold">الوصف التقني</Label>
                    </div>
                    <Textarea 
                      placeholder="اشرح خطة الإصلاح..." 
                      value={bidDesc} 
                      onChange={(e) => setBidDesc(e.target.value)} 
                      className="min-h-[150px] rounded-xl text-right" 
                    />
                  </div>

                  <Button className="w-full h-14 text-lg font-bold rounded-xl mt-2" onClick={handleSendBid} disabled={isSubmittingBid || !bidPrice || !bidDays}>
                    {isSubmittingBid ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إرسال العرض الآن'}
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
