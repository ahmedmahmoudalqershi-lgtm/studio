
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
import { Plus, Stethoscope, Search, Settings, AlertCircle, Trash2, History, ClipboardList } from 'lucide-react';
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
    if (!user || !firestore) return;
    
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
    
    toast({ title: "تمت إضافة الجهاز", description: "تم تسجيل الجهاز الجديد بنجاح." });
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'devices', deviceId));
    toast({ title: "تم حذف الجهاز", description: "تمت إزالة الجهاز من قائمتك." });
  };

  return (
    <Shell role="hospital">
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary">إدارة الأجهزة الطبية</h1>
            <p className="text-muted-foreground">سجل وتابع حالة أجهزتك وسجل صيانة كل منها.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg h-12 rounded-xl">
                <Plus className="h-4 w-4" /> إضافة جهاز جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">تسجيل جهاز جديد</DialogTitle>
                <DialogDescription className="text-right">أدخل تفاصيل الجهاز لإضافته لقاعدة البيانات.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2 text-right">
                  <Label>اسم الجهاز</Label>
                  <Input placeholder="مثال: جهاز رنين مغناطيسي" value={newDevice.deviceName} onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label>الموديل</Label>
                    <Input placeholder="v2.0" value={newDevice.model} onChange={(e) => setNewDevice({...newDevice, model: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>الرقم التسلسلي</Label>
                    <Input placeholder="SN-123" value={newDevice.serialNumber} onChange={(e) => setNewDevice({...newDevice, serialNumber: e.target.value})} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Label>الشركة المصنعة</Label>
                  <Input placeholder="GE, Philips, etc." value={newDevice.manufacturer} onChange={(e) => setNewDevice({...newDevice, manufacturer: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice} className="w-full h-12 rounded-xl">حفظ الجهاز</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث باسم الجهاز أو الرقم التسلسلي..." className="pr-10 h-12 rounded-xl text-right" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices?.map(device => (
              <Card key={device.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all rounded-[2rem]">
                <div className={cn("h-2 w-full", device.status === 'operational' ? "bg-green-500" : "bg-destructive")} />
                <CardHeader className="pb-2 text-right">
                  <div className="flex justify-between items-start">
                    <Badge variant={device.status === 'operational' ? 'secondary' : 'destructive'} className="rounded-lg">
                      {device.status === 'operational' ? 'يعمل' : 'بحاجة لصيانة'}
                    </Badge>
                    <div className="bg-primary/5 p-2 rounded-xl">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 font-black">{device.deviceName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-2xl">
                    <p className="font-bold text-foreground">{device.manufacturer} | {device.model}</p>
                    <p>S/N: {device.serialNumber}</p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 rounded-xl gap-2"
                          onClick={() => setSelectedDeviceForHistory(device.id)}
                        >
                          <History className="h-4 w-4" /> سجل الصيانة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-3xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right">سجل صيانة: {device.deviceName}</DialogTitle>
                          <DialogDescription className="text-right">قائمة بكافة طلبات الصيانة المرتبطة بهذا الجهاز.</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[400px] overflow-y-auto space-y-4 py-4 pr-1">
                          {historyLoading ? (
                            <Skeleton className="h-20 w-full rounded-2xl" />
                          ) : deviceHistory && deviceHistory.length > 0 ? (
                            deviceHistory.map(req => (
                              <div key={req.id} className="p-4 border rounded-2xl bg-muted/10 text-right space-y-1">
                                <div className="flex justify-between items-center">
                                  <Badge className={cn(
                                    req.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                  )}>
                                    {req.status === 'completed' ? 'مكتمل' : 'نشط'}
                                  </Badge>
                                  <p className="font-bold">{req.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                                <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1 justify-end">
                                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SA') : '---'} <ClipboardList className="h-3 w-3" />
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-muted-foreground italic">لا يوجد سجل صيانة لهذا الجهاز بعد.</div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" className="text-destructive rounded-xl hover:bg-destructive/10" onClick={() => handleDeleteDevice(device.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDevices?.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed">
                <Stethoscope className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                <p className="text-muted-foreground">لم يتم العثور على أجهزة مطابقة للبحث.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
