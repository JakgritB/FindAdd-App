import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 ปิด ESLint เวลา build
  },

  // ถ้ามี config อื่นอยู่แล้ว ให้เอามาไว้ด้วย เช่น:
  // reactStrictMode: true,
};

export default nextConfig;
