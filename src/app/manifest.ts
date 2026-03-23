
import { MetadataRoute } from 'next'

// استخدام رمز المفتاح التقني كأيقونة للتطبيق القابل للتثبيت
const ICON_URL = 'https://img.icons8.com/fluency/240/key.png';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'صيانة بلس | نظام صيانة الأجهزة الطبية',
    short_name: 'صيانة بلس',
    description: 'النظام المتكامل لإدارة صيانة الأجهزة الطبية في المستشفيات.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#E7EBF3',
    theme_color: '#2862B4',
    orientation: 'portrait',
    icons: [
      {
        src: ICON_URL,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: ICON_URL,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
