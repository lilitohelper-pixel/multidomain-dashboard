export default function manifest() {
  return {
    name: "Lilito",
    short_name: "Lilito",
    description: "Tasks, expenses, and calendar — captured by chat, organized here.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f2f0e1",
    theme_color: "#16281f",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
