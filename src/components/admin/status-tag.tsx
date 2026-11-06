import type { ReactNode } from "react";
import {
  aiFeedbackMeta,
  orderStatusMeta,
  paymentStatusMeta,
  socialStatusMeta,
  tagClass,
  tryOnStatusMeta,
  type StatusTone
} from "@/lib/admin-status";

type Kind = "order" | "payment" | "social" | "tryon" | "feedback";

const resolvers = {
  order: orderStatusMeta,
  payment: paymentStatusMeta,
  social: socialStatusMeta,
  tryon: tryOnStatusMeta,
  feedback: aiFeedbackMeta
} as const;

/** Colored Vietnamese status pill used across all admin pages. */
export function StatusTag({
  kind,
  value,
  dot = true,
  className = "",
  children
}: {
  kind: Kind;
  value: string | null | undefined;
  dot?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const meta = resolvers[kind](value);
  return (
    <span className={`${tagClass(meta.tone)} antStatusTag ${className}`} title={meta.hint}>
      {dot ? <span className={`antTagDot tone-${meta.tone}`} aria-hidden /> : null}
      {children ?? meta.label}
    </span>
  );
}

export function ToneTag({ tone, children, className = "" }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return <span className={`${tagClass(tone)} ${className}`}>{children}</span>;
}
