import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // On Vercel, request body is capped at 4.5MB regardless of this setting.
      // On K8s/self-hosted, this allows large file uploads via server actions.
      bodySizeLimit: process.env.VERCEL ? "4mb" : "256mb",
    },
  },
  serverExternalPackages: [
    "prettier",
    "@react-email/render",
    "require-in-the-middle",
    "import-in-the-middle",
    "canvas",
    "sharp"
  ],
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/require-in-the-middle/ },
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/jose/ },
      { module: /node_modules\/better-auth/ },
    ]
    return config
  },
}

export default nextConfig
