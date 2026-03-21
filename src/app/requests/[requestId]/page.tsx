
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
  Target,
  UserCheck,
  Send,
  MessageCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { analyzeBids } from '@/ai/flows/analyze-bids';
import { troubleshootDevice, type TroubleshootOutput } from '@/ai/flows/troubleshoot-device';
import { generateBidDescription } from '@/ai/flows/generate-bid-description';
import { matchEngineers } from '@/ai/flows/match-engineers';
import { ChatSystem } from '@/components/requests/ChatSystem';
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
  const [isHiring, setIsHiring] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootOutput | null>(null);
  const [matchedEngineers, setMatchedEngineers] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // نظام التفاوض
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

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

  const handleHireEngineer = (engineerId: string, engineerName: string) => {
    if (!firestore || !request) return;
    setIsHiring(engineerId);
    
    try {
      updateDocumentNonBlocking(doc(firestore, 'maintenanceRequests', request.id), {
        status: 'assigned',
        assignedEngineerId: engineerId,
        updatedAt: serverTimestamp(),
      });

      addDocumentNonBlocking(collection(firestore, 'users', engineerId, 'notifications'), {
        userId: engineerId,
        message: `تهانينا! تم اختيارك وتوظيفك مباشرة لصيانة: ${request.title}`,
        type: 'direct_hiring',
        isRead: false,
        createdAt: serverTimestamp(),
      });

      toast({ 
        title: "تم الاختيار والتوظيف", 
        description: `تم إسناد المهمة للمهندس ${engineerName} بنجاح. سيتلقى إشعاراً للبدء فوراً.` 
      });
      
      setMatchedEngineers([]); 
      setActiveChat(null);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إكمال عملية التوظيف." });
    } finally {
      setIsHiring(null);
    }
  };

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
    if (!request || !allEngineers || allEngineers.length === 0) {
      toast({ title: "تنبيه", description: "لا يوجد مهندسين متاحين حالياً للمطابقة." });
      return;
    }
    setIsMatching(true);
    setMatchedEngineers([]); 
    try {
      const validEngineers = allEngineers.filter(e => e.id && e.fullName && e.specialization);
      const result = await matchEngineers({
        requestTitle: request.title,
        requestDescription: request.description,
        availableEngineers: validEngineers.map(e => ({
          id: e.id,
          fullName: e.fullName,
          specialization: e.specialization,
          yearsExperience: e.yearsExperience || 0,
          rating: e.rating || 5,
          totalJobs: e.totalJobs || 0
        }))
      });
      
      const enrichedMatches = result.recommendations
        .map(match => {
          const eng = allEngineers.find(e => e.id === match.engineerId);
          if (!eng) return null;
          return { 
            id: eng.id,
            fullName: eng.fullName,
            specialization: eng.specialization,
            rating: eng.rating,
            matchScore: match.matchScore,
            reason: match.reason
          };
        })
        .filter(m => m !== null);

      if (enrichedMatches.length > 0) {
        setMatchedEngineers(enrichedMatches);
        toast({ title: "تمت المطابقة", description: "تم العثور على أفضل المهندسين المناسبين لهذا الطلب." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل نظام المطابقة الذكي." });
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
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل توليد العرض." });
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
  if (!request) return <Shell><div className="text-center py-20"><h2 className="text-2xl font-bold">الطلب غير موجود</h2></div></Shell>;

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
                  {request.status === 'open' ? 'مفتوح للتفاوض' : request.status === 'assigned' ? 'قيد العمل' : 'مكتمل'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(isOwner || isAdmin) && request.status === 'open' && (
              <Button variant="outline" onClick={handleSmartMatch} disabled={isMatching} className="gap-2 border-emerald-500 text-emerald-600 rounded-xl">
                {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                مطابقة واقتراح مهندسين
              </Button>
            )}
            {isOwner && request.status === 'assigned' && (
              <Button onClick={handleCompleteJob} className="bg-green-600 hover:bg-green-700 gap-2 rounded-xl">
                <CheckCircle2 className="h-4 w-4" /> إتمام وتقييم المهمة
              </Button>
            )}
          </div>
        </div>

        {activeChat && (
          <div className="fixed bottom-24 left-6 z-50 w-full max-w-md">
            <ChatSystem 
              requestId={requestId as string}
              engineerId={activeChat.id}
              engineerName={activeChat.name}
              onClose={() => setActiveChat(null)}
            />
          </div>
        )}

        {matchedEngineers.length > 0 && (isOwner || isAdmin) && (
          <div className="bg-emerald-50/50 p-8 rounded-[3rem] border-2 border-emerald-100 space-y-6">
            <div className="flex items-center gap-3 justify-end text-emerald-800 text-right">
              <div>
                <h2 className="text-2xl font-black">أفضل المهندسين المناسبين</h2>
                <p className="text-xs opacity-70">ابدأ التفاوض معهم للوصول لأفضل اتفاق قبل التوظيف.</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-2xl"><Sparkles className="h-6 w-6" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {matchedEngineers.map((eng) => (
                <Card key={eng.id} className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                  <CardContent className="p-6 text-right flex-1 flex flex-col">
                    <Badge className="bg-emerald-500 px-4 py-1.5 font-black text-xs rounded-full w-fit mb-4">{eng.matchScore}% مطابقة</Badge>
                    <p className="font-black text-xl text-emerald-900">م. {eng.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">{eng.specialization}</p>
                    
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 mb-6 flex-1">
                      <p className="text-xs text-emerald-800 italic leading-relaxed">"{eng.reason}"</p>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <Button 
                        variant="outline"
                        onClick={() => setActiveChat({ id: eng.id, name: eng.fullName })}
                        className="w-full h-11 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100 gap-2 font-bold"
                      >
                        <MessageCircle className="h-4 w-4" /> بدء تفاوض دردشة
                      </Button>
                      <Button 
                        onClick={() => handleHireEngineer(eng.id, eng.fullName)}
                        disabled={isHiring !== null}
                        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold gap-2"
                      >
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
                <CardTitle className="text-xl font-bold">وصف العطل الطبي</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-right">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">{request.description}</p>
              </CardContent>
            </Card>

            <div className="space-y-4 text-right">
              <h2 className="text-2xl font-black">عروض الصيانة المقدمة</h2>
              <div className="space-y-4">
                {bids?.map(bid => (
                  <Card key={bid.id} className="hover:shadow-xl transition-all overflow-hidden border-none shadow-md rounded-3xl bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 text-right order-1 sm:order-2">
                          <p className="font-bold text-lg mb-2">مهندس متخصص</p>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-2xl">{bid.description}</p>
                          <div className="mt-4 flex items-center gap-4 justify-end">
                             <Badge variant="outline" className="text-primary font-black px-4">{bid.price} ر.س</Badge>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="gap-2 text-primary"
                               onClick={() => setActiveChat({ id: bid.engineerId, name: 'مقدم العرض' })}
                             >
                               <MessageCircle className="h-4 w-4" /> تفاوض بالدردشة
                             </Button>
                          </div>
                        </div>
                        {isOwner && request.status === 'open' && (
                          <div className="flex items-center justify-center sm:w-40 order-2 sm:order-1 pt-4 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l">
                            <Button className="w-full rounded-xl font-bold h-11" onClick={() => handleAcceptBid(bid)}>قبول العرض</Button>
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
          </div>
        </div>
      </div>
    </Shell>
  );
}
