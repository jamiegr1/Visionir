"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, LayoutTemplate } from "lucide-react";

type TemplateSummary = {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "published" | "archived";
  updatedAt?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = searchParams.get("role") || "admin";

  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);

        const res = await fetch(`/api/templates?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok && Array.isArray(json.templates)) {
          setTemplates(json.templates);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [role]);

  function handleCreateTemplate() {
    router.push(`/templates/new?role=${role}`);
  }

  function handleOpenTemplate(id: string) {
    router.push(`/templates/${id}?role=${role}`);
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-72px)] items-center justify-center text-slate-500">
        Loading templates…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb]">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
              Templates
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Define structured page types with governed blocks and layouts.
            </p>
          </div>

          <button
            onClick={handleCreateTemplate}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white shadow hover:bg-[#4c6ff5]"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        {/* Empty state */}
        {templates.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white py-20 text-center">
            <LayoutTemplate className="mb-4 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              No templates yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first template to start structuring pages.
            </p>
          </div>
        )}

        {/* Grid */}
        {templates.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleOpenTemplate(template.id)}
                className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      template.status === "published" &&
                        "bg-emerald-50 text-emerald-700",
                      template.status === "draft" &&
                        "bg-amber-50 text-amber-700",
                      template.status === "archived" &&
                        "bg-slate-100 text-slate-600"
                    )}
                  >
                    {template.status}
                  </span>
                </div>

                <h3 className="text-[16px] font-semibold text-slate-900">
                  {template.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {template.description || "No description provided"}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  Updated {template.updatedAt || "recently"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}