
import { MetadataRoute } from 'next'

const APP_ICON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232862B4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/%3E%3Ccircle cx='12' cy='12' r='10' stroke-opacity='0.1'/%3E%3C/svg%3E`;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'صيانة بلس الطبية',
    short_name: 'صيانة بلس',
    description: 'نظام متكامل لإدارة صيانة الأجهزة الطبية',
    start_url: '/',
    display: 'standalone',
    background_color: '#E7EBF3',
    theme_color: '#2862B4',
    icons: [
      {
        src: APP_ICON_SVG,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: APP_ICON_SVG,
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: APP_ICON_SVG,
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
