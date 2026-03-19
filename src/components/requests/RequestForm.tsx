
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { generateMaintenanceRequestDescription } from '@/ai/flows/generate-maintenance-description';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  deviceId: z.string({ required_error: "يرجى اختيار الجهاز" }),
  title: z.string().min(5, "العنوان قصير جداً"),
  urgency: z.string(),
  description: z.string().min(10, "الوصف يجب أن يكون مفصلاً"),
});

export function RequestForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'devices'), where('hospitalId', '==', user.uid));
  }, [firestore, user]);

  const { data: devices, isLoading: devicesLoading } = useCollection(devicesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      title: "",
      urgency: "medium",
      description: "",
    },
  });

  async function handleAIAssist() {
    const deviceId = form.getValues("deviceId");
    const title = form.getValues("title");

    if (!deviceId || !title) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى اختيار الجهاز وكتابة عنوان المشكلة أولاً لمساعدتك.",
      });
      return;
    }

    const device = devices?.find(d => d.id === deviceId);
    
    setIsGenerating(true);
    try {
      const result = await generateMaintenanceRequestDescription({
        deviceName: device?.deviceName || "جهاز طبي",
        reportedProblem: title,
      });
      form.setValue("description", result.detailedDescription);
      toast({
        title: "تم توليد الوصف",
        description: "قام الذكاء الاصطناعي بصياغة وصف مفصل لطلبك.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل الذكاء الاصطناعي في توليد الوصف.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const requestData = {
      hospitalId: user.uid,
      deviceId: values.deviceId,
      title: values.title,
      urgency: values.urgency,
      description: values.description,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'maintenanceRequests'), requestData);
    
    toast({
      title: "تم إرسال الطلب",
      description: "طلب الصيانة الخاص بك متاح الآن للمهندسين.",
    });
    router.push('/dashboard');
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          إرسال طلب صيانة جديد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الجهاز المتأثر</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={devicesLoading}>
                        <SelectValue placeholder={devicesLoading ? "جاري تحميل الأجهزة..." : "اختر الجهاز..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {devices?.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.deviceName} ({device.serialNumber})
                        </SelectItem>
                      ))}
                      {devices?.length === 0 && (
                        <SelectItem value="none" disabled>لا توجد أجهزة مسجلة</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المشكلة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: عطل في لوحة التحكم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى الأهمية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستوى الأهمية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="critical">حرج (يتطلب تدخل فوري)</SelectItem>
                      <SelectItem value="high">مرتفع</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>وصف المشكلة</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAIAssist}
                      disabled={isGenerating}
                      className="text-secondary-foreground bg-secondary/10 hover:bg-secondary/20 border-secondary/50 flex items-center gap-1"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      مساعدة الذكاء الاصطناعي
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="صف العطل بالتفصيل..." 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    اجعل الوصف دقيقاً لمساعدة المهندس في إعطاء عرض سعر أفضل.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 gap-2">
                <Save className="h-4 w-4" /> نشر الطلب
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
