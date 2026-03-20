
import { MetadataRoute } from 'next'

// استخدام أيقونات PNG حقيقية لضمان قبول التثبيت كـ WebAPK على أندرويد
const ICON_192 = 'https://img.icons8.com/fluency/192/medical-doctor.png';
const ICON_512 = 'https://img.icons8.com/fluency/512/medical-doctor.png';

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
        src: ICON_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
