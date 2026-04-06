import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Cho phép build thành công ngay cả khi có lỗi TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua ESLint khi build production
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
