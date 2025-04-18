import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // domains: ["fpnddnwljgdrgyelbsif.supabase.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fpnddnwljgdrgyelbsif.supabase.co",
      },
    ],
  },
};

export default nextConfig;
