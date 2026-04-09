import type { Metadata } from "next";
import { DmcaForm } from "@/components/dmca/dmca-form";

export const metadata: Metadata = {
  title: "DMCA Takedown Notice",
  description: "Submit a DMCA takedown notice to report copyright infringement on Unmaskr.",
};

export default function DmcaPage() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">DMCA Takedown Notice</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            If you believe content on Unmaskr infringes your copyright, you can submit a DMCA
            takedown notice using the form below. We take intellectual property rights seriously
            and will respond to valid notices within 48 hours.
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert mb-8">
          <h2 className="text-lg font-semibold">Before You File</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Ensure the content actually infringes your copyright. Fair use, commentary, and criticism are protected.</li>
            <li>Filing a false DMCA claim is perjury under federal law (17 U.S.C. § 512(f))</li>
            <li>Consider reaching out to the uploader directly first</li>
          </ul>
        </div>

        <DmcaForm />

        <div className="mt-10 pt-8 border-t border-border/50 prose prose-sm dark:prose-invert">
          <h2 className="text-lg font-semibold">Counter-Notice</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If your content was removed due to a DMCA notice and you believe the removal was in error
            or that you have the right to use the material, you may file a counter-notice. A valid
            counter-notice must include:
          </p>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>Your name, address, and phone number</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
            <li>Your consent to the jurisdiction of the federal court in your district</li>
            <li>Your physical or electronic signature</li>
          </ol>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Send counter-notices to{" "}
            <a href="mailto:legal@unmaskr.org" className="text-primary hover:underline">
              legal@unmaskr.org
            </a>
            . Upon receipt of a valid counter-notice, we will forward it to the original claimant.
            If the claimant does not file a court action within 10–14 business days, the content
            will be restored.
          </p>
        </div>
      </div>
    </div>
  );
}
