/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the studio's hosting is S3 + CloudFront (no Node server), so the
  // build is a folder of plain files in out/, like the live site. If you choose a
  // Next.js API route as the contact backend, remove this line and deploy to a
  // Node host (Vercel, Amplify, a container) instead. See src/lib/contact.ts.
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true }, // required by output: 'export'; images are pre-compressed WebP
  experimental: {
    // Tree-shake the barrel files so only the helpers we import get bundled.
    optimizePackageImports: ['@react-three/drei', '@react-three/postprocessing', 'framer-motion'],
  },
};

export default nextConfig;
