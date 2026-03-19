
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
  Settings, 
  AlertCircle,
  Trash2
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
    
    toast({
      title: "تمت إضافة الجهاز",
      description: "تم تسجيل الجهاز الجديد في قاعدة البيانات بنجاح.",
    });
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'devices', deviceId));
    toast({
      title: "تم حذف الجهاز",
      description: "تمت إزالة الجهاز من قائمتك.",
    });
  };

  return (
    <Shell role="hospital">
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-right">إدارة الأجهزة الطبية</h1>
            <p className="text-muted-foreground text-right">قم بتسجيل ومتابعة حالة جميع أجهزتك الطبية.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> إضافة جهاز جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">تسجيل جهاز جديد</DialogTitle>
                <DialogDescription className="text-right">
                  أدخل تفاصيل الجهاز الطبي لإضافته إلى قائمة الأصول.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right block">اسم الجهاز</Label>
                  <Input 
                    id="name" 
                    placeholder="مثال: جهاز رنين مغناطيسي" 
                    value={newDevice.deviceName}
                    onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="model">الموديل</Label>
                    <Input 
                      id="model" 
                      placeholder="v2.0" 
                      value={newDevice.model}
                      onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="sn">الرقم التسلسلي</Label>
                    <Input 
                      id="sn" 
                      placeholder="SN-12345" 
                      value={newDevice.serialNumber}
                      onChange={(e) => setNewDevice({...newDevice, serialNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="manufacturer">الشركة المصنعة</Label>
                  <Input 
                    id="manufacturer" 
                    placeholder="GE, Philips, etc." 
                    value={newDevice.manufacturer}
                    onChange={(e) => setNewDevice({...newDevice, manufacturer: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice} className="w-full">حفظ الجهاز</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث باسم الجهاز أو الرقم التسلسلي..." 
            className="pr-10 h-12 rounded-xl text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices?.map(device => (
              <Card key={device.id} className="overflow-hidden border-none shadow-md group hover:shadow-xl transition-all">
                <div className={cn(
                  "h-2 w-full",
                  device.status === 'operational' ? "bg-green-500" : "bg-destructive"
                )} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={device.status === 'operational' ? 'secondary' : 'destructive'}>
                      {device.status === 'operational' ? 'يعمل بكفاءة' : 'بحاجة لصيانة'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-right">{device.deviceName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm text-right">
                    <div className="font-medium">{device.manufacturer}</div>
                    <div className="text-muted-foreground">:الشركة</div>
                    <div className="font-medium">{device.serialNumber}</div>
                    <div className="text-muted-foreground">:الرقم التسلسلي</div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Settings className="h-3 w-3" /> سجل الصيانة
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDevices?.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed rounded-3xl">
                <AlertCircle className="h-12 w-12 text-muted/20 mx-auto" />
                <p className="text-xl text-muted-foreground">لا توجد أجهزة مسجلة حالياً.</p>
                <Button variant="outline" onClick={() => setIsAdding(true)}>أضف أول جهاز الآن</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
