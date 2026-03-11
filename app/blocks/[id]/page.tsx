"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReviewEdit from "../new/_components/ReviewEdit";
import type { BlockData, Accent } from "@/lib/types";
import { makePreviewHtml } from "@/lib/preview";

type Governance =
  | {
      score: number;
      checks: Array<{ id: string; label: string; ok: boolean }>;
      bannedHit?: string | null;
    }
  | null;

type ApprovalStatus = "none" | "pending" | "approved" | "rejected";

type ChangeLogItem = {
  id: string;
  label: string;
  from: string;
  to: string;
  time: string;
};

const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

function isAccent(value: unknown): value is Accent {
  return (
    value === "blue" ||
    value === "green" ||
    value === "orange" ||
    value === "purple"
  );
}

function normaliseBlock(block: any): BlockData {
  const source = block?.data ?? block ?? {};
  console.log("source.imageUrl:", source?.imageUrl);
console.log("final imageUrl:", typeof source?.imageUrl === "string" && source.imageUrl.trim()
  ? source.imageUrl
  : DEFAULT_BLOCK_IMAGE);

  return {
    eyebrow: source?.eyebrow ?? "",
    headline: source?.headline ?? "",
    subheading: source?.subheading ?? "",
    imageUrl: DEFAULT_BLOCK_IMAGE,
    valuePoints: Array.isArray(source?.valuePoints)
      ? source.valuePoints.map((point: any) => ({
          title: point?.title ?? "",
          text: point?.text ?? "",
          accent: isAccent(point?.accent) ? point.accent : "blue",
        }))
      : [],
    design: source?.design ?? {
      theme: "light",
      layout: "default",
      variant: "standard",
    },
  };
}

function truncateText(value: string, max = 80) {
  if (!value) return "Empty";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function getFieldChanges(prev: BlockData, next: BlockData): ChangeLogItem[] {
  const changes: ChangeLogItem[] = [];
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pushChange = (label: string, from: string, to: string) => {
    if (from !== to) {
      changes.push({
        id: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label,
        from: truncateText(from),
        to: truncateText(to),
        time: now,
      });
    }
  };

  pushChange("Eyebrow", prev.eyebrow || "", next.eyebrow || "");
  pushChange("Headline", prev.headline || "", next.headline || "");
  pushChange("Subheading", prev.subheading || "", next.subheading || "");
  pushChange("Image URL", prev.imageUrl || "", next.imageUrl || "");

  const maxPoints = Math.max(
    prev.valuePoints?.length ?? 0,
    next.valuePoints?.length ?? 0
  );

  for (let i = 0; i < maxPoints; i++) {
    const prevPoint = prev.valuePoints?.[i];
    const nextPoint = next.valuePoints?.[i];

    pushChange(
      `Value Point ${i + 1} Title`,
      prevPoint?.title || "",
      nextPoint?.title || ""
    );

    pushChange(
      `Value Point ${i + 1} Text`,
      prevPoint?.text || "",
      nextPoint?.text || ""
    );

    pushChange(
      `Value Point ${i + 1} Accent`,
      prevPoint?.accent || "",
      nextPoint?.accent || ""
    );
  }

  return changes;
}

export default function BlockIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [editable, setEditable] = useState<BlockData | null>(null);
  const [describe, setDescribe] = useState("");
  const [pendingPatch, setPendingPatch] = useState<unknown>(null);
  const [governance, setGovernance] = useState<Governance>(null);
  const [approvalStatus, setApprovalStatus] =
    useState<ApprovalStatus>("none");
  const [changeLog, setChangeLog] = useState<ChangeLogItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const loadBlock = async () => {
      try {
        const res = await fetch(`/api/blocks/${id}`, { cache: "no-store" });

        if (!res.ok) {
          console.error("Failed to load block");
          return;
        }

        const data = await res.json();
        console.log("RAW BLOCK API RESPONSE:", data);

        const rawBlock = data?.block ?? data;

        if (!rawBlock) {
          console.error("No block returned from API");
          return;
        }

        const normalised = normaliseBlock(rawBlock);
        console.log("NORMALISED BLOCK:", normalised);

        setEditable(normalised);

        setApprovalStatus(
          rawBlock.status === "pending_approval"
            ? "pending"
            : rawBlock.status === "approved"
            ? "approved"
            : rawBlock.status === "rejected"
            ? "rejected"
            : "none"
        );
      } catch (error) {
        console.error("Error loading block:", error);
      }
    };

    void loadBlock();
  }, [id]);

  const previewDoc = useMemo(() => {
    if (!editable) return "";
  
    let resolvedImageUrl = editable.imageUrl || "";
  
    if (typeof window !== "undefined" && resolvedImageUrl) {
      const isAbsolute = /^https?:\/\//i.test(resolvedImageUrl);
  
      if (!isAbsolute) {
        const cleanPath = resolvedImageUrl.startsWith("/")
          ? resolvedImageUrl
          : `/${resolvedImageUrl}`;
  
        resolvedImageUrl = `${window.location.origin}${cleanPath}`;
      }
    }
  
    console.log("editable.imageUrl:", editable.imageUrl);
    console.log("resolvedImageUrl:", resolvedImageUrl);
  
    return makePreviewHtml({
      ...editable,
      imageUrl: resolvedImageUrl,
    });
  }, [editable]);

  async function saveDataToDb(next: BlockData) {
    if (!id) return;

    try {
      await fetch(`/api/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: next,
        }),
      });
    } catch (error) {
      console.error("Failed to save block:", error);
    }
  }

  async function improveField(
    field: string,
    text: string,
    apply: (improved: string) => void
  ) {
    try {
      console.log("IMPROVE REQUEST:", { field, text });

      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, text }),
      });

      const data = await res.json().catch(() => null);
      console.log("IMPROVE RESPONSE:", data);

      if (!res.ok) {
        console.error("Failed to improve field", res.status, data);
        return;
      }

      const improvedText =
        data?.text ??
        data?.improved ??
        data?.content ??
        data?.result?.text ??
        data?.result?.content ??
        "";

      if (typeof improvedText === "string" && improvedText.trim()) {
        apply(improvedText);
      } else {
        console.error("No improved text returned from /api/refine", data);
      }
    } catch (error) {
      console.error("Error improving field:", error);
    }
  }

  async function requestDescribeChanges() {
    if (!editable || !describe.trim()) return;

    try {
      const res = await fetch("/api/describe-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: editable,
          describe,
        }),
      });

      if (!res.ok) {
        console.error("Failed to describe changes");
        return;
      }

      const data = await res.json();
      console.log("DESCRIBE CHANGES RESPONSE:", data);

      if (data?.patch) {
        setPendingPatch(data.patch);
      }

      const rawBlock = data?.block ?? null;

      if (rawBlock) {
        const next = normaliseBlock(rawBlock);
        const newChanges = getFieldChanges(editable, next);

        if (newChanges.length > 0) {
          setChangeLog((current) =>
            [...newChanges.reverse(), ...current].slice(0, 20)
          );
        }

        setEditable(next);
        await saveDataToDb(next);
        setDescribe("");
      }
    } catch (error) {
      console.error("Error applying described changes:", error);
    }
  }

  async function onSubmitForApproval() {
    if (!id) return;

    try {
      const res = await fetch(`/api/blocks/${id}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Failed to submit for approval");
        return;
      }

      setApprovalStatus("pending");
      router.push(`/blocks/${id}/approval`);
    } catch (error) {
      console.error("Error submitting for approval:", error);
    }
  }

  useEffect(() => {
    if (!editable) return;

    const score =
      editable.headline?.trim() &&
      editable.subheading?.trim() &&
      editable.valuePoints?.length &&
      editable.imageUrl?.trim()
        ? 96
        : editable.headline?.trim() &&
          editable.subheading?.trim() &&
          editable.valuePoints?.length
        ? 92
        : 68;

    setGovernance({
      score,
      checks: [
        {
          id: "headline",
          label: "Headline added",
          ok: !!editable.headline?.trim(),
        },
        {
          id: "subheading",
          label: "Subheading added",
          ok: !!editable.subheading?.trim(),
        },
        {
          id: "valuePoints",
          label: "Value points configured",
          ok: !!editable.valuePoints?.length,
        },
        {
          id: "image",
          label: "Approved image source provided",
          ok: !!editable.imageUrl?.trim(),
        },
      ],
      bannedHit: null,
    });
  }, [editable]);

  if (!editable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
          Loading block…
        </div>
      </div>
    );
  }

  return (
    <ReviewEdit
      editable={editable}
      setEditable={(updater) => {
        setEditable((prev) => {
          const next =
            typeof updater === "function"
              ? (updater as (prev: BlockData | null) => BlockData | null)(prev)
              : updater;

          if (next && prev) {
            const changed = JSON.stringify(next) !== JSON.stringify(prev);

            if (changed) {
              const newChanges = getFieldChanges(prev, next);

              if (newChanges.length > 0) {
                setChangeLog((current) =>
                  [...newChanges.reverse(), ...current].slice(0, 20)
                );
              }

              void saveDataToDb(next);
            }
          }

          return next;
        });
      }}
      previewDoc={previewDoc}
      describe={describe}
      setDescribe={setDescribe}
      improveField={improveField}
      requestDescribeChanges={requestDescribeChanges}
      pendingPatchExists={!!pendingPatch || approvalStatus === "pending"}
      governance={governance}
      onSubmitApproval={onSubmitForApproval}
      changeLog={changeLog}
    />
  );
}