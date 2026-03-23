
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Hospital, ShieldCheck, Activity, Globe, Users, Zap } from 'lucide-react';

const APP_LOGO_URL = `/logo.png`;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent selection:bg-primary selection:text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 overflow-hidden">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl z-10">
          <div className="relative mx-auto w-56 h-56 rounded-[2.5rem] bg-white p-2 shadow-2xl shadow-primary/20 transform hover:rotate-2 transition-transform cursor-pointer overflow-hidden border">
            <Image 
              src={APP_LOGO_URL} 
              alt="المنصة المتقدمة للهندسة الطبية" 
              fill 
              className="object-contain" 
              priority
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
