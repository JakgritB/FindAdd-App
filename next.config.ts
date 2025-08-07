import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // เพิ่มการตั้งค่านี้เพื่อปิดการตรวจสอบ ESLint ระหว่างการ build
  eslint: {
    // คำเตือน: การตั้งค่านี้จะทำให้ build สำเร็จแม้ว่าจะมี ESLint error
    // ซึ่งอาจทำให้โค้ดมีปัญหาใน Production ได้
    ignoreDuringBuilds: true,
  },
  // เพิ่มการตั้งค่านี้เพื่อปิดการตรวจสอบ TypeScript ระหว่างการ build
  typescript: {
    // !! คำเตือน !!
    // การตั้งค่านี้จะทำให้ build สำเร็จแม้ว่าจะมี TypeScript error
    // ซึ่งอันตรายมากและอาจทำให้โค้ดทำงานผิดปกติ
    // !! คำเตือน !!
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;