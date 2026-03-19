
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
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
  CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { analyzeBids } from '@/ai/flows/analyze-bids';

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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const requestRef = useMemoFirebase(() => firestore ? doc(firestore, 'maintenanceRequests', requestId as string) : null, [firestore, requestId]);
  const { data: request, isLoading: requestLoading } = useDoc(requestRef);

  const bidsQuery = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return query(collection(firestore, 'maintenanceRequests', requestId as string, 'bids'));
  }, [firestore, requestId]);
  
  const { data: bids, isLoading: bidsLoading } = useCollection(bidsQuery);

  // تحديد دور المستخدم بناءً على الإيميل (تبسيط للـ MVP)
  // في الحقيقي نحتاج لجلب الـ role من مجموعة users
  const isHospital = true; // مؤقت لتمكين ميزة التحليل

  async function handleAnalyzeBids() {
    if (!bids || bids.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // تجهيز البيانات للذكاء الاصطناعي
      // نحتاج لجلب أسماء المهندسين وتقييماتهم (هنا نستخدم بيانات افتراضية للسرعة)
      const inputBids = bids.map(b => ({
        engineerName: "مهندس متخصص", // في الحقيقي نجلب الاسم من engineerProfiles
        price: b.price,
        estimatedDays: b.estimatedDays,
        description: b.description,
        rating: 4.5
      }));

      const result = await analyzeBids({
        requestTitle: request?.title || "طلب صيانة",
        requestDescription: request?.description || "",
        bids: inputBids
      });

      setAiAnalysis(result);
      toast({
        title: "تم التحليل بنجاح",
        description: "ساعدك الذكاء الاصطناعي في مقارنة العروض المتاحة.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في التحليل",
        description: "تعذر تحليل العروض حالياً، يرجى المحاولة لاحقاً.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSendBid() {
    if (!user || !requestId || !firestore) return;
    
    setIsSubmittingBid(true);
    const bidData = {
      engineerId: user.uid,
      price: Number(bidPrice),
      estimatedDays: Number(bidDays),
      description: bidDesc,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const bidsCol = collection(firestore, 'maintenanceRequests', requestId as string, 'bids');
    addDocumentNonBlocking(bidsCol, bidData);
    
    toast({
      title: "تم تقديم العرض",
      description: "سيصل إشعار للمستشفى بتقديمك لهذا العرض.",
    });
    router.push('/dashboard');
  }

  if (requestLoading) {
    return (
      <Shell role="hospital">
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Shell>
    );
  }

  if (!request) {
    return (
      <Shell role="hospital">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">الطلب غير موجود</h2>
          <Button onClick={() => router.back()} className="mt-4">العودة</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell role="hospital">
      <div className="max-w-5xl mx-auto space-y-8" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{request.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              تاريخ الطلب: {request.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'اليوم'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-primary/5 p-6 border-b border-primary/10">
                <div className="flex justify-between items-center">
                  <Badge variant={request.urgency === 'critical' ? 'destructive' : 'outline'}>
                    الأهمية: {request.urgency === 'critical' ? 'حرج' : 'عادي'}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    حالة الطلب: {request.status === 'open' ? 'مفتوح للمزايدة' : 'تم الإسناد'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" /> تفاصيل المشكلة
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
                
                <div className="pt-6 border-t grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">نوع الجهاز</p>
                    <p className="font-bold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" /> {request.deviceName || 'جهاز طبي'}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">موقع الصيانة</p>
                    <p className="font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> الرياض، المركز الرئيسي
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* قسم العروض للمستشفى */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">العروض المقدمة ({bids?.length || 0})</h2>
                {bids && bids.length > 0 && (
                  <Button 
                    onClick={handleAnalyzeBids} 
                    disabled={isAnalyzing}
                    className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md"
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    تحليل العروض بالذكاء الاصطناعي
                  </Button>
                )}
              </div>

              {aiAnalysis && (
                <Card className="border-2 border-secondary/30 bg-secondary/5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <CardHeader className="bg-secondary/10 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-secondary" /> توصية المساعد الذكي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-white p-4 rounded-xl border-l-4 border-l-secondary shadow-sm">
                      <p className="font-bold text-secondary mb-1">الخيار الأفضل المقترح:</p>
                      <p className="text-lg font-black">{aiAnalysis.bestOption.engineerName}</p>
                      <p className="text-sm text-muted-foreground mt-2">{aiAnalysis.bestOption.reason}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="font-bold text-sm mb-1">ملخص المقارنة:</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1">تحليل المخاطر:</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.riskAnalysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {bids?.map((bid) => (
                  <Card key={bid.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              <User className="h-4 w-4" />
                            </div>
                            <p className="font-bold">مهندس معتمد</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{bid.description}</p>
                        </div>
                        <div className="text-left space-y-2 min-w-[120px]">
                          <p className="text-2xl font-black text-primary">{bid.price} <span className="text-xs font-normal">ر.س</span></p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> مدة العمل: {bid.estimatedDays} أيام
                          </p>
                          <Button size="sm" className="w-full">قبول العرض</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!bids || bids.length === 0) && (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <Clock className="h-10 w-10 text-muted/30 mx-auto mb-2" />
                    <p className="text-muted-foreground italic">لا توجد عروض مقدمة بعد.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-lg">تقديم عرض صيانة</CardTitle>
                <CardDescription>هذا الجزء مخصص للمهندسين الراغبين في تقديم عروضهم.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">السعر التقديري (ر.س)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المدة المتوقعة (أيام)</label>
                  <Input 
                    type="number" 
                    placeholder="مثال: 3" 
                    value={bidDays}
                    onChange={(e) => setBidDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تفاصيل العرض</label>
                  <Textarea 
                    placeholder="اشرح كيف ستقوم بحل المشكلة..." 
                    className="h-24"
                    value={bidDesc}
                    onChange={(e) => setBidDesc(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full h-12 gap-2" 
                  onClick={handleSendBid}
                  disabled={isSubmittingBid || !bidPrice || !bidDays}
                >
                  {isSubmittingBid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  إرسال العرض الآن
                </Button>
              </CardContent>
            </Card>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" /> نصيحة للمهندسين
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                المستشفيات تستخدم الذكاء الاصطناعي لتحليل العروض. تأكد من كتابة تفاصيل تقنية دقيقة وسعر منافس لزيادة فرص قبول عرضك.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
