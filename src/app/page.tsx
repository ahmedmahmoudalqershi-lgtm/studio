
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Hospital, ShieldCheck, Activity, Globe, Users, Zap } from 'lucide-react';

const APP_LOGO_URL = `https://picsum.photos/seed/med-platform-logo/800/800`;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent selection:bg-primary selection:text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 overflow-hidden">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl z-10">
          <div className="relative mx-auto w-40 h-40 rounded-[2.5rem] bg-white p-4 shadow-2xl shadow-primary/20 transform hover:rotate-6 transition-transform cursor-pointer overflow-hidden border">
            <Image 
              src={APP_LOGO_URL} 
              alt="صيانة بلس" 
              fill 
              className="object-contain p-2" 
              data-ai-hint="medical logo"
            />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black font-headline tracking-tighter text-primary leading-tight">
            المنصة المتقدمة <br /> <span className="text-secondary">للهندسة الطبية</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            النظام المتكامل والأكثر ذكاءً لربط المستشفيات بنخبة المهندسين المعتمدين. جودة، سرعة، وموثوقية فائقة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 z-10">
          <Link href="/login">
            <Button size="lg" className="w-full h-28 text-xl flex flex-col gap-2 rounded-[2rem] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
              <Hospital className="h-8 w-8 group-hover:animate-bounce" />
              <div className="flex flex-col">
                <span>بوابة المستشفيات</span>
                <span className="text-[10px] opacity-70 font-normal">سجل أجهزتك واطلب الصيانة فوراً</span>
              </div>
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full h-28 text-xl flex flex-col gap-2 rounded-[2rem] border-4 border-primary/20 bg-white/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group">
              <ShieldCheck className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col">
                <span>بوابة المهندسين</span>
                <span className="text-[10px] opacity-70 font-normal text-muted-foreground text-right">قدم عروضك وابدأ العمل</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Stats / Trust Bar */}
        <div className="flex flex-wrap justify-center gap-8 py-8 animate-in fade-in duration-1000 delay-500 z-10">
          <div className="flex items-center gap-2 text-primary/60 font-bold">
            <Globe className="h-5 w-5" />
            <span>متاح في كافة المدن</span>
          </div>
          <div className="flex items-center gap-2 text-primary/60 font-bold">
            <Users className="h-5 w-5" />
            <span>+500 مهندس معتمد</span>
          </div>
          <div className="flex items-center gap-2 text-primary/60 font-bold">
            <Zap className="h-5 w-5" />
            <span>دعم فوري متميز</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-right animate-in fade-in duration-1000 delay-700 w-full max-w-6xl z-10">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 border-transparent hover:border-primary/10 shadow-xl shadow-slate-200/50 space-y-4 transition-all">
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-black text-2xl text-primary">إدارة ذكية للأصول</h3>
            <p className="text-muted-foreground leading-relaxed">تابع الحالة الفنية لأسطول أجهزتك الطبية، واحصل على تنبيهات الصيانة الدورية تلقائياً.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 border-transparent hover:border-primary/10 shadow-xl shadow-slate-200/50 space-y-4 transition-all">
            <div className="bg-cyan-100 w-12 h-12 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-black text-2xl text-primary">توثيق احترافي</h3>
            <p className="text-muted-foreground leading-relaxed">جميع المهندسين في المنصة يخضعون لعملية تدقيق صارمة لضمان أعلى مستويات الكفاءة والأمان.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 border-transparent hover:border-primary/10 shadow-xl shadow-slate-200/50 space-y-4 transition-all">
            <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center">
               <div className="relative w-7 h-7">
                 <Image src={APP_LOGO_URL} alt="AI" fill className="object-contain" />
               </div>
            </div>
            <h3 className="font-black text-2xl text-primary">المنصة المتقدمة</h3>
            <p className="text-muted-foreground leading-relaxed">نظام متكامل يجمع بين الخبرة البشرية والذكاء البرمجي لضمان أفضل تشخيص وأسرع إصلاح.</p>
          </div>
        </div>
      </section>

      <footer className="p-8 text-center border-t bg-white/90 backdrop-blur-md z-10">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} صيانة بلس الطبية. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6 font-bold">
            <Link href="#" className="hover:text-primary">الشروط والأحكام</Link>
            <Link href="#" className="hover:text-primary">سياسة الخصوصية</Link>
            <Link href="#" className="hover:text-primary">تواصل معنا</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
