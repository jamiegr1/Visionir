"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FileText,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

type GlobalTab =
  | "overview"
  | "regions"
  | "users"
  | "permissions"
  | "templates"
  | "approvals"
  | "governance"
  | "integrations"
  | "analytics"
  | "audit";

type RegionStatus = "active" | "setup" | "paused";
type UserStatus = "active" | "invited" | "disabled";
type RoleType = "global_admin" | "regional_admin" | "approver" | "creator";

type RegionRecord = {
  id: string;
  name: string;
  country: string;
  locale: string;
  status: RegionStatus;
  cms: string;
  domain: string;
  pages: number;
  blocks: number;
  approvals: number;
  compliance: number;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  regions: string[];
  status: UserStatus;
};

type PermissionRow = {
  label: string;
  creator: boolean;
  approver: boolean;
  regionalAdmin: boolean;
  globalAdmin: boolean;
};

const REGIONS: RegionRecord[] = [
  {
    id: "mediascout-uk",
    name: "Mediascout UK",
    country: "United Kingdom",
    locale: "en-GB",
    status: "active",
    cms: "Optimizely",
    domain: "mediascout.co.uk",
    pages: 24,
    blocks: 96,
    approvals: 3,
    compliance: 98,
  },
  {
    id: "mediascout-dubai",
    name: "Mediascout Dubai",
    country: "United Arab Emirates",
    locale: "en-AE",
    status: "setup",
    cms: "Not connected",
    domain: "dubai.mediascout.com",
    pages: 0,
    blocks: 0,
    approvals: 0,
    compliance: 0,
  },
  {
    id: "mediascout-france",
    name: "Mediascout France",
    country: "France",
    locale: "fr-FR",
    status: "setup",
    cms: "Not connected",
    domain: "fr.mediascout.com",
    pages: 0,
    blocks: 0,
    approvals: 0,
    compliance: 0,
  },
];

const USERS: UserRecord[] = [
  {
    id: "user-1",
    name: "Jamie Gregg",
    email: "jamie@mediascout.co.uk",
    role: "global_admin",
    regions: ["Global", "Mediascout UK", "Mediascout Dubai", "Mediascout France"],
    status: "active",
  },
  {
    id: "user-2",
    name: "Sarah Mitchell",
    email: "sarah@mediascout.co.uk",
    role: "regional_admin",
    regions: ["Mediascout UK"],
    status: "active",
  },
  {
    id: "user-3",
    name: "Amélie Laurent",
    email: "amelie@mediascout.fr",
    role: "approver",
    regions: ["Mediascout France"],
    status: "invited",
  },
  {
    id: "user-4",
    name: "Omar Haddad",
    email: "omar@mediascout.ae",
    role: "creator",
    regions: ["Mediascout Dubai"],
    status: "invited",
  },
];

const PERMISSIONS: PermissionRow[] = [
  { label: "Create pages", creator: true, approver: true, regionalAdmin: true, globalAdmin: true },
  { label: "Generate blocks", creator: true, approver: true, regionalAdmin: true, globalAdmin: true },
  { label: "Submit work for approval", creator: true, approver: true, regionalAdmin: true, globalAdmin: true },
  { label: "Approve blocks", creator: false, approver: true, regionalAdmin: true, globalAdmin: true },
  { label: "Approve pages", creator: false, approver: true, regionalAdmin: true, globalAdmin: true },
  { label: "Publish pages", creator: false, approver: false, regionalAdmin: true, globalAdmin: true },
  { label: "Manage templates", creator: false, approver: false, regionalAdmin: false, globalAdmin: true },
  { label: "Manage regions", creator: false, approver: false, regionalAdmin: false, globalAdmin: true },
  { label: "Manage users", creator: false, approver: false, regionalAdmin: true, globalAdmin: true },
  { label: "Change global governance", creator: false, approver: false, regionalAdmin: false, globalAdmin: true },
];

const TABS: Array<{
  id: GlobalTab;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Organisation health and global setup",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "regions",
    label: "Regions",
    description: "Create and manage regional workspaces",
    icon: <Globe2 className="h-4 w-4" />,
  },
  {
    id: "users",
    label: "Users",
    description: "People, invitations and region access",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "permissions",
    label: "Roles & Permissions",
    description: "Control what each role can do",
    icon: <KeyRound className="h-4 w-4" />,
  },
  {
    id: "templates",
    label: "Templates",
    description: "Global template behaviour",
    icon: <LayoutTemplate className="h-4 w-4" />,
  },
  {
    id: "approvals",
    label: "Approval Policies",
    description: "Review rules across regions",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    id: "governance",
    label: "Brand & Governance",
    description: "Locked rules and regional overrides",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: "integrations",
    label: "CMS Integrations",
    description: "Publishing connectors and environments",
    icon: <PlugZap className="h-4 w-4" />,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Enterprise adoption and performance",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    id: "audit",
    label: "Audit Logs",
    description: "Governance history and admin actions",
    icon: <DatabaseZap className="h-4 w-4" />,
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function roleLabel(role: RoleType) {
  if (role === "global_admin") return "Global Admin";
  if (role === "regional_admin") return "Regional Admin";
  if (role === "approver") return "Approver";
  return "Creator";
}

function statusLabel(status: RegionStatus | UserStatus) {
  if (status === "setup") return "Setup Required";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "slate";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]",
        tone === "green" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
        tone === "amber" && "bg-amber-50 text-amber-700 ring-amber-100",
        tone === "slate" && "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {children}
    </span>
  );
}

function SettingCard({
  title,
  description,
  icon,
  children,
  right,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            {icon}
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "slate";
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[30px] font-semibold leading-none tracking-[-0.05em] text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{label}</p>
        </div>
        <div
          className={cx(
            "flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
            tone === "green" && "bg-emerald-50 text-emerald-600 ring-emerald-100",
            tone === "amber" && "bg-amber-50 text-amber-600 ring-amber-100",
            tone === "slate" && "bg-slate-100 text-slate-600 ring-slate-200",
            tone === "blue" && "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  locked,
}: {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {locked ? (
            <StatusPill tone="blue">
              <Lock className="mr-1 h-3 w-3" />
              Locked globally
            </StatusPill>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <span
        className={cx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
          checked ? "bg-[#5b7cff]" : "bg-slate-300"
        )}
      >
        <span
          className={cx(
            "inline-block h-5 w-5 rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </div>
  );
}

function PermissionCheck({ value }: { value: boolean }) {
  return (
    <div className="flex justify-center">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <span className="h-4 w-4 rounded-full border border-slate-300" />
      )}
    </div>
  );
}

export default function GlobalSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = searchParams.get("role") || "admin";
  const [activeTab, setActiveTab] = useState<GlobalTab>("overview");
  const [query, setQuery] = useState("");

  const activeTabMeta = useMemo(
    () => TABS.find((tab) => tab.id === activeTab) || TABS[0],
    [activeTab]
  );

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return USERS;
    const q = query.toLowerCase();

    return USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        roleLabel(user.role).toLowerCase().includes(q) ||
        user.regions.some((region) => region.toLowerCase().includes(q))
    );
  }, [query]);

  const activeRegions = REGIONS.filter((region) => region.status === "active").length;
  const totalPages = REGIONS.reduce((sum, region) => sum + region.pages, 0);
  const totalBlocks = REGIONS.reduce((sum, region) => sum + region.blocks, 0);
  const totalApprovals = REGIONS.reduce((sum, region) => sum + region.approvals, 0);

  const complianceRegions = REGIONS.filter((region) => region.compliance > 0);
  const averageCompliance = Math.round(
    complianceRegions.reduce((sum, region) => sum + region.compliance, 0) /
      Math.max(1, complianceRegions.length)
  );

  function withRole(path: string) {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}role=${role}&region=mediascout-global`;
  }

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <main className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <header className="border-b border-slate-200 bg-[#f5f7fb] px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#4f6fff] shadow-sm">
                    {activeTabMeta.icon}
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                      Global Settings
                    </p>
                    <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-slate-900">
                      {activeTabMeta.label}
                    </h2>
                  </div>
                </div>

                <p className="mt-3 max-w-[860px] text-sm leading-6 text-slate-500">
                  {activeTabMeta.description}. This area sits above regional workspaces and controls the organisation-wide rules Visionir applies.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(withRole("/dashboard"))}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open global dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  Save settings
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto px-6 py-6 lg:px-8">
          <div className="mx-auto grid max-w-[1800px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="hidden xl:block">
              <div className="sticky top-0 space-y-5">
                <div className="rounded-[28px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-[22px] font-semibold tracking-[-0.05em] text-slate-900">
                        Mediascout Global
                      </h1>

                      <p className="mt-1.5 text-sm leading-6 text-slate-500">
                        Organisation control centre.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill tone="blue">Global</StatusPill>
                        <StatusPill tone="green">Admin</StatusPill>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                  {TABS.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    const isLast = index === TABS.length - 1;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cx(
                          "group relative w-full rounded-2xl px-4 py-3 text-left transition",
                          isActive
                            ? "bg-[#f7f9ff] shadow-[0_4px_14px_rgba(79,108,255,0.06)]"
                            : "hover:bg-slate-50"
                        )}
                      >
                        {!isLast ? (
                          <span
                            className={cx(
                              "absolute bottom-0 left-4 right-4 h-px transition",
                              isActive ? "bg-transparent" : "bg-slate-200/70"
                            )}
                          />
                        ) : null}

                        <span
                          className={cx(
                            "absolute bottom-[11px] left-0 top-[11px] w-[3px] rounded-r-full transition",
                            isActive ? "bg-[#4f6fff]" : "bg-transparent"
                          )}
                        />

                        <div className="flex items-start gap-3 pl-2.5">
                          <div
                            className={cx(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition",
                              isActive
                                ? "bg-[#eef3ff] text-[#4f6fff]"
                                : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                            )}
                          >
                            {tab.icon}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={cx(
                                "text-[13.5px] font-semibold tracking-[-0.01em]",
                                isActive ? "text-slate-900" : "text-slate-700"
                              )}
                            >
                              {tab.label}
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-slate-500">
                              {tab.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[22px] border border-[#dbe5ff] bg-[#f8faff] px-4 py-3.5">
                  <p className="text-[13px] leading-5 text-[#4f6fff]">
                    Global settings define what regional teams can inherit, override and publish.
                  </p>
                </div>
              </div>
            </aside>

            <section className="min-w-0 space-y-6">
              {activeTab === "overview" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                      label="Regions"
                      value={REGIONS.length}
                      tone="blue"
                      icon={<Globe2 className="h-5 w-5" />}
                    />
                    <MetricCard
                      label="Active Regions"
                      value={activeRegions}
                      tone="green"
                      icon={<CheckCircle2 className="h-5 w-5" />}
                    />
                    <MetricCard
                      label="Pages"
                      value={totalPages}
                      tone="slate"
                      icon={<FileText className="h-5 w-5" />}
                    />
                    <MetricCard
                      label="Blocks"
                      value={totalBlocks}
                      tone="blue"
                      icon={<Sparkles className="h-5 w-5" />}
                    />
                    <MetricCard
                      label="Avg Compliance"
                      value={`${averageCompliance}%`}
                      tone="green"
                      icon={<ShieldCheck className="h-5 w-5" />}
                    />
                  </div>

                  <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
                    <SettingCard
                      title="Global Operating Model"
                      description="How Visionir separates corporate governance from regional execution."
                      icon={<Building2 className="h-5 w-5" />}
                    >
                      <div className="grid gap-4 lg:grid-cols-3">
                        {[
                          {
                            title: "Global controls",
                            text: "Organisation-wide governance, templates, approval policies and permissions.",
                            icon: <ShieldCheck className="h-5 w-5" />,
                          },
                          {
                            title: "Regions inherit",
                            text: "Regional teams inherit approved structures, locked tokens and compliance rules.",
                            icon: <Globe2 className="h-5 w-5" />,
                          },
                          {
                            title: "Overrides are governed",
                            text: "Local language, disclaimers, CTAs and CMS settings can be overridden only when allowed.",
                            icon: <SlidersHorizontal className="h-5 w-5" />,
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#4f6fff] ring-1 ring-slate-200">
                              {item.icon}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SettingCard>

                    <SettingCard
                      title="Next Admin Actions"
                      description="Recommended setup steps before inviting more regional teams."
                      icon={<Sparkles className="h-5 w-5" />}
                    >
                      <div className="space-y-3">
                        {[
                          "Confirm global template mode",
                          "Set regional override permissions",
                          "Connect regional CMS environments",
                          "Invite regional approvers",
                          "Review approval routing",
                        ].map((item, index) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#4f6fff] ring-1 ring-slate-200">
                              {index + 1}
                            </div>
                            <p className="text-sm font-medium text-slate-800">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SettingCard>
                  </div>
                </>
              ) : null}

              {activeTab === "regions" ? (
                <SettingCard
                  title="Regional Workspaces"
                  description="Create and manage the regional sites that inherit global governance."
                  icon={<Globe2 className="h-5 w-5" />}
                  right={<StatusPill tone="blue">{REGIONS.length} regions</StatusPill>}
                >
                  <div className="grid gap-4">
                    {REGIONS.map((region) => (
                      <div
                        key={region.id}
                        className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:bg-white"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
                                {region.name}
                              </h3>
                              <StatusPill
                                tone={
                                  region.status === "active"
                                    ? "green"
                                    : region.status === "setup"
                                      ? "amber"
                                      : "slate"
                                }
                              >
                                {statusLabel(region.status)}
                              </StatusPill>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {region.country} · {region.locale} · {region.domain}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/brand?role=${role}&region=${region.id}`
                              )
                            }
                            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Open regional settings
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                          {[
                            ["CMS", region.cms],
                            ["Pages", region.pages],
                            ["Blocks", region.blocks],
                            ["Approvals", region.approvals],
                            ["Compliance", region.compliance ? `${region.compliance}%` : "—"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                {label}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingCard>
              ) : null}

              {activeTab === "users" ? (
                <SettingCard
                  title="Users & Access"
                  description="Manage who can access global and regional workspaces."
                  icon={<Users className="h-5 w-5" />}
                  right={
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-2xl bg-[#5b7cff] px-4 text-sm font-medium text-white"
                    >
                      Invite user
                    </button>
                  }
                >
                  <div className="mb-4 max-w-[420px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search users, roles or regions"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-[#cfd8f6] focus:bg-white focus:ring-4 focus:ring-[#eef3ff]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_170px_130px_110px]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {user.email}
                          </p>
                          <p className="mt-2 truncate text-xs text-slate-500">
                            {user.regions.join(" · ")}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Role
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {roleLabel(user.role)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Status
                          </p>
                          <div className="mt-1">
                            <StatusPill
                              tone={
                                user.status === "active"
                                  ? "green"
                                  : user.status === "invited"
                                    ? "amber"
                                    : "slate"
                              }
                            >
                              {statusLabel(user.status)}
                            </StatusPill>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="self-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                        >
                          Manage
                        </button>
                      </div>
                    ))}
                  </div>
                </SettingCard>
              ) : null}

              {activeTab === "permissions" ? (
                <SettingCard
                  title="Roles & Permission Matrix"
                  description="Define what creators, approvers, regional admins and global admins can do."
                  icon={<KeyRound className="h-5 w-5" />}
                >
                  <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                    <div className="min-w-[760px]">
                      <div className="grid grid-cols-[minmax(240px,1fr)_120px_120px_150px_130px] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        <div>Permission</div>
                        <div className="text-center">Creator</div>
                        <div className="text-center">Approver</div>
                        <div className="text-center">Regional Admin</div>
                        <div className="text-center">Global Admin</div>
                      </div>

                      {PERMISSIONS.map((permission) => (
                        <div
                          key={permission.label}
                          className="grid grid-cols-[minmax(240px,1fr)_120px_120px_150px_130px] border-t border-slate-200 bg-white px-4 py-4 text-sm"
                        >
                          <div className="font-medium text-slate-800">
                            {permission.label}
                          </div>
                          <PermissionCheck value={permission.creator} />
                          <PermissionCheck value={permission.approver} />
                          <PermissionCheck value={permission.regionalAdmin} />
                          <PermissionCheck value={permission.globalAdmin} />
                        </div>
                      ))}
                    </div>
                  </div>
                </SettingCard>
              ) : null}

              {activeTab === "templates" ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                  <SettingCard
                    title="Global Template Mode"
                    description="Control how templates behave across all regional workspaces."
                    icon={<LayoutTemplate className="h-5 w-5" />}
                  >
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-[#dbe5ff] bg-[#f8faff] p-5">
                        <p className="text-sm font-semibold text-[#4f6fff]">
                          Recommended MVP mode
                        </p>
                        <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                          Global templates, regional pages and blocks
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Corporate controls the templates. Regional teams use those templates to create local pages and governed regional blocks.
                        </p>
                      </div>

                      <ToggleRow
                        title="Global templates only"
                        description="Only global admins can create, edit and publish templates."
                        checked
                        locked
                      />
                      <ToggleRow
                        title="Allow regional template overrides"
                        description="Let regional admins request or create local variations of templates."
                        checked={false}
                      />
                      <ToggleRow
                        title="Require template approval before use"
                        description="Templates must be approved before regional teams can create pages from them."
                        checked
                      />
                    </div>
                  </SettingCard>

                  <SettingCard
                    title="Template Governance"
                    description="Enterprise rules for how templates can be changed."
                    icon={<Lock className="h-5 w-5" />}
                  >
                    <div className="space-y-3">
                      {[
                        "Section order controlled globally",
                        "Required sections cannot be removed regionally",
                        "Allowed block types controlled globally",
                        "Regional pages inherit template updates",
                        "Major template changes require approval",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium text-slate-800">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SettingCard>
                </div>
              ) : null}

              {activeTab === "approvals" ? (
                <SettingCard
                  title="Global Approval Policies"
                  description="Set default approval requirements inherited by all regions."
                  icon={<ClipboardCheck className="h-5 w-5" />}
                >
                  <div className="grid gap-4 xl:grid-cols-2">
                    <ToggleRow
                      title="Require block approval"
                      description="Generated blocks must be reviewed before they can be deployed."
                      checked
                    />
                    <ToggleRow
                      title="Require page approval"
                      description="Full pages must be approved before publishing."
                      checked
                    />
                    <ToggleRow
                      title="Require template approval"
                      description="New templates and structural changes must be approved."
                      checked
                      locked
                    />
                    <ToggleRow
                      title="Auto-approve low-risk changes"
                      description="Allow minor copy edits to bypass manual review where governance score is high."
                      checked={false}
                    />
                    <ToggleRow
                      title="Regional approver routing"
                      description="Route regional page/block approvals to local approvers first."
                      checked
                    />
                    <ToggleRow
                      title="Global escalation"
                      description="Escalate high-risk or compliance-sensitive changes to global admins."
                      checked
                    />
                  </div>
                </SettingCard>
              ) : null}

              {activeTab === "governance" ? (
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <SettingCard
                    title="Locked Global Rules"
                    description="Rules regional teams inherit and cannot change unless global allows it."
                    icon={<ShieldCheck className="h-5 w-5" />}
                  >
                    <div className="space-y-3">
                      {[
                        "Primary colours",
                        "Typography",
                        "CTA style",
                        "Accessibility standard",
                        "Claim rules",
                        "Template structure",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <span className="text-sm font-medium text-slate-800">
                            {item}
                          </span>
                          <StatusPill tone="blue">Locked</StatusPill>
                        </div>
                      ))}
                    </div>
                  </SettingCard>

                  <SettingCard
                    title="Allowed Regional Overrides"
                    description="Controlled settings regions can localise without breaking global governance."
                    icon={<SlidersHorizontal className="h-5 w-5" />}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Local language",
                        "Regional CTAs",
                        "Contact details",
                        "Legal disclaimers",
                        "Regional imagery guidance",
                        "CMS environment",
                        "Regional approvers",
                        "Market terminology",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-500" />
                          <p className="text-sm font-semibold text-slate-900">
                            {item}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Editable in regional settings when enabled globally.
                          </p>
                        </div>
                      ))}
                    </div>
                  </SettingCard>
                </div>
              ) : null}

              {activeTab === "integrations" ? (
                <SettingCard
                  title="CMS Integrations"
                  description="Connect and manage the CMS environments used by each region."
                  icon={<PlugZap className="h-5 w-5" />}
                >
                  <div className="grid gap-4">
                    {REGIONS.map((region) => (
                      <div
                        key={region.id}
                        className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {region.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {region.domain} · {region.cms}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <StatusPill
                            tone={region.cms === "Not connected" ? "amber" : "green"}
                          >
                            {region.cms === "Not connected"
                              ? "Not connected"
                              : "Connected"}
                          </StatusPill>

                          <button
                            type="button"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                          >
                            Configure
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingCard>
              ) : null}

              {activeTab === "analytics" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Total Pages"
                    value={totalPages}
                    icon={<FileText className="h-5 w-5" />}
                  />
                  <MetricCard
                    label="Total Blocks"
                    value={totalBlocks}
                    icon={<Sparkles className="h-5 w-5" />}
                  />
                  <MetricCard
                    label="Pending Approvals"
                    value={totalApprovals}
                    tone="amber"
                    icon={<ClipboardCheck className="h-5 w-5" />}
                  />
                  <MetricCard
                    label="Governance Score"
                    value={`${averageCompliance}%`}
                    tone="green"
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />

                  <div className="md:col-span-2 xl:col-span-4">
                    <SettingCard
                      title="Regional Performance"
                      description="Enterprise-wide view of regional activity and governance health."
                      icon={<Activity className="h-5 w-5" />}
                    >
                      <div className="space-y-3">
                        {REGIONS.map((region) => (
                          <div
                            key={region.id}
                            className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {region.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {region.pages} pages · {region.blocks} blocks · {region.approvals} approvals
                                </p>
                              </div>
                              <StatusPill tone={region.compliance ? "green" : "slate"}>
                                {region.compliance ? `${region.compliance}%` : "No data"}
                              </StatusPill>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SettingCard>
                  </div>
                </div>
              ) : null}

              {activeTab === "audit" ? (
                <SettingCard
                  title="Audit Logs"
                  description="Track global admin changes, governance updates and enterprise-level activity."
                  icon={<DatabaseZap className="h-5 w-5" />}
                >
                  <div className="space-y-3">
                    {[
                      {
                        title: "Global template mode updated",
                        description: "Template mode changed to Global templates with regional page creation.",
                        type: "template",
                        actor: "Jamie Gregg",
                        time: "Today, 10:42",
                      },
                      {
                        title: "Mediascout France region created",
                        description: "New regional workspace created with inherited global governance.",
                        type: "region",
                        actor: "Jamie Gregg",
                        time: "Yesterday, 16:20",
                      },
                      {
                        title: "Block approval policy changed",
                        description: "Block approvals now require approver or global admin sign-off.",
                        type: "approval",
                        actor: "Jamie Gregg",
                        time: "Yesterday, 12:04",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {item.title}
                              </h3>
                              <StatusPill tone="blue">{item.type}</StatusPill>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {item.description}
                            </p>
                          </div>

                          <div className="text-left text-xs text-slate-500 lg:text-right">
                            <p className="font-semibold text-slate-700">
                              {item.actor}
                            </p>
                            <p className="mt-1">{item.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingCard>
              ) : null}
            </section>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-[#f5f7fb] px-6 py-4 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex flex-col gap-3 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-5">
                <span>Workspace: Mediascout Global</span>
                <span>Global governance: Active</span>
                <span>Regional inheritance: Enabled</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-[#5b7cff] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  Save global settings
                </button>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
