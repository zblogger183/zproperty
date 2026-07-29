import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Explicit even though `sharp` is already in Next's own default
  // server-external-packages list — keeps it opted out of bundling if that
  // default ever changes.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
