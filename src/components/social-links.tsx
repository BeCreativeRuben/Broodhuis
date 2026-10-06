import { SHOP } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M13.5 21v-7.2h2.4l.36-2.8H13.5V9.2c0-.8.22-1.35 1.38-1.35H16.4V5.35C16.08 5.3 15.1 5.2 14 5.2c-2.3 0-3.88 1.4-3.88 4v1.8H7.8v2.8h2.32V21H13.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="16.7" cy="7.3" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <a
        href={SHOP.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook van 't Broodhuis"
        className="inline-flex size-11 items-center justify-center text-foreground/80 hover:text-foreground"
      >
        <FacebookIcon className="size-4" />
      </a>
      <a
        href={SHOP.instagram}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram van 't Broodhuis"
        className="inline-flex size-11 items-center justify-center text-foreground/80 hover:text-foreground"
      >
        <InstagramIcon className="size-4" />
      </a>
    </div>
  );
}
