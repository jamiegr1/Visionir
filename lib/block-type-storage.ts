import { promises as fs } from "fs";
import path from "path";
import type { ComponentSchema } from "@/lib/component-schema";
import type { BlockTypeStatus } from "@/lib/permissions";

const DATA_DIR = path.join(process.cwd(), ".visionir-data");
const BLOCK_TYPES_FILE = path.join(DATA_DIR, "block-types.json");

export type BlockTypeRecord = ComponentSchema & {
  status: BlockTypeStatus;
  createdByUserId: string;
  updatedByUserId: string;
  submittedByUserId?: string | null;
  approvedByUserId?: string | null;
  changesRequestedByUserId?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  changesRequestedAt?: string | null;
  changesRequestedNotes?: string | null;
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(BLOCK_TYPES_FILE);
  } catch {
    await fs.writeFile(BLOCK_TYPES_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

async function readBlockTypes(): Promise<BlockTypeRecord[]> {
  await ensureDataFile();

  const raw = await fs.readFile(BLOCK_TYPES_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlockTypes(blockTypes: BlockTypeRecord[]) {
  await ensureDataFile();
  await fs.writeFile(
    BLOCK_TYPES_FILE,
    JSON.stringify(blockTypes, null, 2),
    "utf8"
  );
}

export async function listBlockTypes() {
  return readBlockTypes();
}

export async function getBlockType(id: string) {
  const blockTypes = await readBlockTypes();
  return blockTypes.find((item) => item.id === id) || null;
}

export async function createBlockType(
  data: Omit<
    BlockTypeRecord,
    | "createdAt"
    | "updatedAt"
    | "createdByUserId"
    | "updatedByUserId"
    | "submittedByUserId"
    | "approvedByUserId"
    | "changesRequestedByUserId"
    | "submittedAt"
    | "approvedAt"
    | "changesRequestedAt"
    | "changesRequestedNotes"
  >,
  meta: {
    createdByUserId: string;
    updatedByUserId: string;
  }
) {
  const blockTypes = await readBlockTypes();
  const now = new Date().toISOString();

  const record: BlockTypeRecord = {
    ...data,
    createdByUserId: meta.createdByUserId,
    updatedByUserId: meta.updatedByUserId,
    submittedByUserId: null,
    approvedByUserId: null,
    changesRequestedByUserId: null,
    submittedAt: null,
    approvedAt: null,
    changesRequestedAt: null,
    changesRequestedNotes: null,
    createdAt: now,
    updatedAt: now,
  };

  blockTypes.unshift(record);
  await writeBlockTypes(blockTypes);

  return record;
}

export async function updateBlockType(
  id: string,
  updates: Partial<BlockTypeRecord>,
  meta: {
    updatedByUserId: string;
  }
) {
  const blockTypes = await readBlockTypes();
  const index = blockTypes.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updated: BlockTypeRecord = {
    ...blockTypes[index],
    ...updates,
    id: blockTypes[index].id,
    updatedByUserId: meta.updatedByUserId,
    updatedAt: new Date().toISOString(),
  };

  blockTypes[index] = updated;
  await writeBlockTypes(blockTypes);

  return updated;
}

export async function deleteBlockType(id: string) {
  const blockTypes = await readBlockTypes();
  const next = blockTypes.filter((item) => item.id !== id);

  await writeBlockTypes(next);

  return next.length !== blockTypes.length;
}