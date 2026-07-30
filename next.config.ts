import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Listing/media images now come from Cloudinary (lib/image/cloudinary.ts)
      // rather than Supabase Storage — every next/image render of an
      // uploaded photo needs this or it throws at render time ("hostname
      // is not configured under images in next.config.js"). CNIC uploads
      // are unaffected (app/api/upload/cnic still writes to Supabase
      // Storage's private-documents bucket and is never rendered via
      // next/image).
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
