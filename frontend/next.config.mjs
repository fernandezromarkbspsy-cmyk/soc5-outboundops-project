/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:8000'

    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/up', destination: `${apiOrigin}/up` },
    ]
  },
}

export default nextConfig
