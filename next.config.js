/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your existing settings
  eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },

  // Tell Next exactly what the project root is to stop the workspace-root warning
  // (especially useful if there's a stray package-lock.json in your HOME folder)
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
