
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ShieldCheck, 
  Hospital, 
  Settings,
  Trash2,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection(usersRef);

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerifyUser = (userId: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      status: 'verified',
      updatedAt: serverTimestamp()
    });
    toast({ title: "تم توثيق الحساب", description: "يمكن للمستخدم الآن استخدام كافة ميزات المنصة كعضو موثق." });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      toast({ title: "تم حذف المستخدم", description: "تمت إزالة الحساب والبيانات المرتبطة من النظام." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المستخدم، يرجى المحاولة لاحقاً." });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1.5 px-3 py-1"><Settings className="h-3 w-3" /> مدير نظام</Badge>;
      case 'hospital': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5 px-3 py-1"><Hospital className="h-3 w-3" /> مستشفى</Badge>;
      case 'engineer': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1"><ShieldCheck className="h-3 w-3" /> مهندس معتمد</Badge>;
      default: return <Badge variant="outline" className="px-3 py-1">{role}</Badge>;
    }
  };

  return (
    <Shell>
      <div className="space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary tracking-tight">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">التحكم في العضويات، توثيق الحسابات، ومراقبة نشاط المنصة.</p>
          </div>
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span>يتطلب توثيق الحسابات مراجعة الهوية المهنية</span>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="ابحث بالبريد الإلكتروني أو الدور الوظيفي..." 
            className="pr-12 h-14 rounded-2xl text-right shadow-sm border-2 focus:border-primary/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-none">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-right py-6 font-black text-foreground">معلومات المستخدم</TableHead>
                <TableHead className="text-right py-6 font-black text-foreground">الدور الوظيفي</TableHead>
                <TableHead className="text-right py-6 font-black text-foreground">تاريخ الانضمام</TableHead>
                <TableHead className="text-right py-6 font-black text-foreground">حالة التوثيق</TableHead>
                <TableHead className="text-center py-6 font-black text-foreground">التحكم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-24 mx-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers?.map(user => (
                  <TableRow key={user.id} className="hover:bg-primary/5 transition-all group">
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 font-bold"><Mail className="h-3.5 w-3.5 text-primary/60" /> {user.email}</span>
                        <span className="text-[10px] text-muted-foreground font-code opacity-60">UID: {user.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="py-4">
                      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '---'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {user.status === 'verified' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5" /> موثق
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-1 rounded-full w-fit">
                          <Clock className="h-3.5 w-3.5" /> قيد المراجعة
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {user.status !== 'verified' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:bg-primary/10 rounded-xl gap-2 h-9 px-4 font-bold border border-primary/20"
                            onClick={() => handleVerifyUser(user.id)}
                          >
                            <UserCheck className="h-4 w-4" /> توثيق
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl h-9 w-9">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl" className="rounded-[2rem] p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-right text-2xl font-black">تأكيد حذف الحساب</AlertDialogTitle>
                              <AlertDialogDescription className="text-right text-lg mt-2">
                                أنت على وشك حذف حساب <span className="font-bold text-foreground">{user.email}</span> بشكل نهائي. سيؤدي هذا لإزالة كافة البيانات والطلبات المرتبطة بهذا الحساب.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-8 gap-4">
                              <AlertDialogCancel className="rounded-xl h-12 flex-1">تراجع عن الإجراء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12 flex-1 font-bold">تأكيد الحذف النهائي</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {filteredUsers?.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-muted-foreground italic bg-muted/5">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="h-16 w-16 opacity-10" />
                      <p className="text-xl">لا يوجد مستخدمون مطابقون لمعايير البحث.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Shell>
  );
}
