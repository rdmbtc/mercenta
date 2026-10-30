import type { Metadata, Viewport } from 'next';
import { TgApp } from '@/components/telegram/TgApp';

export const metadata: Metadata = {
  title: 'Mercenta Store | Telegram Web App',
  description: 'Buy gaming cards, subscriptions and compute vouchers with native USDC on Arc Network inside Telegram.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07080b',
};

export default function TelegramPage() {
  return <TgApp />;
}
