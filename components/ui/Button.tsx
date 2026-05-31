"use client";
import React from "react";

type Variant = "primary" | "ghost" | "outline" | "gold" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-bg hover:brightness-110 shadow-[0_8px_24px_-10px_rgb(var(--brand))]",
  gold: "bg-gold text-bg hover:brightness-110 shadow-[0_8px_24px_-10px_rgb(var(--gold))]",
  outline: "border border-line text-ink hover:border-brand hover:text-brand",
  ghost: "text-muted hover:text-ink hover:bg-elevate",
  subtle: "bg-elevate text-ink hover:bg-line/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
