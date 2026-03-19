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
  Timer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { analyzeBids } from '@/ai/flows/analyze-bids';
import { troubleshootDevice, type TroubleshootOutput } from '@/ai/flows/troubleshoot-device';
import { generateBidDescription } from '@/ai/flows/generate-bid-description';
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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootOutput | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !user) return null;
    return doc(firestore, 'maintenanceRequests', requestId as string);
  }, [firestore, requestId, user]);
  
  const { data: request, isLoading: requestLoading } = useDoc(requestRef);

  const isOwner = user?.uid === request?.hospitalId;

  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !requestId || !user || !request) return null;
    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    
    if (user.uid === request.hospitalId) {
      return query(bidsCol, where('hospitalId', '==', user.uid));
    } else {
      return query(bidsCol, where('engineerId', '==', user.uid));
    }
  }, [firestore, requestId, user?.uid, request?.hospitalId]);
  
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsQuery);

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
              <Button variant="outline" onClick={handleTroubleshoot} disabled={isTroubleshooting} className="gap-2 border-primary/50 text-primary rounded-xl">
                {isTroubleshooting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                استكشاف الأعطال ذكياً
              </Button>
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
                      <Textarea placeholder="اكتب رأيك في عمل المهندس ومدى جودة الإصلاح..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="rounded-xl min-h-[100px]" />
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCompleteJob} className="w-full h-12 rounded-xl">حفظ وإغلاق الطلب نهائياً</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {troubleshootResult && (
          <Card className="bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-top-2 rounded-3xl overflow-hidden shadow-lg border-2">
            <CardHeader className="bg-blue-100/50 pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Sparkles className="h-5 w-5" /> مساعد التشخيص الذكي
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                <p className="font-bold text-blue-900 mb-2">السبب المحتمل: {troubleshootResult.potentialCause}</p>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-blue-800">خطوات مقترحة:</p>
                  <ul className="space-y-2 text-sm list-none pr-0 text-right">
                    {troubleshootResult.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg">
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold mb-1">تنبيه أمان:</p>
                  <p>{troubleshootResult.safetyWarning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xl font-bold">تفاصيل العطل الفنية</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-right text-lg">{request.description}</p>
                <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t text-sm text-muted-foreground justify-end">
                  <span className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full"><Calendar className="h-4 w-4" /> تم النشر: {request.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'اليوم'}</span>
                  <span className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full"><Clock className="h-4 w-4" /> الأولوية: {request.urgency}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {isOwner && bids && bids.length > 0 && (
                  <Button onClick={handleAnalyzeBids} disabled={isAnalyzing} variant="outline" className="gap-2 bg-primary/5 border-primary/20 text-primary rounded-xl">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    تحليل ومقارنة العروض (AI)
                  </Button>
                )}
                <h2 className="text-2xl font-black">{isOwner ? `العروض المتاحة (${bids?.length || 0})` : 'عروضك السابقة لهذا الطلب'}</h2>
              </div>

              {isOwner && aiAnalysis && (
                <Card className="bg-primary/5 border-primary/20 space-y-3 p-6 rounded-3xl shadow-lg animate-in zoom-in-95">
                  <p className="font-bold text-primary flex items-center gap-2 justify-end"><Sparkles className="h-4 w-4" /> التوصية الذكية للمستشفى:</p>
                  <div className="bg-white p-6 rounded-2xl shadow-sm text-right border-2 border-primary/10">
                    <p className="font-black text-xl text-primary">{aiAnalysis.bestOption.engineerName}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{aiAnalysis.bestOption.reason}</p>
                    <div className="mt-6 p-4 bg-amber-50 rounded-xl text-sm text-amber-900 border border-amber-100 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                        <strong>تحليل المخاطر والاعتبارات:</strong>
                        <p className="mt-1 opacity-80">{aiAnalysis.riskAnalysis}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {bids?.map(bid => (
                  <Card key={bid.id} className="hover:shadow-2xl transition-all duration-300 overflow-hidden border-none shadow-md rounded-3xl group">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="p-6 flex-1 text-right">
                          <div className="flex items-center gap-3 mb-4 justify-end">
                            <div className="text-right">
                              <p className="font-bold text-lg">{bid.engineerId === user?.uid ? 'عرضك الحالي' : 'مهندس صيانة متخصص'}</p>
                              <div className="flex items-center gap-1 justify-end text-xs text-yellow-500">
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
                          <p className="text-muted-foreground leading-relaxed text-sm bg-muted/30 p-4 rounded-2xl border border-muted-foreground/5">{bid.description}</p>
                          <div className="mt-4 flex items-center gap-6 justify-end">
                             <span className="flex items-center gap-2 text-primary font-black text-2xl">{bid.price} ر.س <DollarSign className="h-5 w-5" /></span>
                             <span className="flex items-center gap-2 text-muted-foreground text-sm font-medium">{bid.estimatedDays} أيام عمل <Timer className="h-4 w-4" /></span>
                          </div>
                        </div>
                        {isOwner && request.status === 'open' && (
                          <div className="bg-muted/20 p-6 flex items-center justify-center border-r sm:w-48">
                            <Button size="lg" className="w-full rounded-2xl shadow-xl shadow-primary/20 py-8" onClick={() => handleAcceptBid(bid)}>قبول العرض</Button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                          <div className="bg-green-500/10 p-6 flex items-center justify-center border-r sm:w-48">
                             <Badge className="bg-green-500 text-white p-3 rounded-xl gap-2"><CheckCircle2 className="h-4 w-4" /> العرض المقبول</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!bids || bids.length === 0) && (
                  <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted-foreground/20">
                    <Wrench className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">{isOwner ? 'لم تصل أي عروض حتى الآن، سيتم إشعارك فور وصولها.' : 'لم تقدم عرضاً لهذا الطلب بعد، ابدأ الآن بمساعدة الذكاء الاصطناعي.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isOwner && request.status === 'open' && (
              <Card className="shadow-2xl border-t-8 border-t-primary rounded-[2.5rem] overflow-hidden sticky top-24">
                <CardHeader className="text-right pb-0">
                  <CardTitle className="text-2xl font-black">تقديم عرض تقني</CardTitle>
                  <CardDescription>قدم عرضاً احترافياً مقنعاً لزيادة فرص قبولك.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6 text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2 justify-end">السعر <DollarSign className="h-3 w-3" /></Label>
                      <Input type="number" placeholder="0.00" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="h-14 rounded-2xl text-lg text-center font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2 justify-end">المدة <Timer className="h-3 w-3" /></Label>
                      <Input type="number" placeholder="أيام" value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="h-14 rounded-2xl text-lg text-center font-bold" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateAIBid}
                        disabled={isGeneratingBidAI}
                        className="text-primary bg-primary/5 hover:bg-primary/10 border-primary/30 flex items-center gap-2 h-9 rounded-xl"
                      >
                        {isGeneratingBidAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        صياغة تقنية ذكية
                      </Button>
                      <Label className="font-bold">خطة العمل والوصف</Label>
                    </div>
                    <Textarea 
                      placeholder="صف خطواتك التقنية، قطع الغيار، وضمان الجودة..." 
                      value={bidDesc} 
                      onChange={(e) => setBidDesc(e.target.value)} 
                      className="min-h-[180px] rounded-2xl p-4 leading-relaxed text-sm bg-muted/20" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 leading-tight">نصيحة: اكتب رؤوس أقلام ثم استخدم الصياغة الذكية لتحويلها لعرض احترافي متكامل.</p>
                  </div>

                  <Button className="w-full h-16 text-xl font-black rounded-[1.5rem] shadow-2xl shadow-primary/30 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleSendBid} disabled={isSubmittingBid || !bidPrice || !bidDays}>
                    {isSubmittingBid ? <Loader2 className="h-6 w-6 animate-spin" /> : 'إرسال عرضي الآن'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {request.status !== 'open' && (
              <Card className="bg-primary/5 border-primary/20 rounded-3xl shadow-inner border-2">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <ShieldAlert className="h-10 w-10 text-primary" />
                  </div>
                  <h4 className="font-black text-xl">حالة الطلب: {request.status === 'assigned' ? 'تم الإسناد والعمل جاري' : 'مكتمل ومغلق'}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">هذا الطلب في مرحلة التنفيذ النهائية ولا يقبل عروضاً جديدة حالياً.</p>
                </CardContent>
              </Card>
            )}
            
            <Card className="rounded-3xl border-none bg-slate-900 text-white overflow-hidden">
               <div className="p-6 text-right space-y-4">
                  <h4 className="font-bold flex items-center gap-2 justify-end">نصائح القبول <Info className="h-4 w-4" /></h4>
                  <ul className="text-xs space-y-2 opacity-80 leading-relaxed">
                     <li>• اجعل وصفك التقني دقيقاً ومفصلاً.</li>
                     <li>• ركز على معايير الأمان والمعايرة الطبية.</li>
                     <li>• السعر المنطقي يبعث على الثقة أكثر من السعر المتدني جداً.</li>
                  </ul>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
