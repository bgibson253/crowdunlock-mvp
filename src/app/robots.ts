import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://crowdunlock-mvp.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/admin/",
        "/test-admin",
        "/dashboard",
        "/dashboard/",
        "/profile/settings",
        "/profile/settings/",
        "/profile/delete",
        "/profile/delete/",
        "/messages",
        "/messages/",
        "/onboarding",
        "/onboarding/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
