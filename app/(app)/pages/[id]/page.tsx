"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  LayoutTemplate,
  Pencil,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import type {
  PageRecord,
  PageStatus,
  PageTemplateSectionInstance,
} from "@/lib/template-types";

type Role = "creator" | "approver" | "admin";
type PageTab = "overview" | "sections" | "preview";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: PageStatus) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "pending_approval":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
}

function getStatusPillClass(status: PageStatus) {
  switch (status) {
    case "in_progress":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "pending_approval":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "approved":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "archived":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "draft":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function StatusPill({ status }: { status: PageStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        getStatusPillClass(status)
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function OverviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="max-w-[62%] break-words text-right text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition",
        active
          ? "bg-[#5b7cff] text-white shadow-[0_12px_28px_rgba(91,124,255,0.22)]"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {children}
      </span>
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]",
        props.className
      )}
    />
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "purple";
}) {
  const styles =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : tone === "purple"
            ? "bg-purple-50 text-purple-700"
            : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles
      )}
    >
      {children}
    </span>
  );
}

function RuleRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="max-w-[60%] text-right text-sm leading-6 text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SectionSummaryCard({
  section,
  index,
  isSelected,
  onClick,
}: {
  section: PageTemplateSectionInstance;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const allowedCount = section.allowedComponentIds.length;
  const blockCount = section.blockIds.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[24px] border p-4 text-left transition",
        isSelected
          ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_12px_28px_rgba(91,124,255,0.08)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {index + 1}
            </span>

            <h3 className="truncate text-[16px] font-semibold text-slate-900">
              {section.label}
            </h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Template key: {section.key}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={section.required ? "emerald" : "slate"}>
            {section.required ? "Required" : "Optional"}
          </Badge>

          <Badge tone={section.completed ? "emerald" : "slate"}>
            {section.completed ? "Complete" : "Incomplete"}
          </Badge>

          {section.canSkip ? <Badge tone="blue">Can skip</Badge> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Allowed blocks
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {allowedCount}
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Attached blocks
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {blockCount}
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Default block
          </p>
          <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
            {section.defaultComponentId || "—"}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function PageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return value === "creator" || value === "approver" || value === "admin"
      ? value
      : "admin";
  }, [searchParams]);

  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [page, setPage] = useState<PageRecord | null>(null);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageStatus, setPageStatus] = useState<PageStatus>("draft");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);

        const res = await fetch(`/api/pages/${id}?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.page) {
          setPage(null);
          return;
        }

        const nextPage = json.page as PageRecord;
        setPage(nextPage);
        setPageName(nextPage.name || "");
        setPageSlug(nextPage.slug || "");
        setPageStatus(nextPage.status || "draft");
      } catch (error) {
        console.error("Failed to load page:", error);
        setPage(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadPage();
    }
  }, [id, role]);

  const sortedSections = useMemo(() => {
    return (page?.sections ?? []).slice().sort((a, b) => a.order - b.order);
  }, [page]);

  useEffect(() => {
    if (!sortedSections.length) {
      setSelectedSectionId(null);
      return;
    }

    setSelectedSectionId((current) => {
      const exists = sortedSections.some((section) => section.sectionId === current);
      return exists ? current : sortedSections[0]?.sectionId ?? null;
    });
  }, [sortedSections]);

  const selectedSection =
    sortedSections.find((section) => section.sectionId === selectedSectionId) ?? null;

  async function refreshPage() {
    const res = await fetch(`/api/pages/${id}?role=${role}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.page) {
      const nextPage = json.page as PageRecord;
      setPage(nextPage);
      setPageName(nextPage.name || "");
      setPageSlug(nextPage.slug || "");
      setPageStatus(nextPage.status || "draft");
    }
  }

  async function handleSave() {
    if (!page) return;

    try {
      setIsSaving(true);

      const res = await fetch(`/api/pages/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pageName.trim(),
          slug: pageSlug.trim(),
          status: pageStatus,
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save page.");
      }

      await refreshPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save page.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWorkflowAction(
    action: "submit" | "approve" | "reject" | "publish"
  ) {
    try {
      setIsActing(true);

      const res = await fetch(`/api/pages/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || `Failed to ${action} page.`);
      }

      await refreshPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : `Failed to ${action} page.`);
    } finally {
      setIsActing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading page…
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Page not found.
      </div>
    );
  }

  const requiredSections = sortedSections.filter((section) => section.required);
  const completedSections = sortedSections.filter((section) => section.completed);
  const incompleteSections = sortedSections.filter((section) => !section.completed);
  const totalAttachedBlocks = sortedSections.reduce(
    (sum, section) => sum + section.blockIds.length,
    0
  );

  const workflowSummary =
    pageStatus === "draft"
      ? "This page is still being prepared."
      : pageStatus === "in_progress"
        ? "Required sections are being completed."
        : pageStatus === "pending_approval"
          ? "This page is awaiting approval."
          : pageStatus === "approved"
            ? "This page has been approved and is ready for publishing."
            : pageStatus === "rejected"
              ? "This page needs further changes before resubmission."
              : pageStatus === "published"
                ? "This page has been published."
                : "This page is archived.";

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-6 py-8">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/pages?role=${role}`)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Pages
                </button>

                <StatusPill status={pageStatus} />
              </div>

              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Page Workspace
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                {page.name}
              </h1>

              <p className="mt-3 max-w-[920px] text-sm leading-7 text-slate-500">
                This page inherits its structure from the{" "}
                <span className="font-medium text-slate-700">{page.templateName}</span>{" "}
                template.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:max-w-[980px]">
                <OverviewCard label="Template" value={page.templateName} />
                <OverviewCard label="Sections" value={`${sortedSections.length}`} />
                <OverviewCard label="Completed" value={`${completedSections.length}`} />
                <OverviewCard label="Blocks" value={`${totalAttachedBlocks}`} />
              </div>
            </div>

            <div className="flex w-full max-w-[860px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Page"}
                </button>

                {(pageStatus === "draft" ||
                  pageStatus === "rejected" ||
                  pageStatus === "in_progress") ? (
                  <button
                    type="button"
                    onClick={() => handleWorkflowAction("submit")}
                    disabled={isActing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {isActing ? "Submitting..." : "Submit"}
                  </button>
                ) : null}

                {pageStatus === "pending_approval" &&
                (role === "approver" || role === "admin") ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction("approve")}
                      disabled={isActing}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isActing ? "Approving..." : "Approve"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWorkflowAction("reject")}
                      disabled={isActing}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      {isActing ? "Rejecting..." : "Reject"}
                    </button>
                  </>
                ) : null}

                {pageStatus === "approved" && (role === "approver" || role === "admin") ? (
                  <button
                    type="button"
                    onClick={() => handleWorkflowAction("publish")}
                    disabled={isActing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isActing ? "Publishing..." : "Publish"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.push(`/templates/${page.templateId}?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  View Template
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<Pencil className="h-4 w-4" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === "sections"}
            onClick={() => setActiveTab("sections")}
            icon={<FileText className="h-4 w-4" />}
            label="Sections"
          />
          <TabButton
            active={activeTab === "preview"}
            onClick={() => setActiveTab("preview")}
            icon={<Eye className="h-4 w-4" />}
            label="Preview"
          />
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Page Metadata"
                subtitle="Basic page information and workflow status."
                icon={<FileText className="h-5 w-5" />}
              >
                <div>
                  <MetaRow label="Page ID" value={page.id} />
                  <MetaRow label="Slug" value={page.slug || "—"} />
                  <MetaRow label="Status" value={getStatusLabel(pageStatus)} />
                  <MetaRow label="Template" value={page.templateName} />
                  <MetaRow label="Template Version" value={`v${page.templateVersion}`} />
                  <MetaRow label="Created At" value={formatDateTime(page.createdAt)} />
                  <MetaRow label="Updated At" value={formatDateTime(page.updatedAt)} />
                </div>
              </Panel>

              <Panel
                title="Workflow Summary"
                subtitle="Where this page currently sits in the governed process."
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-700">{workflowSummary}</p>
                </div>
              </Panel>
            </aside>

            <main className="min-w-0 space-y-6">
              <Panel
                title="Page Overview"
                subtitle="Edit the page identity while keeping the governed structure intact."
                icon={<Pencil className="h-5 w-5" />}
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Page Name</FieldLabel>
                    <TextInput
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      placeholder="Service Page"
                    />
                  </div>

                  <div>
                    <FieldLabel>Slug</FieldLabel>
                    <TextInput
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value)}
                      placeholder="service-page"
                    />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Page Progress"
                subtitle="A quick view of completion across the governed structure."
                icon={<CheckCircle2 className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <OverviewCard label="Total sections" value={`${sortedSections.length}`} />
                  <OverviewCard label="Required" value={`${requiredSections.length}`} />
                  <OverviewCard label="Completed" value={`${completedSections.length}`} />
                  <OverviewCard label="Incomplete" value={`${incompleteSections.length}`} />
                </div>
              </Panel>

              <Panel
                title="Template Link"
                subtitle="This page is governed by the selected template."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {page.templateName}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This page inherits its approved section structure and allowed block
                    types from the template.
                  </p>
                </div>
              </Panel>
            </main>
          </div>
        ) : null}

        {activeTab === "sections" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
            <main className="min-w-0">
              <Panel
                title="Page Sections"
                subtitle="Work through the page section by section using the structure inherited from the template."
                icon={<FileText className="h-5 w-5" />}
              >
                {sortedSections.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No page sections available
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This page does not currently have any template-derived sections.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedSections.map((section, index) => (
                      <SectionSummaryCard
                        key={section.sectionId}
                        section={section}
                        index={index}
                        isSelected={selectedSection?.sectionId === section.sectionId}
                        onClick={() => setSelectedSectionId(section.sectionId)}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Selected Section"
                subtitle="Inspect the current section and its constraints."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                {selectedSection ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                          {selectedSection.label}
                        </h3>

                        <Badge tone={selectedSection.required ? "emerald" : "slate"}>
                          {selectedSection.required ? "Required" : "Optional"}
                        </Badge>

                        <Badge tone={selectedSection.completed ? "emerald" : "slate"}>
                          {selectedSection.completed ? "Complete" : "Incomplete"}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Template key: {selectedSection.key}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Section signals
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.canSkip ? (
                          <Badge tone="blue">Can skip</Badge>
                        ) : (
                          <Badge tone="slate">Cannot skip</Badge>
                        )}

                        {selectedSection.required ? (
                          <Badge tone="emerald">Required for completion</Badge>
                        ) : null}

                        {selectedSection.completed ? (
                          <Badge tone="emerald">Ready</Badge>
                        ) : (
                          <Badge tone="amber">Needs content</Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <RuleRow
                        label="Instances"
                        value={`${selectedSection.minInstances}–${selectedSection.maxInstances}`}
                      />
                      <RuleRow
                        label="Default block"
                        value={selectedSection.defaultComponentId || "—"}
                      />
                      <RuleRow
                        label="Allowed blocks"
                        value={`${selectedSection.allowedComponentIds.length}`}
                      />
                      <RuleRow
                        label="Attached blocks"
                        value={`${selectedSection.blockIds.length}`}
                      />
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Allowed blocks
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.allowedComponentIds.length > 0 ? (
                          selectedSection.allowedComponentIds.map((componentId) => (
                            <span
                              key={componentId}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {componentId}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None set</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Attached block IDs
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.blockIds.length > 0 ? (
                          selectedSection.blockIds.map((blockId) => (
                            <span
                              key={blockId}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {blockId}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">No blocks attached</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a section to inspect it.</p>
                )}
              </Panel>
            </aside>
          </div>
        ) : null}

        {activeTab === "preview" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <main className="min-w-0">
              <Panel
                title="Page Preview"
                subtitle="A simple first-pass preview showing the page structure and completion state."
                icon={<Eye className="h-5 w-5" />}
              >
                {sortedSections.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Nothing to preview
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This page does not currently contain any sections.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedSections.map((section, index) => (
                      <div
                        key={section.sectionId}
                        className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {section.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {section.required ? "Required section" : "Optional section"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge tone={section.required ? "emerald" : "slate"}>
                              {section.required ? "Required" : "Optional"}
                            </Badge>
                            <Badge tone={section.completed ? "emerald" : "slate"}>
                              {section.completed ? "Complete" : "Incomplete"}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            {section.defaultComponentId || "Representative block preview"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {section.blockIds.length > 0
                              ? `${section.blockIds.length} block(s) attached to this section`
                              : "No blocks attached yet"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Preview Guidance"
                subtitle="A base for richer page rendering later."
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Structure-first
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      This preview currently shows the page structure inherited from the template.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Block-aware
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      You can later extend this to render real attached blocks inside each section.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Completion visible
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      This already shows which sections are complete and which still need work.
                    </p>
                  </div>
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}