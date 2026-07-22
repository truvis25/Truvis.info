import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Truvis.info — Verified Business Network",
    short_name: "Truvis.info",
    description:
      "Discover compliance-verified organizations, their products and services, events, and business opportunities.",
    start_url: "/",
    display: "standalone",
    background_color: "#fefefe",
    theme_color: "#023059",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
