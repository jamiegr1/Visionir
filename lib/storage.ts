import { promises as fs } from "fs";
import path from "path";
import type { BlockData, BlockRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".visionir-data");
const BLOCKS_FILE = path.join(DATA_DIR, "blocks.json");

async function ensureStorageFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(BLOCKS_FILE);
  } catch {
    await fs.writeFile(BLOCKS_FILE, "[]", "utf8");
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseBlockData(data: unknown): BlockData {
  const safeData = isObject(data) ? data : {};

  return {
    eyebrow: typeof safeData.eyebrow === "string" ? safeData.eyebrow : "",
    headline: typeof safeData.headline === "string" ? safeData.headline : "",
    subheading: typeof safeData.subheading === "string" ? safeData.subheading : "",
    imageUrl: typeof safeData.imageUrl === "string" ? safeData.imageUrl : undefined,
    valuePoints: Array.isArray(safeData.valuePoints)
      ? (safeData.valuePoints as BlockData["valuePoints"])
      : [],
    design: isObject(safeData.design)
      ? (safeData.design as BlockData["design"])
      : {
          theme: "enterprise",
          layout: "split",
          cardStyle: "soft",
          headingAlign: "left",
          borderRadius: "xl",
          shadow: "soft",
          background: "#f5f7fb",
          surface: "#ffffff",
          headingColor: "#0f172a",
          textColor: "#475569",
          eyebrowColor: "#1457d1",
          cardColors: {
            blue: "#3b82f6",
            green: "#22c55e",
            orange: "#f59e0b",
            purple: "#8b5cf6",
          },
        },
    componentType:
      typeof safeData.componentType === "string" ? safeData.componentType : undefined,
    componentVariant:
      typeof safeData.componentVariant === "string"
        ? safeData.componentVariant
        : undefined,
    pageId: typeof safeData.pageId === "string" ? safeData.pageId : undefined,
    pageName: typeof safeData.pageName === "string" ? safeData.pageName : undefined,
    sectionId:
      typeof safeData.sectionId === "string" ? safeData.sectionId : undefined,
    sectionLabel:
      typeof safeData.sectionLabel === "string" ? safeData.sectionLabel : undefined,
    sectionKey:
      typeof safeData.sectionKey === "string" ? safeData.sectionKey : undefined,
    templateName:
      typeof safeData.templateName === "string" ? safeData.templateName : undefined,
  };
}

function normaliseBlockRecord(record: unknown): BlockRecord | null {
  if (!isObject(record)) return null;

  if (typeof record.id !== "string") return null;
  if (typeof record.status !== "string") return null;
  if (!isObject(record.data)) return null;
  if (typeof record.createdByUserId !== "string") return null;
  if (typeof record.updatedByUserId !== "string") return null;
  if (typeof record.createdAt !== "string") return null;
  if (typeof record.updatedAt !== "string") return null;

  return {
    id: record.id,
    data: normaliseBlockData(record.data),
    status: record.status as BlockRecord["status"],
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    submittedByUserId:
      typeof record.submittedByUserId === "string" || record.submittedByUserId === null
        ? record.submittedByUserId
        : null,
    approvedByUserId:
      typeof record.approvedByUserId === "string" || record.approvedByUserId === null
        ? record.approvedByUserId
        : null,
    publishedByUserId:
      typeof record.publishedByUserId === "string" || record.publishedByUserId === null
        ? record.publishedByUserId
        : null,
    submittedAt:
      typeof record.submittedAt === "string" || record.submittedAt === null
        ? record.submittedAt
        : null,
    approvedAt:
      typeof record.approvedAt === "string" || record.approvedAt === null
        ? record.approvedAt
        : null,
    publishedAt:
      typeof record.publishedAt === "string" || record.publishedAt === null
        ? record.publishedAt
        : null,
    changesRequestedByUserId:
      typeof record.changesRequestedByUserId === "string" ||
      record.changesRequestedByUserId === null
        ? record.changesRequestedByUserId
        : null,
    changesRequestedAt:
      typeof record.changesRequestedAt === "string" ||
      record.changesRequestedAt === null
        ? record.changesRequestedAt
        : null,
    changesRequestedNotes:
      typeof record.changesRequestedNotes === "string" ||
      record.changesRequestedNotes === null
        ? record.changesRequestedNotes
        : null,
    changesRequestedFields: Array.isArray(record.changesRequestedFields)
      ? (record.changesRequestedFields as string[])
      : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function readBlocks(): Promise<BlockRecord[]> {
  await ensureStorageFile();

  try {
    const raw = await fs.readFile(BLOCKS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normaliseBlockRecord(item))
      .filter((item): item is BlockRecord => item !== null);
  } catch (error) {
    console.error("readBlocks failed:", error);
    return [];
  }
}

async function writeBlocks(blocks: BlockRecord[]) {
  await ensureStorageFile();
  await fs.writeFile(BLOCKS_FILE, JSON.stringify(blocks, null, 2), "utf8");
}

function getSortableTime(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export async function createBlock(
  data: BlockData,
  meta: Omit<BlockRecord, "id" | "data">
): Promise<BlockRecord> {
  const blocks = await readBlocks();
  const id = crypto.randomUUID();

  const record: BlockRecord = {
    id,
    data: normaliseBlockData(data),
    ...meta,
  };

  blocks.push(record);
  await writeBlocks(blocks);

  return record;
}

export async function listBlocks(): Promise<BlockRecord[]> {
  const blocks = await readBlocks();

  return [...blocks].sort((a, b) => {
    const aTime = getSortableTime(a.updatedAt);
    const bTime = getSortableTime(b.updatedAt);
    return bTime - aTime;
  });
}

export async function getBlockById(id: string): Promise<BlockRecord | null> {
  const blocks = await readBlocks();
  return blocks.find((block) => block.id === id) ?? null;
}

export async function updateBlock(
  id: string,
  patch: Partial<BlockRecord>
): Promise<BlockRecord | null> {
  const blocks = await readBlocks();
  const index = blocks.findIndex((block) => block.id === id);

  if (index === -1) return null;

  const existing = blocks[index];

  const updated: BlockRecord = {
    ...existing,
    ...patch,
    data: patch.data
      ? normaliseBlockData({
          ...existing.data,
          ...patch.data,
        })
      : existing.data,
  };

  blocks[index] = updated;
  await writeBlocks(blocks);

  return updated;
}