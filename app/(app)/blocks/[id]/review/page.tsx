"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { BlockData } from "@/lib/types";
import type { Role } from "@/lib/permissions";
import { makePreviewHtml } from "@/lib/preview";
import { evaluateBlockGovernance } from "@/lib/brand-governance";
import ReviewEdit, {
  type ChangeLogItem,
} from "@/app/blocks/new/_components/ReviewEdit";

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function createTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getFirstDiff(
  prev: BlockData,
  next: BlockData
): { label: string; from: string; to: string } | null {
  const rootFields: Array<{ key: keyof BlockData; label: string }> = [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "headline", label: "Primary Headline" },
    { key: "subheading", label: "Subheading" },
  ];

  for (const field of rootFields) {
    const before = String(prev[field.key] ?? "");
    const after = String(next[field.key] ?? "");

    if (before !== after) {
      return {
        label: field.label,
        from: before,
        to: after,
      };
    }
  }

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
        label: `Value Point ${i + 1} Title`,
        from: prevTitle,
        to: nextTitle,
      };
    }

    const prevText = String(prevPoint?.text ?? "");
    const nextText = String(nextPoint?.text ?? "");
    if (prevText !== nextText) {
      return {
        label: `Value Point ${i + 1} Copy`,
        from: prevText,
        to: nextText,
      };
    }

    const prevAccent = String(prevPoint?.accent ?? "");
    const nextAccent = String(nextPoint?.accent ?? "");
    if (prevAccent !== nextAccent) {
      return {
        label: `Value Point ${i + 1} Accent`,
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

export default function BlockReviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id;

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [describe, setDescribe] = useState("");
  const [changeLog, setChangeLog] = useState<ChangeLogItem[]>([]);
  const [pendingPatchExists, setPendingPatchExists] = useState(false);
  const [aiImprovedFields, setAiImprovedFields] = useState<Record<string, boolean>>(
    {}
  );

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
          return;
        }

        const loaded = json.block.data as BlockData;

        setEditable(loaded);
        setAiImprovedFields({});
        previousEditableRef.current = cloneBlockData(loaded);
        previousAiImprovedRef.current = {};
        setUndoStack([]);
        setRedoStack([]);
        setPendingPatchExists(json?.block?.status === "pending_approval");
        isInitialisingRef.current = true;
      } catch (error) {
        console.error("Failed to load review page:", error);
        setEditable(null);
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

  const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

  const previewDoc = useMemo(() => {
    if (!editable) return "<html><body></body></html>";

    const rawImageUrl =
      typeof editable.imageUrl === "string" && editable.imageUrl.trim()
        ? editable.imageUrl
        : DEFAULT_BLOCK_IMAGE;

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

  async function saveBlock(nextStatus?: string) {
    if (!editable) return;

    const res = await fetch(`/api/blocks/${id}?role=${role}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: editable,
        ...(nextStatus ? { status: nextStatus } : {}),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.error || "Failed to save block");
    }

    if (json?.block?.status) {
      setPendingPatchExists(json.block.status === "pending_approval");
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
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to apply describe changes");
      }

      const patched = json?.blockData as BlockData | undefined;
      if (!patched) return;

      setEditable(patched);

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

  async function handleSubmitApproval() {
    try {
      await saveBlock("pending_approval");
      router.push(`/blocks/${id}/approval?role=${role}`);
    } catch (error) {
      console.error("Failed to submit for approval:", error);
    }
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
      onSaveDraft={handleSaveDraft}
      onSubmitApproval={handleSubmitApproval}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={undoStack.length > 0}
      canRedo={redoStack.length > 0}
      aiImprovedFields={aiImprovedFields}
      onResetAiImproved={handleResetAiImproved}
      submitLabel="Submit for Approval"
      changeLog={changeLog}
      canEdit={!pendingPatchExists}
      canSubmit={!pendingPatchExists}
      canPublish={false}
    />
  );
}