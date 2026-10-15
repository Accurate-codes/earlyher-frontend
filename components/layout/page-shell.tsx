import type { ReactNode } from "react";

/** Standard column for task screens: centred, comfortably narrow, with room to breathe. */
export function PageShell({ children, width = "md" }: { children: ReactNode; width?: "md" | "lg" }) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 ${
        width === "lg" ? "max-w-5xl" : "max-w-3xl"
      }`}
    >
      {children}
    </div>
  );
}

export function PageHeading({
  title,
  lead,
  eyebrow,
  children,
}: {
  title: string;
  lead?: string;
  eyebrow?: ReactNode;
  /** Controls shown under the heading, such as Listen. */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {eyebrow && <div className="text-base font-semibold text-brand-700">{eyebrow}</div>}
      <h1 className="max-w-[22ch] text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight">
        {title}
      </h1>
      {lead && <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{lead}</p>}
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7 ${className}`}>{children}</div>
  );
}
