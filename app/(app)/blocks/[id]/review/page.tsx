"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { BlockData } from "@/lib/types";
import type { Role } from "@/lib/permissions";
import { makePreviewHtml } from "@/lib/preview";
import { evaluateBlockGovernance } from "@/lib/brand-governance";
import ReviewEdit, {
  type ChangeLogItem,
} from "../../new/_components/ReviewEdit";

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function createTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getUserLabel(userId?: string | null) {
  if (!userId) return "—";
  if (userId === "user-1") return "Jamie";
  if (userId === "user-2") return "Approver";
  return userId;
}

function formatSelectionLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatImageSourceModeLabel(value?: string | null) {
  if (!value) return "—";
  if (value === "none") return "No Image";
  if (value === "upload") return "Uploaded Brand Image";
  if (value === "gallery") return "Brand Gallery";
  return formatSelectionLabel(value);
}

function cloneBlockData(data: BlockData): BlockData {
  return JSON.parse(JSON.stringify(data));
}

function cloneAiMap(map: Record<string, boolean>) {
  return JSON.parse(JSON.stringify(map));
}

function isEqualBlockData(a: BlockData | null, b: BlockData | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isStatsComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("stats");
}

function isLogoComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("logo") || value.includes("trust");
}

function isFaqComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("faq");
}

function isTestimonialComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("testimonial") || value.includes("quote");
}

function getRepeaterTitleLabel(componentType?: string) {
  if (isStatsComponent(componentType)) return "Value";
  if (isLogoComponent(componentType)) return "Name";
  if (isFaqComponent(componentType)) return "Question";
  if (isTestimonialComponent(componentType)) return "Label";
  return "Title";
}

function getRepeaterTextLabel(componentType?: string) {
  if (isStatsComponent(componentType)) return "Description";
  if (isLogoComponent(componentType)) return "Supporting Copy";
  if (isFaqComponent(componentType)) return "Answer";
  return "Copy";
}

function getFirstDiff(
  prev: BlockData,
  next: BlockData
): { label: string; from: string; to: string } | null {
  const rootFields: Array<{ key: keyof BlockData; label: string; format?: (value: unknown) => string }> = [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "headline", label: "Primary Headline" },
    { key: "subheading", label: "Subheading" },
    {
      key: "componentType",
      label: "Block Type",
      format: (value) => formatSelectionLabel(String(value ?? "")),
    },
    {
      key: "componentVariant",
      label: "Block Variant",
      format: (value) => formatSelectionLabel(String(value ?? "")),
    },
    { key: "pageName", label: "Page Name" },
    { key: "templateName", label: "Template Name" },
    { key: "sectionLabel", label: "Section Label" },
    {
      key: "contentLength",
      label: "Content Length",
      format: (value) => String(value ?? "—"),
    },
    {
      key: "imageSourceMode",
      label: "Image Source",
      format: (value) => formatImageSourceModeLabel(String(value ?? "")),
    },
    {
      key: "generatedFromPrompt",
      label: "Generation Prompt",
      format: (value) => String(value ?? ""),
    },
  ];

  for (const field of rootFields) {
    const beforeRaw = prev[field.key];
    const afterRaw = next[field.key];

    const before = field.format
      ? field.format(beforeRaw)
      : String(beforeRaw ?? "");
    const after = field.format ? field.format(afterRaw) : String(afterRaw ?? "");

    if (before !== after) {
      return {
        label: field.label,
        from: before,
        to: after,
      };
    }
  }

  const componentType = next.componentType || prev.componentType;

  const prevPoints = prev.valuePoints ?? [];
  const nextPoints = next.valuePoints ?? [];
  const maxLength = Math.max(prevPoints.length, nextPoints.length);

  for (let i = 0; i < maxLength; i++) {
    const prevPoint = prevPoints[i];
    const nextPoint = nextPoints[i];

    const prevTitle = String(prevPoint?.title ?? "");
    const nextTitle = String(nextPoint?.title ?? "");
    if (prevTitle !== nextTitle) {
      return {
        label: `Item ${i + 1} ${getRepeaterTitleLabel(componentType)}`,
        from: prevTitle,
        to: nextTitle,
      };
    }

    const prevText = String(prevPoint?.text ?? "");
    const nextText = String(nextPoint?.text ?? "");
    if (prevText !== nextText) {
      return {
        label: `Item ${i + 1} ${getRepeaterTextLabel(componentType)}`,
        from: prevText,
        to: nextText,
      };
    }

    const prevAccent = String(prevPoint?.accent ?? "");
    const nextAccent = String(nextPoint?.accent ?? "");
    if (prevAccent !== nextAccent) {
      return {
        label: `Item ${i + 1} Accent`,
        from: prevAccent,
        to: nextAccent,
      };
    }
  }

  return null;
}

type HistorySnapshot = {
  data: BlockData;
  aiImprovedFields: Record<string, boolean>;
};

type EditMode = "standard" | "page_builder";

type ApiBlockRecord = {
  id: string;
  status?: string;
  data?: BlockData | null;
  changesRequestedByUserId?: string | null;
  changesRequestedAt?: string | null;
  changesRequestedNotes?: string | null;
  changesRequestedFields?: string[] | null;
};

export default function BlockReviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id;

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const editMode = useMemo<EditMode>(() => {
    return searchParams.get("editMode") === "page_builder"
      ? "page_builder"
      : "standard";
  }, [searchParams]);

  const returnTo = useMemo(
    () => searchParams.get("returnTo") || "",
    [searchParams]
  );

  const isPageBuilderEdit = editMode === "page_builder" || Boolean(returnTo);

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [describe, setDescribe] = useState("");
  const [changeLog, setChangeLog] = useState<ChangeLogItem[]>([]);
  const [pendingPatchExists, setPendingPatchExists] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [aiImprovedFields, setAiImprovedFields] = useState<Record<string, boolean>>(
    {}
  );
  const [blockRecord, setBlockRecord] = useState<ApiBlockRecord | null>(null);

  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const previousEditableRef = useRef<BlockData | null>(null);
  const previousAiImprovedRef = useRef<Record<string, boolean>>({});
  const isInitialisingRef = useRef(true);
  const historyActionRef = useRef<"undo" | "redo" | null>(null);

  useEffect(() => {
    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}?role=${role}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block?.data) {
          setEditable(null);
          setBlockRecord(null);
          return;
        }

        const loadedBlock = json.block as ApiBlockRecord;
        const loaded = cloneBlockData(loadedBlock.data as BlockData);
        const currentStatus = String(loadedBlock?.status || "");

        setBlockRecord(loadedBlock);
        setEditable(loaded);
        setAiImprovedFields({});
        setUndoStack([]);
        setRedoStack([]);
        setChangeLog([]);
        previousEditableRef.current = cloneBlockData(loaded);
        previousAiImprovedRef.current = {};
        setPendingPatchExists(currentStatus === "pending_approval");
        setRequiresApproval(
          currentStatus === "pending_approval" ||
            currentStatus === "changes_requested"
        );
        isInitialisingRef.current = true;
      } catch (error) {
        console.error("Failed to load review page:", error);
        setEditable(null);
        setBlockRecord(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadBlock();
    }
  }, [id, role]);

  useEffect(() => {
    if (!editable) return;

    if (isInitialisingRef.current) {
      previousEditableRef.current = cloneBlockData(editable);
      previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
      isInitialisingRef.current = false;
      return;
    }

    const previous = previousEditableRef.current;
    const previousAi = previousAiImprovedRef.current;

    if (!previous) {
      previousEditableRef.current = cloneBlockData(editable);
      previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
      return;
    }

    const dataChanged = !isEqualBlockData(previous, editable);
    const aiChanged =
      JSON.stringify(previousAi) !== JSON.stringify(aiImprovedFields);

    if (!dataChanged && !aiChanged) {
      return;
    }

    const diff = dataChanged ? getFirstDiff(previous, editable) : null;

    if (historyActionRef.current === "undo") {
      if (diff) {
        setChangeLog((prev) => [
          {
            id: crypto.randomUUID(),
            label: `Undo • ${diff.label}`,
            from: diff.to,
            to: diff.from,
            time: createTimeLabel(),
          },
          ...prev,
        ]);
      }

      historyActionRef.current = null;
      previousEditableRef.current = cloneBlockData(editable);
      previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
      return;
    }

    if (historyActionRef.current === "redo") {
      if (diff) {
        setChangeLog((prev) => [
          {
            id: crypto.randomUUID(),
            label: `Redo • ${diff.label}`,
            from: diff.from,
            to: diff.to,
            time: createTimeLabel(),
          },
          ...prev,
        ]);
      }

      historyActionRef.current = null;
      previousEditableRef.current = cloneBlockData(editable);
      previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
      return;
    }

    setUndoStack((prev) => [
      ...prev,
      {
        data: cloneBlockData(previous),
        aiImprovedFields: cloneAiMap(previousAi),
      },
    ]);
    setRedoStack([]);

    if (diff) {
      setChangeLog((prev) => [
        {
          id: crypto.randomUUID(),
          label: diff.label,
          from: diff.from,
          to: diff.to,
          time: createTimeLabel(),
        },
        ...prev,
      ]);
    }

    previousEditableRef.current = cloneBlockData(editable);
    previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
  }, [editable, aiImprovedFields]);

  const previewDoc = useMemo(() => {
    if (!editable) return "<html><body></body></html>";

    const shouldHideImage = editable.imageSourceMode === "none";
    const rawImageUrl =
      !shouldHideImage &&
      typeof editable.imageUrl === "string" &&
      editable.imageUrl.trim()
        ? editable.imageUrl
        : undefined;

    let resolvedImageUrl = rawImageUrl;

    if (typeof window !== "undefined" && resolvedImageUrl) {
      const isAbsolute = /^https?:\/\//i.test(resolvedImageUrl);

      if (!isAbsolute) {
        const cleanPath = resolvedImageUrl.startsWith("/")
          ? resolvedImageUrl
          : `/${resolvedImageUrl}`;

        resolvedImageUrl = `${window.location.origin}${cleanPath}`;
      }
    }

    return makePreviewHtml({
      ...editable,
      imageUrl: resolvedImageUrl,
    });
  }, [editable]);

  const governance = useMemo(() => {
    return evaluateBlockGovernance(editable);
  }, [editable]);

  const changesRequestedInfo = useMemo(() => {
    if (!blockRecord || blockRecord.status !== "changes_requested") {
      return null;
    }

    return {
      requestedBy: getUserLabel(blockRecord.changesRequestedByUserId),
      requestedAt: formatDateTime(blockRecord.changesRequestedAt),
      notes: blockRecord.changesRequestedNotes ?? "",
      fields: Array.isArray(blockRecord.changesRequestedFields)
        ? blockRecord.changesRequestedFields
        : [],
    };
  }, [blockRecord]);

  async function saveBlock(nextStatus?: string) {
    if (!editable) return;

    const res = await fetch(`/api/blocks/${id}?role=${role}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: editable,
        ...(nextStatus ? { status: nextStatus } : {}),
        editMode: isPageBuilderEdit ? "page_builder" : "standard",
        requiresApproval,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.error || "Failed to save block");
    }

    if (json?.block) {
      const nextBlock = json.block as ApiBlockRecord;
      const nextApiStatus = String(nextBlock.status || "");

      setBlockRecord(nextBlock);
      setPendingPatchExists(nextApiStatus === "pending_approval");
      setRequiresApproval(
        nextApiStatus === "pending_approval" ||
          nextApiStatus === "changes_requested"
      );

      if (nextBlock.data) {
        const nextData = cloneBlockData(nextBlock.data);
        setEditable(nextData);
        previousEditableRef.current = cloneBlockData(nextData);
        previousAiImprovedRef.current = cloneAiMap(aiImprovedFields);
      }
    }
  }

  async function improveField(
    field: string,
    text: string,
    apply: (improved: string) => void
  ) {
    const source = text.trim();
    if (!source) return;

    try {
      const res = await fetch(`/api/improve?role=${role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field,
          text: source,
          componentType: editable?.componentType,
          componentVariant: editable?.componentVariant,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Improve request failed:", json);
        throw new Error(json?.error || "Failed to improve field");
      }

      const improved =
        typeof json?.improved === "string" ? json.improved.trim() : "";

      if (!improved) {
        throw new Error("No improved text returned");
      }

      apply(improved);
      setAiImprovedFields((prev) => ({ ...prev, [field]: true }));
    } catch (error) {
      console.error("Failed to improve field:", error);
    }
  }

  async function requestDescribeChanges() {
    if (!editable || !describe.trim()) return;

    try {
      const res = await fetch(`/api/describe-changes?role=${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: describe,
          blockData: editable,
          componentType: editable.componentType,
          componentVariant: editable.componentVariant,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to apply describe changes");
      }

      const patched = json?.blockData as BlockData | undefined;
      if (!patched) return;

      const mergedPatched: BlockData = {
        ...editable,
        ...patched,
        valuePoints: patched.valuePoints ?? editable.valuePoints,
        design: patched.design ?? editable.design,
        extraContent: patched.extraContent ?? editable.extraContent,
      };

      setEditable(mergedPatched);
      setRequiresApproval(true);

      setChangeLog((prev) => [
        {
          id: crypto.randomUUID(),
          label: "Describe Changes",
          from: describe,
          to: "Applied requested refinements to the block.",
          time: createTimeLabel(),
        },
        ...prev,
      ]);

      setDescribe("");
    } catch (error) {
      console.error("Failed to apply describe changes:", error);
    }
  }

  function handleUndo() {
    if (!editable || undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const current: HistorySnapshot = {
      data: cloneBlockData(editable),
      aiImprovedFields: cloneAiMap(aiImprovedFields),
    };

    historyActionRef.current = "undo";
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, current]);
    setEditable(cloneBlockData(previous.data));
    setAiImprovedFields(cloneAiMap(previous.aiImprovedFields));
  }

  function handleRedo() {
    if (!editable || redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const current: HistorySnapshot = {
      data: cloneBlockData(editable),
      aiImprovedFields: cloneAiMap(aiImprovedFields),
    };

    historyActionRef.current = "redo";
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, current]);
    setEditable(cloneBlockData(next.data));
    setAiImprovedFields(cloneAiMap(next.aiImprovedFields));
  }

  function handleResetAiImproved(key: string) {
    setAiImprovedFields((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: false };
    });
  }

  async function handleSaveDraft() {
    try {
      await saveBlock("draft");
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }

  async function handlePrimaryPageBuilderAction() {
    try {
      if (requiresApproval) {
        await saveBlock("pending_approval");
        router.push(`/blocks/${id}/approval?role=${role}`);
        return;
      }

      await saveBlock();

      if (returnTo) {
        router.push(returnTo);
        return;
      }

      router.push(`/pages?role=${role}`);
    } catch (error) {
      console.error("Failed to finish page-builder edit:", error);
    }
  }

  async function handleSubmitApproval() {
    try {
      if (isPageBuilderEdit) {
        await handlePrimaryPageBuilderAction();
        return;
      }

      await saveBlock("pending_approval");
      router.push(`/blocks/${id}/approval?role=${role}`);
    } catch (error) {
      console.error("Failed to submit for approval:", error);
    }
  }

  function handleBack() {
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    router.push(`/blocks/${id}/details?role=${role}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading…
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Block not found.
      </div>
    );
  }

  return (
    <ReviewEdit
      editable={editable}
      setEditable={setEditable}
      previewDoc={previewDoc}
      describe={describe}
      setDescribe={setDescribe}
      improveField={improveField}
      requestDescribeChanges={requestDescribeChanges}
      pendingPatchExists={pendingPatchExists}
      governance={governance}
      mode={isPageBuilderEdit ? "page_builder" : "standard"}
      onBack={handleBack}
      backLabel={returnTo ? "Back to Page" : "Back to Block Detail"}
      onPrimaryAction={
        isPageBuilderEdit ? handlePrimaryPageBuilderAction : undefined
      }
      primaryActionLabel={
        requiresApproval ? "Submit for Approval" : "Use This Block"
      }
      primaryActionDisabled={pendingPatchExists}
      onSaveDraft={isPageBuilderEdit ? undefined : handleSaveDraft}
      onSubmitApproval={!isPageBuilderEdit ? handleSubmitApproval : undefined}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={undoStack.length > 0}
      canRedo={redoStack.length > 0}
      aiImprovedFields={aiImprovedFields}
      onResetAiImproved={handleResetAiImproved}
      changeLog={changeLog}
      canEdit={!pendingPatchExists}
      canSubmit={!pendingPatchExists}
      canPublish={false}
      changesRequestedInfo={changesRequestedInfo}
    />
  );
}