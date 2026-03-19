
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wrench, Hospital, ShieldCheck, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="bg-primary mx-auto w-20 h-20 rounded-3xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30">
            <Wrench className="h-10 w-10" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black font-headline tracking-tight text-primary">
            مساعد صيانة <br /> <span className="text-secondary">الأجهزة الطبية</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            المنصة الذكية الأولى لربط المستشفيات مع نخبة مهندسي الصيانة الطبية المعتمدين.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <Link href="/login">
            <Button size="lg" className="w-full h-24 text-lg flex flex-col gap-2 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Hospital className="h-6 w-6" />
              أنا أمثل مستشفى
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full h-24 text-lg flex flex-col gap-2 rounded-2xl border-2 border-primary/20 bg-white/50 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
              <ShieldCheck className="h-6 w-6 text-primary" />
              أنا مهندس صيانة
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-right animate-in fade-in duration-1000 delay-500">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
            <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">تتبع مباشر</h3>
            <p className="text-sm text-muted-foreground">تابع حالة أجهزتك وجداول الصيانة الدورية في مكان واحد.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
            <div className="bg-cyan-100 w-10 h-10 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-bold text-lg">مهندسون معتمدون</h3>
            <p className="text-sm text-muted-foreground">فقط المهندسون ذوي الخبرة والمؤهلات الموثقة يمكنهم الانضمام.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
            <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg">دعم ذكي</h3>
            <p className="text-sm text-muted-foreground">استخدم الذكاء الاصطناعي لصياغة طلباتك بشكل تقني دقيق.</p>
          </div>
        </div>
      </section>

      <footer className="p-6 text-center border-t bg-white/50 text-sm text-muted-foreground">
        © {new Date().getFullYear()} مساعد صيانة الأجهزة الطبية. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
