/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enables src/instrumentation.ts, which applies database migrations and
    // creates the first superadmin when the server starts.
    instrumentationHook: true,
  },
};

export default nextConfig;
