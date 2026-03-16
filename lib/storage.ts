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

async function readBlocks(): Promise<BlockRecord[]> {
  await ensureStorageFile();

  try {
    const raw = await fs.readFile(BLOCKS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as BlockRecord[];
  } catch {
    return [];
  }
}

async function writeBlocks(blocks: BlockRecord[]) {
  await ensureStorageFile();
  await fs.writeFile(BLOCKS_FILE, JSON.stringify(blocks, null, 2), "utf8");
}

export async function createBlock(
  data: BlockData,
  meta: Omit<BlockRecord, "id" | "data">
): Promise<BlockRecord> {
  const blocks = await readBlocks();
  const id = crypto.randomUUID();

  const record: BlockRecord = {
    id,
    data,
    ...meta,
  };

  blocks.push(record);
  await writeBlocks(blocks);

  return record;
}

export async function listBlocks(): Promise<BlockRecord[]> {
  const blocks = await readBlocks();
  return [...blocks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
    data: patch.data ?? existing.data,
  };

  blocks[index] = updated;
  await writeBlocks(blocks);

  return updated;
}