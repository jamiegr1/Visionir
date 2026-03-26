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
    data,
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
    data: patch.data ?? existing.data,
  };

  blocks[index] = updated;
  await writeBlocks(blocks);

  return updated;
}