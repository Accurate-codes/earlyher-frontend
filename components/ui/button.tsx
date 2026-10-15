import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold leading-tight " +
  "transition-[background-color,border-color,box-shadow,transform] duration-150 " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-soft hover:bg-brand-700",
  secondary: "border border-line bg-white text-ink shadow-soft hover:border-brand-300 hover:bg-brand-50",
  quiet: "text-brand-700 hover:bg-brand-100",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 py-2.5 text-base",
  lg: "min-h-14 px-7 py-3 text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
