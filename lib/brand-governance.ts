import type { BlockData, Accent } from "@/lib/types";
import { COMPONENT_REGISTRY } from "@/lib/component-registry";
import type { ValidationRule } from "@/lib/component-schema";

export type GovernanceCheckStatus = "ok" | "warning" | "error";

export type GovernanceCheck = {
  id: string;
  label: string;
  status: GovernanceCheckStatus;
  message: string;
};

export type GovernanceResult = {
  status: "on-brand" | "needs-review" | "blocked";
  score: number;
  summary: string;
  checks: GovernanceCheck[];
  bannedHit?: string | null;
};

const APPROVED_CTAS = [
  "Speak to an expert",
  "Contact us",
  "Request a consultation",
];

const BANNED_TERMS = ["cheap", "guaranteed", "instant", "best-in-class"];

const RESTRICTED_TERMS = [
  "world-leading",
  "market-leading",
  "guaranteed outcome",
];

const ALLOWED_ACCENTS: Accent[] = ["blue", "green", "orange", "purple"];

function getRuleValue(
  rules: ValidationRule[] | undefined,
  type: ValidationRule["type"]
) {
  const rule = rules?.find((rule) => rule.type === type);
  return rule && "value" in rule ? rule.value : undefined;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseText(value: string) {
  return value.toLowerCase().trim();
}

function includesWholeTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

function getAllCopy(data: BlockData) {
  const parts: string[] = [];

  if (data.eyebrow) parts.push(data.eyebrow);
  if (data.headline) parts.push(data.headline);
  if (data.subheading) parts.push(data.subheading);

  (data.valuePoints || []).forEach((point) => {
    if (point?.title) parts.push(point.title);
    if (point?.text) parts.push(point.text);
  });

  return parts.join(" ");
}

function buildStatusFromChecks(checks: GovernanceCheck[]) {
  const errors = checks.filter((check) => check.status === "error").length;
  const warnings = checks.filter((check) => check.status === "warning").length;

  if (errors > 0) return "blocked" as const;
  if (warnings > 0) return "needs-review" as const;
  return "on-brand" as const;
}

function buildScore(checks: GovernanceCheck[]) {
  const errors = checks.filter((check) => check.status === "error").length;
  const warnings = checks.filter((check) => check.status === "warning").length;

  return Math.max(0, 100 - errors * 22 - warnings * 8);
}

function buildSummary(
  status: GovernanceResult["status"],
  checks: GovernanceCheck[]
) {
  const errors = checks.filter((check) => check.status === "error").length;
  const warnings = checks.filter((check) => check.status === "warning").length;

  if (status === "on-brand") {
    return "This block is on brand and ready to move forward.";
  }

  if (status === "blocked") {
    return `${errors} blocking issue${errors === 1 ? "" : "s"} found${
      warnings > 0 ? ` and ${warnings} warning${warnings === 1 ? "" : "s"}` : ""
    }.`;
  }

  return `${warnings} warning${
    warnings === 1 ? "" : "s"
  } found. This block should be reviewed before approval.`;
}

export function evaluateBlockGovernance(
  data: BlockData | null
): GovernanceResult | null {
  if (!data) return null;

  const heroSchema = COMPONENT_REGISTRY.find(
    (component) => component.id === "hero-standard"
  );
  const valuePointsSchema = COMPONENT_REGISTRY.find(
    (component) => component.id === "value-points-grid"
  );

  const eyebrowField = heroSchema?.fields.find((field) => field.id === "eyebrow");
  const headlineField = heroSchema?.fields.find((field) => field.id === "headline");
  const subheadingField = heroSchema?.fields.find(
    (field) => field.id === "subheading"
  );

  const itemsField = valuePointsSchema?.fields.find((field) => field.id === "items");
  const titleField = itemsField?.children?.find((field) => field.id === "title");
  const textField = itemsField?.children?.find((field) => field.id === "text");

  const eyebrowMax =
    typeof getRuleValue(eyebrowField?.validation, "maxLength") === "number"
      ? (getRuleValue(eyebrowField?.validation, "maxLength") as number)
      : 40;

  const headlineMax =
    typeof getRuleValue(headlineField?.validation, "maxLength") === "number"
      ? (getRuleValue(headlineField?.validation, "maxLength") as number)
      : 70;

  const subheadingMax =
    typeof getRuleValue(subheadingField?.validation, "maxLength") === "number"
      ? (getRuleValue(subheadingField?.validation, "maxLength") as number)
      : 180;

  const itemsMin =
    typeof getRuleValue(itemsField?.validation, "minItems") === "number"
      ? (getRuleValue(itemsField?.validation, "minItems") as number)
      : 3;

  const itemsMax =
    typeof getRuleValue(itemsField?.validation, "maxItems") === "number"
      ? (getRuleValue(itemsField?.validation, "maxItems") as number)
      : 4;

  const valueTitleMax =
    typeof getRuleValue(titleField?.validation, "maxLength") === "number"
      ? (getRuleValue(titleField?.validation, "maxLength") as number)
      : 40;

  const valueTextMax =
    typeof getRuleValue(textField?.validation, "maxLength") === "number"
      ? (getRuleValue(textField?.validation, "maxLength") as number)
      : 140;

  const checks: GovernanceCheck[] = [];

  const eyebrow = getString(data.eyebrow);
  const headline = getString(data.headline);
  const subheading = getString(data.subheading);
  const valuePoints = data.valuePoints || [];

  checks.push(
    !headline
      ? {
          id: "headline-required",
          label: "Primary headline",
          status: "error",
          message: "Primary headline is required.",
        }
      : headline.length > headlineMax
      ? {
          id: "headline-length",
          label: "Primary headline",
          status: "error",
          message: `Headline must be ${headlineMax} characters or fewer.`,
        }
      : {
          id: "headline-valid",
          label: "Primary headline",
          status: "ok",
          message: "Headline is present and within the approved limit.",
        }
  );

  checks.push(
    !subheading
      ? {
          id: "subheading-required",
          label: "Subheading",
          status: "error",
          message: "Subheading is required.",
        }
      : subheading.length > subheadingMax
      ? {
          id: "subheading-length",
          label: "Subheading",
          status: "error",
          message: `Subheading must be ${subheadingMax} characters or fewer.`,
        }
      : {
          id: "subheading-valid",
          label: "Subheading",
          status: "ok",
          message: "Subheading is present and within the approved limit.",
        }
  );

  checks.push(
    eyebrow.length > eyebrowMax
      ? {
          id: "eyebrow-length",
          label: "Eyebrow",
          status: "warning",
          message: `Eyebrow should be ${eyebrowMax} characters or fewer.`,
        }
      : {
          id: "eyebrow-valid",
          label: "Eyebrow",
          status: "ok",
          message: eyebrow
            ? "Eyebrow is within the approved limit."
            : "Eyebrow is optional and currently not used.",
        }
  );

  checks.push(
    valuePoints.length < itemsMin || valuePoints.length > itemsMax
      ? {
          id: "value-point-count",
          label: "Value points",
          status: "error",
          message: `This block must contain between ${itemsMin} and ${itemsMax} value points.`,
        }
      : {
          id: "value-point-count-valid",
          label: "Value points",
          status: "ok",
          message: `Value point count is within the approved range (${itemsMin}-${itemsMax}).`,
        }
  );

  valuePoints.forEach((point, index) => {
    const title = getString(point?.title);
    const text = getString(point?.text);
    const accent = point?.accent;

    checks.push(
      !title
        ? {
            id: `value-point-${index}-title-required`,
            label: `Value Point ${index + 1} Title`,
            status: "error",
            message: "Title is required.",
          }
        : title.length > valueTitleMax
        ? {
            id: `value-point-${index}-title-length`,
            label: `Value Point ${index + 1} Title`,
            status: "warning",
            message: `Title should be ${valueTitleMax} characters or fewer.`,
          }
        : {
            id: `value-point-${index}-title-valid`,
            label: `Value Point ${index + 1} Title`,
            status: "ok",
            message: "Title is within the approved limit.",
          }
    );

    checks.push(
      !text
        ? {
            id: `value-point-${index}-text-required`,
            label: `Value Point ${index + 1} Copy`,
            status: "error",
            message: "Copy is required.",
          }
        : text.length > valueTextMax
        ? {
            id: `value-point-${index}-text-length`,
            label: `Value Point ${index + 1} Copy`,
            status: "warning",
            message: `Copy should be ${valueTextMax} characters or fewer.`,
          }
        : {
            id: `value-point-${index}-text-valid`,
            label: `Value Point ${index + 1} Copy`,
            status: "ok",
            message: "Copy is within the approved limit.",
          }
    );

    checks.push(
      !accent || !ALLOWED_ACCENTS.includes(accent)
        ? {
            id: `value-point-${index}-accent`,
            label: `Value Point ${index + 1} Accent`,
            status: "error",
            message: "Accent must use an approved token-bound colour.",
          }
        : {
            id: `value-point-${index}-accent-valid`,
            label: `Value Point ${index + 1} Accent`,
            status: "ok",
            message: "Accent uses an approved colour token.",
          }
    );
  });

  const fullCopy = getAllCopy(data);
  const fullCopyNormalised = normaliseText(fullCopy);

  const bannedHit =
    BANNED_TERMS.find((term) => includesWholeTerm(fullCopyNormalised, term)) ||
    null;

  const restrictedHit =
    RESTRICTED_TERMS.find((term) =>
      includesWholeTerm(fullCopyNormalised, term)
    ) || null;

  checks.push(
    bannedHit
      ? {
          id: "banned-terms",
          label: "Restricted language",
          status: "error",
          message: `Blocked term found: "${bannedHit}". Remove this before approval.`,
        }
      : restrictedHit
      ? {
          id: "restricted-terms",
          label: "Restricted language",
          status: "warning",
          message: `Review phrase found: "${restrictedHit}". This should be checked before approval.`,
        }
      : {
          id: "language-safe",
          label: "Restricted language",
          status: "ok",
          message: "No banned or review-only terms found.",
        }
  );

  const duplicateValueTitles = new Set<string>();
  const seenTitles = new Set<string>();

  valuePoints.forEach((point) => {
    const title = normaliseText(getString(point?.title));
    if (!title) return;

    if (seenTitles.has(title)) {
      duplicateValueTitles.add(title);
    }

    seenTitles.add(title);
  });

  checks.push(
    duplicateValueTitles.size > 0
      ? {
          id: "duplicate-value-point-titles",
          label: "Value point distinction",
          status: "warning",
          message: "Some value point titles are duplicated. Make them more distinct.",
        }
      : {
          id: "value-point-distinction",
          label: "Value point distinction",
          status: "ok",
          message: "Value point titles are distinct.",
        }
  );

  const ctaHits = APPROVED_CTAS.filter((cta) =>
    includesWholeTerm(fullCopyNormalised, cta.toLowerCase())
  );

  checks.push(
    ctaHits.length > 0
      ? {
          id: "cta-language",
          label: "CTA language",
          status: "ok",
          message: "Approved CTA language is present in the content.",
        }
      : {
          id: "cta-language-review",
          label: "CTA language",
          status: "warning",
          message: "No approved CTA phrase detected. Review CTA wording before approval.",
        }
  );

  const status = buildStatusFromChecks(checks);
  const score = buildScore(checks);
  const summary = buildSummary(status, checks);

  return {
    status,
    score,
    summary,
    checks,
    bannedHit,
  };
}