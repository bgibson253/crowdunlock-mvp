import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  notFound();
}

export default function LiveDisabledPage() {
  notFound();
}
