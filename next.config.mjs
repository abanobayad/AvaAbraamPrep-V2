/** @type {import('next').NextConfig} */
const nextConfig = {
  // src/instrumentation.ts (stable in Next 15) applies database migrations and
  // creates the first superadmin when the server starts.
  experimental: {
    // Few build workers: the app has a handful of static pages and builds on
    // memory-limited shared hosting, where the default (one worker per CPU) can crash.
    cpus: 2,
  },
};

export default nextConfig;
