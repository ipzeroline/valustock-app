import React from "react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`surface rounded-2xl shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </span>
        )}
        <div>
          <h3 className="font-display text-base font-semibold leading-tight text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

type Tone = "brand" | "gold" | "up" | "down" | "muted";
const toneMap: Record<Tone, string> = {
  brand: "border-brand/30 bg-brand/10 text-brand",
  gold: "border-gold/30 bg-gold/10 text-gold",
  up: "border-up/30 bg-up/10 text-up",
  down: "border-down/30 bg-down/10 text-down",
  muted: "border-line bg-elevate text-muted",
};

export function Badge({
  tone = "muted",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`chip ${toneMap[tone]} ${className}`}>{children}</span>;
}
