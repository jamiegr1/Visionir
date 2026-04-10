"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Plus } from "lucide-react";

type PageSection = {
  id: string;
  name: string;
  allowedBlocks: string[];
  required: boolean;
  blockId?: string;
};

type PageRecord = {
  id: string;
  name: string;
  templateId: string;
  sections: PageSection[];
  status: "draft" | "in_progress" | "complete";
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PageBuilder() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageRecord | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(`/api/pages/${id}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          setPage(null);
          return;
        }

        setPage(json.page);
      } catch (err) {
        console.error(err);
        setPage(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadPage();
  }, [id]);

  const completedSections = useMemo(() => {
    return page?.sections.filter((s) => s.blockId).length ?? 0;
  }, [page]);

  const totalSections = page?.sections.length ?? 0;

  function handleCreateBlock(section: PageSection) {
    router.push(
      `/blocks/new?templateSection=${section.id}&allowed=${section.allowedBlocks.join(",")}&pageId=${id}`
    );
  }

  function handleOpenBlock(section: PageSection) {
    if (!section.blockId) return;
    router.push(`/blocks/${section.blockId}/details`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading page…
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Page not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto max-w-[1100px]">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/templates")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to templates
            </button>

            <h1 className="text-[28px] font-semibold text-slate-900">
              {page.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete each section to build your page
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">Progress</p>
            <p className="text-lg font-semibold text-slate-900">
              {completedSections} / {totalSections}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[#5b7cff] transition-all"
            style={{
              width: `${(completedSections / totalSections) * 100}%`,
            }}
          />
        </div>

        {/* SECTIONS */}
        <div className="space-y-4">
          {page.sections.map((section, index) => {
            const isComplete = Boolean(section.blockId);

            return (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* ICON */}
                  <div>
                    {isComplete ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  {/* TEXT */}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {section.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {section.required ? "Required section" : "Optional"}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <div>
                  {isComplete ? (
                    <button
                      onClick={() => handleOpenBlock(section)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      View Block
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreateBlock(section)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#5b7cff] px-4 py-2 text-sm text-white hover:bg-[#4c6ff5]"
                    >
                      <Plus className="h-4 w-4" />
                      Create Block
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPLETE CTA */}
        {completedSections === totalSections && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-sm font-semibold text-emerald-700">
              Page complete
            </p>
            <p className="mt-1 text-sm text-emerald-600">
              This page is ready for review and deployment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}