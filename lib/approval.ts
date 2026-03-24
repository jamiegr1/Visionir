// lib/approval.ts
import type { Role } from "@/lib/permissions";

export type ApprovalTimelineStep =
  | "brand"
  | "accessibility"
  | "tokens"
  | "compliance"
  | "scripts"
  | "internal_review"
  | "approved";

export type GovernanceCheckState =
  | "pending"
  | "running"
  | "approved"
  | "rejected";

export type GovernanceCheck = {
  id: Exclude<ApprovalTimelineStep, "internal_review" | "approved">;
  label: string;
  helper: string;
  state: GovernanceCheckState;
};

export const GOVERNANCE_CHECKS: GovernanceCheck[] = [
  {
    id: "brand",
    label: "Brand Compliance",
    helper: "Typography, colour system and tone validated",
    state: "pending",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    helper: "WCAG AA structure and contrast validated",
    state: "pending",
  },
  {
    id: "tokens",
    label: "Design Tokens",
    helper: "Spacing, radius and token usage verified",
    state: "pending",
  },
  {
    id: "compliance",
    label: "AI Compliance & Brand",
    helper: "Restricted claims and policy rules checked",
    state: "pending",
  },
  {
    id: "scripts",
    label: "Restricted Scripts",
    helper: "Unsafe embeds and scripts blocked",
    state: "pending",
  },
];

export function shouldShowInternalTeamReview(role: Role) {
  return role === "creator";
}

export function getApprovalTimeline(role: Role): ApprovalTimelineStep[] {
  const base: ApprovalTimelineStep[] = [
    "brand",
    "accessibility",
    "tokens",
    "compliance",
    "scripts",
  ];

  if (shouldShowInternalTeamReview(role)) {
    return [...base, "internal_review", "approved"];
  }

  return [...base, "approved"];
}

export function getNextStepAfterChecks(role: Role): ApprovalTimelineStep {
  return shouldShowInternalTeamReview(role) ? "internal_review" : "approved";
}