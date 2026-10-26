/** Calle Justa mark: a street seen from above, with a pothole in the middle. */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path d="M8 6v20M24 6v20" stroke="var(--brand-ink)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 7v4M16 21v4" stroke="var(--brand-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="16" cy="16" rx="4.2" ry="3" fill="#dc2626" />
    </svg>
  );
}
