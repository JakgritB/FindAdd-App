import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FindAdd - ค้นหาและเพิ่มสถานที่บนแผนที่',
  description: 'ระบบค้นหาและเพิ่มสถานที่บนแผนที่ด้วย Longdo Map API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>{children}</body>
    </html>
  );
}