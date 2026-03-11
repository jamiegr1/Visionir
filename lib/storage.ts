import type { BlockData, BlockRecord } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __visionirBlockStore: Map<string, BlockRecord> | undefined;
}

const blockStore =
  globalThis.__visionirBlockStore ?? new Map<string, BlockRecord>();

if (!globalThis.__visionirBlockStore) {
  globalThis.__visionirBlockStore = blockStore;
}

function makeId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlock(data: BlockData): BlockRecord {
  const now = Date.now();

  const block: BlockRecord = {
    id: makeId(),
    data,
    status: "draft",
    approvalId: null,
    createdAt: now,
    updatedAt: now,
  };

  blockStore.set(block.id, block);

  console.log("[storage] created block:", block.id);
  console.log("[storage] total blocks after create:", blockStore.size);

  return block;
}

export function getBlockById(id: string): BlockRecord | null {
  const block = blockStore.get(id) ?? null;

  console.log("[storage] get block:", id, "found:", !!block);
  console.log("[storage] total blocks at read:", blockStore.size);

  return block;
}

export function updateBlock(
  id: string,
  updates: Partial<Pick<BlockRecord, "data" | "status" | "approvalId">>
): BlockRecord | null {
  const existing = blockStore.get(id);
  if (!existing) return null;

  const next: BlockRecord = {
    ...existing,
    ...updates,
    data: updates.data ?? existing.data,
    status: updates.status ?? existing.status,
    approvalId:
      updates.approvalId !== undefined ? updates.approvalId : existing.approvalId,
    updatedAt: Date.now(),
  };

  blockStore.set(id, next);

  console.log("[storage] updated block:", id);

  return next;
}

export function listBlocks(): BlockRecord[] {
  return Array.from(blockStore.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}