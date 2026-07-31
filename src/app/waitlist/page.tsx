import { redirect } from "next/navigation";

// Pre-launch this app had a waitlist page; post-launch, anyone landing on an
// old /waitlist link should just be able to sign up for real.
export default function WaitlistPage() {
  redirect("/auth");
}
