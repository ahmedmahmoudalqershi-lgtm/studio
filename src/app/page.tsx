
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Hospital, ShieldCheck, Activity, Globe, Users, Zap } from 'lucide-react';

const APP_LOGO_URL = `https://img.icons8.com/fluency/240/key.png`;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent selection:bg-primary selection:text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 overflow-hidden">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl z-10">
          <div className="relative mx-auto w-48 h-48 sm:w-60 sm:h-60 rounded-[3rem] bg-white p-6 shadow-2xl shadow-primary/20 transform hover:scale-105 transition-transform cursor-pointer border-4 border-primary/5 overflow-hidden">
            <Image 
              src={APP_LOGO_URL} 
              alt="شعار المنصة المتقدمة للهندسة الطبية" 
              fill 
              className="object-contain p-4" 
              priority
            />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black font-headline tracking-tighter text-primary leading-tight">
            صيانة بلس <br /> <span className="text-secondary text-4xl sm:text-5xl">للهندسة الطبية المتقدمة</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            النظام الاحترافي المتكامل لربط المستشفيات بنخبة المهندسين المعتمدين. كفاءة تشغيلية بلمسة تكنولوجية.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 z-10">
          <Link href="/login">
            <Button size="lg" className="w-full h-28 text-xl flex flex-col gap-2 rounded-[2.5rem] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
              <Hospital className="h-8 w-8 group-hover:animate-bounce" />
              <div className="flex flex-col">
                <span>بوابة المستشفيات</span>
                <span className="text-[10px] opacity-70 font-normal">إدارة الأصول وطلبات الصيانة</span>
              </div>
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full h-28 text-xl flex flex-col gap-2 rounded-[2.5rem] border-4 border-primary/20 bg-white/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group">
              <ShieldCheck className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col">
                <span>بوابة المهندسين</span>
                <span className="text-[10px] opacity-70 font-normal text-muted-foreground text-right">استكشاف الفرص وتقديم العروض</span>
              </div>
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-8 py-8 animate-in fade-in duration-1000 delay-500 z-10">
          <div className="flex items-center gap-2 text-primary/60 font-bold bg-white/50 px-4 py-2 rounded-full border">
            <Globe className="h-5 w-5 text-secondary" />
            <span>تغطية شاملة للمدن</span>
          </div>
          <div className="flex items-center gap-2 text-primary/60 font-bold bg-white/50 px-4 py-2 rounded-full border">
            <Users className="h-5 w-5 text-secondary" />
            <span>نخبة من المهندسين</span>
          </div>
          <div className="flex items-center gap-2 text-primary/60 font-bold bg-white/50 px-4 py-2 rounded-full border">
            <Zap className="h-5 w-5 text-secondary" />
            <span>دعم فني متواصل</span>
          </div>
        </div>
      </section>

      <footer className="p-8 text-center border-t bg-white/90 backdrop-blur-md z-10 mt-auto">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} صيانة بلس | المنصة المتقدمة للهندسة الطبية.</p>
          <div className="flex gap-6 font-bold">
            <Link href="#" className="hover:text-primary">الشروط</Link>
            <Link href="#" className="hover:text-primary">الخصوصية</Link>
            <Link href="#" className="hover:text-primary">تواصل معنا</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
