import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateMetadata() {
  notFound();
}

export default function LiveByUsernamePage() {
  notFound();
}
