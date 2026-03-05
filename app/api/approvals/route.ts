import { NextResponse } from "next/server";

type Step =
  | "draft_created"
  | "ai_checks_passed"
  | "submitted_for_review"
  | "brand_review_pending"
  | "compliance_review_pending"
  | "approved_for_deployment";

type Approval = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  payload: any;
  timeline: Array<{ step: Step; label: string; at: number }>;
  currentStep: Step;
};

// In-memory store (dev only)
const store = new Map<string, Approval>();

function id() {
  return Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}

const ORDER: Step[] = [
  "draft_created",
  "ai_checks_passed",
  "submitted_for_review",
  "brand_review_pending",
  "compliance_review_pending",
  "approved_for_deployment",
];

const LABEL: Record<Step, string> = {
  draft_created: "Draft Created",
  ai_checks_passed: "AI Governance Checks Passed",
  submitted_for_review: "Submitted for Review",
  brand_review_pending: "Brand Review — Pending",
  compliance_review_pending: "Compliance Review — Pending",
  approved_for_deployment: "Approved for Deployment",
};

function nextStep(s: Step): Step {
  const i = ORDER.indexOf(s);
  return ORDER[Math.min(ORDER.length - 1, i + 1)];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const newId = id();
  const now = Date.now();

  const approval: Approval = {
    id: newId,
    status: "pending",
    createdAt: now,
    payload: body,
    currentStep: "draft_created",
    timeline: [{ step: "draft_created", label: `${LABEL.draft_created} — ${body?.submittedBy || "Jamie"}`, at: now }],
  };

  store.set(approval.id, approval);

  return NextResponse.json({ ok: true, approvalId: approval.id, status: approval.status });
}

// PATCH { id, action: "advance" | "approve" | "reject" }
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const approvalId = body?.id as string;
  const action = body?.action as "advance" | "approve" | "reject";

  if (!approvalId || !store.has(approvalId)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const a = store.get(approvalId)!;
  const now = Date.now();

  if (action === "advance") {
    const n = nextStep(a.currentStep);
    if (n !== a.currentStep) {
      a.currentStep = n;
      a.timeline.push({ step: n, label: LABEL[n], at: now });
      if (n === "approved_for_deployment") a.status = "approved";
    }
  }

  if (action === "approve") {
    a.status = "approved";
    if (a.currentStep !== "approved_for_deployment") {
      a.currentStep = "approved_for_deployment";
      a.timeline.push({ step: "approved_for_deployment", label: LABEL.approved_for_deployment, at: now });
    }
  }

  if (action === "reject") {
    a.status = "rejected";
    // keep timeline but mark final status
  }

  store.set(approvalId, a);

  return NextResponse.json({ ok: true, approval: a });
}

// GET /api/approvals?id=xxx  -> single
// GET /api/approvals         -> list
export async function GET(req: Request) {
  const url = new URL(req.url);
  const approvalId = url.searchParams.get("id");

  if (approvalId) {
    const a = store.get(approvalId);
    if (!a) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, approval: a });
  }

  const all = Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ ok: true, approvals: all });
}