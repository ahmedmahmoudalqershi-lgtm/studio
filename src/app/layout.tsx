
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';
import Image from 'next/image';

// رابط الشعار الجديد (المنصة المتقدمة للهندسة الطبية)
const APP_LOGO_URL = `https://picsum.photos/seed/med-platform/800/800`;

export const viewport: Viewport = {
  themeColor: '#2862B4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'صيانة بلس | المنصة المتقدمة للهندسة الطبية',
  description: 'النظام المتكامل لإدارة صيانة الأجهزة الطبية في المستشفيات وربطها بالمهندسين المعتمدين.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'صيانة بلس',
  },
  icons: {
    icon: APP_LOGO_URL,
    apple: APP_LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen flex flex-col relative overflow-x-hidden">
        {/* العلامة المائية في الخلفية */}
        <div className="fixed inset-0 -z-50 pointer-events-none flex items-center justify-center opacity-[0.03]">
          <Image 
            src={APP_LOGO_URL} 
            alt="Watermark" 
            width={600} 
            height={600} 
            className="object-contain"
          />
        </div>

        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
        
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('Service Worker registered with scope:', registration.scope);
                }).catch(function(err) {
                  console.log('Service Worker registration failed:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
