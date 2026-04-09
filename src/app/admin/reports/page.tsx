import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect /admin/reports → /forum/reports (the existing reports page)
export default async function AdminReportsRedirect() {
  redirect("/forum/reports");
}
