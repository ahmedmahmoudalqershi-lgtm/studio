
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Stethoscope, 
  Search, 
  Trash2, 
  History, 
  ClipboardCheck, 
  Calendar,
  AlertCircle,
  Wrench
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DevicesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<string | null>(null);

  const [newDevice, setNewDevice] = useState({
    deviceName: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    specialization: 'General',
  });

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'devices'), where('hospitalId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: devices, isLoading } = useCollection(devicesQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDeviceForHistory) return null;
    return query(collection(firestore, 'maintenanceRequests'), where('deviceId', '==', selectedDeviceForHistory));
  }, [firestore, selectedDeviceForHistory]);

  const { data: deviceHistory, isLoading: historyLoading } = useCollection(historyQuery);

  const filteredDevices = devices?.filter(d => 
    d.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDevice = () => {
    if (!user || !firestore || !newDevice.deviceName) return;
    
    const deviceData = {
      ...newDevice,
      hospitalId: user.uid,
      status: 'operational',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'devices'), deviceData);
    setIsAdding(false);
    setNewDevice({ deviceName: '', model: '', serialNumber: '', manufacturer: '', specialization: 'General' });
    
    toast({ title: "تم تسجيل الجهاز", description: "تمت إضافة الجهاز الطبي الجديد بنجاح." });
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'devices', deviceId));
    toast({ title: "تم الحذف", description: "تمت إزالة الجهاز من سجلاتك." });
  };

  return (
    <Shell>
      <div className="space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary tracking-tight">الأجهزة الطبية</h1>
            <p className="text-muted-foreground">أدر أسطولك الطبي وتابع دورات الصيانة لكل جهاز.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-xl h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5" /> تسجيل جهاز جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-xl font-black">تسجيل جهاز جديد</DialogTitle>
                <DialogDescription className="text-right">أدخل تفاصيل الجهاز بدقة لتسهيل عملية الصيانة لاحقاً.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-right">
                  <Label className="font-bold">اسم الجهاز</Label>
                  <Input placeholder="مثال: جهاز رنين مغناطيسي" value={newDevice.deviceName} onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})} className="rounded-xl h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label className="font-bold">الموديل</Label>
                    <Input placeholder="V2.0" value={newDevice.model} onChange={(e) => setNewDevice({...newDevice, model: e.target.value})} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="font-bold">الرقم التسلسلي</Label>
                    <Input placeholder="SN-XXXX" value={newDevice.serialNumber} onChange={(e) => setNewDevice({...newDevice, serialNumber: e.target.value})} className="rounded-xl h-11" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">الشركة المصنعة</Label>
                  <Input placeholder="GE, Philips, Siemens..." value={newDevice.manufacturer} onChange={(e) => setNewDevice({...newDevice, manufacturer: e.target.value})} className="rounded-xl h-11" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice} className="w-full h-12 rounded-xl text-lg font-bold">حفظ بيانات الجهاز</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="ابحث باسم الجهاز أو الرقم التسلسلي..." 
            className="pr-12 h-14 rounded-2xl text-right shadow-sm border-2 focus:border-primary/50 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices?.map(device => (
              <Card key={device.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all rounded-[2.5rem] bg-white group">
                <div className={cn("h-3 w-full", device.status === 'operational' ? "bg-green-500" : "bg-destructive")} />
                <CardHeader className="pb-4 text-right">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={device.status === 'operational' ? 'secondary' : 'destructive'} className="rounded-full px-4 py-1 text-[10px] font-bold">
                      {device.status === 'operational' ? 'يعمل بكفاءة' : 'يتطلب صيانة'}
                    </Badge>
                    <div className="bg-primary/5 p-3 rounded-[1.25rem] group-hover:scale-110 transition-transform">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">{device.deviceName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-right">
                  <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border-2 border-transparent hover:border-muted-foreground/10 transition-colors">
                    <p className="font-black text-foreground mb-1">{device.manufacturer} <span className="text-muted-foreground font-normal">|</span> {device.model}</p>
                    <p className="flex items-center gap-2 justify-end">S/N: <span className="font-code text-primary/80">{device.serialNumber}</span></p>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 rounded-xl h-11 gap-2 border-2 hover:bg-primary/5"
                          onClick={() => setSelectedDeviceForHistory(device.id)}
                        >
                          <History className="h-4 w-4" /> السجل الطبي
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right text-2xl font-black flex items-center gap-3 justify-end">
                            <span>تاريخ صيانة {device.deviceName}</span>
                            <ClipboardCheck className="h-6 w-6 text-primary" />
                          </DialogTitle>
                          <DialogDescription className="text-right">مراجعة كاملة لجميع الأعطال والإصلاحات السابقة لهذا الجهاز.</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[450px] overflow-y-auto space-y-4 py-6 pr-1 custom-scrollbar">
                          {historyLoading ? (
                            <Skeleton className="h-24 w-full rounded-2xl" />
                          ) : deviceHistory && deviceHistory.length > 0 ? (
                            deviceHistory.map(req => (
                              <div key={req.id} className="p-5 border-2 rounded-2xl bg-muted/5 hover:bg-white hover:border-primary/20 transition-all text-right group/item">
                                <div className="flex justify-between items-center mb-3">
                                  <Badge className={cn(
                                    "rounded-lg px-2 text-[10px]",
                                    req.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                  )}>
                                    {req.status === 'completed' ? 'عملية مكتملة' : 'طلب نشط'}
                                  </Badge>
                                  <p className="font-black text-lg group-hover/item:text-primary transition-colors">{req.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{req.description}</p>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-4 pt-3 border-t justify-end">
                                  <span className="flex items-center gap-1 font-bold"><Calendar className="h-3 w-3" /> {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : '---'}</span>
                                  <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {req.status === 'completed' ? 'تم الإصلاح' : 'قيد المعالجة'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                              <AlertCircle className="h-12 w-12 opacity-10" />
                              <p className="font-bold">لا توجد سجلات صيانة لهذا الجهاز حتى الآن.</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-destructive rounded-xl h-11 w-11 hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteDevice(device.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDevices?.length === 0 && !isLoading && (
              <div className="col-span-full py-32 text-center bg-muted/10 rounded-[3rem] border-4 border-dashed border-muted/50">
                <Stethoscope className="h-20 w-20 text-muted-foreground/10 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-muted-foreground">لا توجد أجهزة مطابقة</h3>
                <p className="text-muted-foreground/60 mt-2">جرب البحث بكلمات مختلفة أو أضف جهازاً جديداً.</p>
                <Button variant="outline" className="mt-8 rounded-xl px-8" onClick={() => setSearchTerm('')}>إعادة ضبط البحث</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
