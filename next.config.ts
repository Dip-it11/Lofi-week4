import type { NextConfig } from "next";

/**
 * Set NEXT_PUBLIC_BASE_PATH when the site is served from a sub-folder,
 * e.g. GitHub Pages project sites: https://<user>.github.io/<repo>/ → "/<repo>".
 * Leave it empty for a root domain (Cloudflare Pages, Vercel, <user>.github.io repos).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  // Static HTML export — deployable to GitHub Pages, Cloudflare Pages, Netlify or Vercel.
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
