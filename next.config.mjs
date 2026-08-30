/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@fullcalendar/react",
    "@fullcalendar/core",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/multimonth",
  ],
  webpack: (config) => {
    // @fullcalendar packages declare "sideEffects": false, which causes webpack
    // to tree-shake away their runtime CSS injection. Disable that optimization
    // outright rather than relying on a rule override, which wasn't sufficient.
    config.optimization.sideEffects = false;
    return config;
  },
};

export default nextConfig;
