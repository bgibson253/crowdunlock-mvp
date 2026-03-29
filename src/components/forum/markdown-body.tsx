"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VideoEmbed, isVideoUrl } from "@/components/forum/video-embed";

export function MarkdownBody({
  content,
  authorTrustLevel = 0,
}: {
  content: string;
  authorTrustLevel?: number;
}) {
  // Strip auto-generated boilerplate from listing threads
  const cleaned = content
    .replace(/\n*---\n*Auto-generated thread for this listing\.\n*/gi, "")
    .replace(/\n*View listing:\s*https?:\/\/\S+/gi, "")
    .trim();

  return (
    <div className="forum-prose text-sm leading-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={cleaned}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-base font-bold mt-3 mb-2" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-sm font-bold mt-3 mb-1" {...props}>{children}</h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0" {...props}>{children}</p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm" {...props}>{children}</li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-2 border-indigo-300 pl-3 italic text-muted-foreground my-2" {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-muted rounded-md p-3 overflow-x-auto my-2 text-xs">
                  <code className={className} {...props}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ""}
              loading="lazy"
              className="rounded-lg max-h-96 object-contain my-2"
              {...props}
            />
          ),
          a: ({ href, children, ...props }) => {
            // Embed video links for Level 3+ authors
            if (href && isVideoUrl(href)) {
              return (
                <VideoEmbed href={href} authorTrustLevel={authorTrustLevel} />
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-sm border-collapse border" {...props}>{children}</table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border px-2 py-1 bg-muted font-medium text-left" {...props}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td className="border px-2 py-1" {...props}>{children}</td>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      />
    </div>
  );
}
