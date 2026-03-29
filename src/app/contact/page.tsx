import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Have a question, issue, or suggestion? We'd love to hear from you.</p>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-foreground">Email:</span>{" "}
                <a href="mailto:hello@unmaskr.com" className="text-indigo-600 hover:underline">
                  hello@unmaskr.com
                </a>
              </div>
              <div>
                <span className="font-medium text-foreground">Forum:</span>{" "}
                Post in the{" "}
                <a href="/forum/s/general" className="text-indigo-600 hover:underline">
                  General Discussion
                </a>{" "}
                section.
              </div>
            </div>
            <p className="text-xs">We typically respond within 24–48 hours.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
