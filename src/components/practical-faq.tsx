import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

import {
  practicalFaqItems,
  practicalFaqJsonLd,
  type PracticalFaqLink,
} from "@/lib/practical-faq";

function renderParagraph(paragraph: string, link?: PracticalFaqLink) {
  if (!link || !paragraph.includes(link.phrase)) return paragraph;
  const [before, after] = paragraph.split(link.phrase);
  return (
    <>
      {before}
      <Link href={link.href} className="underline hover:text-foreground">
        {link.phrase}
      </Link>
      {after}
    </>
  );
}

export function PracticalFaq() {
  const items = practicalFaqItems();
  const jsonLd = JSON.stringify(practicalFaqJsonLd(items)).replace(/</g, "\\u003c");

  return (
    <section className="mt-10 border-t border-border/60 pt-8" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-heading text-xl font-semibold">
        Veelgestelde vragen
      </h2>
      <div className="mt-2 max-w-2xl">
        {items.map((item) => (
          <details key={item.question} className="group border-b border-border/60">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 text-left font-medium [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDownIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="space-y-2 pb-4 text-sm text-muted-foreground">
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph}>{renderParagraph(paragraph, item.link)}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </section>
  );
}
