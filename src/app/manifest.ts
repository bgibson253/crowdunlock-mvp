import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unmaskr",
    short_name: "Unmaskr",
    description:
      "Crowdfunded content unlocking — fund the reveals that matter to you.",
    start_url: "/browse",
    display: "standalone",
    background_color: "#1a1a2e",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
