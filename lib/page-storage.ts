import { promises as fs } from "fs";
import path from "path";
import type {
  CreatePageFromTemplateInput,
  PageRecord,
  PageTemplateSectionInstance,
  UpdatePageInput,
} from "@/lib/template-types";
import { getTemplateById } from "@/lib/template-storage";
import { getBlockById } from "@/lib/storage";

const DATA_DIR = path.join(process.cwd(), ".visionir-data");
const PAGES_FILE = path.join(DATA_DIR, "pages.json");

async function ensurePagesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(PAGES_FILE);
  } catch {
    await fs.writeFile(PAGES_FILE, "[]", "utf8");
  }
}

async function readPages(): Promise<PageRecord[]> {
  await ensurePagesFile();

  try {
    const raw = await fs.readFile(PAGES_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as PageRecord[];
  } catch {
    return [];
  }
}

async function writePages(pages: PageRecord[]) {
  await ensurePagesFile();
  await fs.writeFile(PAGES_FILE, JSON.stringify(pages, null, 2), "utf8");
}

function getRequiredBlockCount(section: PageTemplateSectionInstance) {
  return Math.max(section.minInstances, section.required ? 1 : 0);
}

function isSectionComplete(section: PageTemplateSectionInstance) {
  const blockIds = Array.isArray(section.blockIds) ? section.blockIds : [];
  return blockIds.length >= getRequiredBlockCount(section);
}

function normaliseSectionInstances(
  sections: PageTemplateSectionInstance[]
): PageTemplateSectionInstance[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => {
      const safeBlockIds = Array.isArray(section.blockIds) ? section.blockIds : [];

      return {
        ...section,
        order: index,
        blockIds: safeBlockIds,
        completed: isSectionComplete({
          ...section,
          blockIds: safeBlockIds,
        }),
      };
    });
}

function derivePageStatusFromSections(
  existingStatus: PageRecord["status"],
  sections: PageTemplateSectionInstance[]
): PageRecord["status"] {
  const requiredSections = sections.filter((section) => section.required);
  const allRequiredComplete =
    requiredSections.length === 0 ||
    requiredSections.every((section) => section.completed);

  const hasAnyBlocks = sections.some((section) => section.blockIds.length > 0);

  if (existingStatus === "pending_approval") return "pending_approval";
  if (existingStatus === "changes_requested") return "changes_requested";
  if (existingStatus === "approved") return "approved";
  if (existingStatus === "published") return "published";
  if (existingStatus === "archived") return "archived";

  if (allRequiredComplete && hasAnyBlocks) {
    return "in_progress";
  }

  if (hasAnyBlocks) {
    return "in_progress";
  }

  return "draft";
}

export async function listPages(): Promise<PageRecord[]> {
  const pages = await readPages();
  return [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPageById(id: string): Promise<PageRecord | null> {
  const pages = await readPages();
  return pages.find((page) => page.id === id) ?? null;
}

export async function createPageFromTemplate(
  input: CreatePageFromTemplateInput
): Promise<PageRecord> {
  const template = await getTemplateById(input.templateId);

  if (!template) {
    throw new Error("Template not found.");
  }

  const pages = await readPages();
  const now = new Date().toISOString();

  const sections: PageTemplateSectionInstance[] = template.sections.map(
    (section) => ({
      sectionId: section.id,
      key: section.key,
      label: section.label,
      order: section.order,
      required: section.required,
      canSkip: section.canSkip,
      minInstances: section.minInstances,
      maxInstances: section.maxInstances,
      allowedComponentIds: section.allowedComponentIds,
      defaultComponentId: section.defaultComponentId ?? null,
      completed: false,
      blockIds: [],
    })
  );

  const normalisedSections = normaliseSectionInstances(sections);

  const page: PageRecord = {
    id: crypto.randomUUID(),
    templateId: template.id,
    templateVersion: template.version,
    templateName: template.name,
    name: input.name.trim(),
    slug: input.slug?.trim() || undefined,
    status: "draft",
    createdByUserId: input.createdByUserId,
    updatedByUserId: input.updatedByUserId,

    approvedByUserId: null,
    approvedAt: null,
    publishedByUserId: null,
    publishedAt: null,

    changesRequestedByUserId: null,
    changesRequestedAt: null,
    changesRequestedNotes: null,
    changesRequestedSections: null,

    createdAt: now,
    updatedAt: now,
    sections: normalisedSections,
  };

  pages.push(page);
  await writePages(pages);

  return page;
}

export async function updatePage(
  id: string,
  patch: UpdatePageInput
): Promise<PageRecord | null> {
  const pages = await readPages();
  const index = pages.findIndex((page) => page.id === id);

  if (index === -1) return null;

  const existing = pages[index];

  const nextSections = patch.sections
    ? normaliseSectionInstances(patch.sections)
    : existing.sections;

  const explicitStatus = patch.status;
  const derivedStatus = derivePageStatusFromSections(existing.status, nextSections);

  const updated: PageRecord = {
    ...existing,
    name:
      typeof patch.name === "string" && patch.name.trim()
        ? patch.name.trim()
        : existing.name,
    slug:
      typeof patch.slug === "string"
        ? patch.slug.trim() || undefined
        : existing.slug,
    status: explicitStatus ?? derivedStatus,
    updatedByUserId: patch.updatedByUserId ?? existing.updatedByUserId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
    sections: nextSections,

    approvedByUserId:
      typeof patch.approvedByUserId !== "undefined"
        ? patch.approvedByUserId
        : existing.approvedByUserId ?? null,

    approvedAt:
      typeof patch.approvedAt !== "undefined"
        ? patch.approvedAt
        : existing.approvedAt ?? null,

    publishedByUserId:
      typeof patch.publishedByUserId !== "undefined"
        ? patch.publishedByUserId
        : existing.publishedByUserId ?? null,

    publishedAt:
      typeof patch.publishedAt !== "undefined"
        ? patch.publishedAt
        : existing.publishedAt ?? null,

    changesRequestedByUserId:
      typeof patch.changesRequestedByUserId !== "undefined"
        ? patch.changesRequestedByUserId
        : existing.changesRequestedByUserId ?? null,

    changesRequestedAt:
      typeof patch.changesRequestedAt !== "undefined"
        ? patch.changesRequestedAt
        : existing.changesRequestedAt ?? null,

    changesRequestedNotes:
      typeof patch.changesRequestedNotes !== "undefined"
        ? patch.changesRequestedNotes
        : existing.changesRequestedNotes ?? null,

    changesRequestedSections:
      typeof patch.changesRequestedSections !== "undefined"
        ? patch.changesRequestedSections
        : existing.changesRequestedSections ?? null,
  };

  pages[index] = updated;
  await writePages(pages);

  return updated;
}

export async function attachBlockToPageSection(
  pageId: string,
  sectionId: string,
  blockId: string,
  updatedByUserId: string,
  skipAllowedComponentCheck = false
): Promise<PageRecord | null> {
  const page = await getPageById(pageId);

  if (!page) {
    return null;
  }

  const section = page.sections.find((item) => item.sectionId === sectionId);

  if (!section) {
    throw new Error("Section not found.");
  }

  const block = await getBlockById(blockId);

  if (!block) {
    throw new Error("Block not found.");
  }

  const componentType = (block.data as { componentType?: unknown } | undefined)
    ?.componentType;
  const safeComponentType =
    typeof componentType === "string" ? componentType.trim() : "";

  if (!safeComponentType) {
    throw new Error("Block does not have a valid component type.");
  }

  if (
    !skipAllowedComponentCheck &&
    !section.allowedComponentIds.includes(safeComponentType)
  ) {
    throw new Error(
      `Block type "${safeComponentType}" is not allowed in section "${section.label}".`
    );
  }

  if (section.blockIds.includes(blockId)) {
    return page;
  }

  if (section.blockIds.length >= section.maxInstances) {
    throw new Error(
      `Section "${section.label}" already has the maximum of ${section.maxInstances} block(s).`
    );
  }

  const nextSections = page.sections.map((item) => {
    if (item.sectionId !== sectionId) {
      return item;
    }

    const nextBlockIds = [...item.blockIds, blockId];

    return {
      ...item,
      blockIds: nextBlockIds,
      completed: isSectionComplete({
        ...item,
        blockIds: nextBlockIds,
      }),
    };
  });

  const normalisedSections = normaliseSectionInstances(nextSections);
  const nextStatus = derivePageStatusFromSections(page.status, normalisedSections);

  return updatePage(pageId, {
    sections: normalisedSections,
    status: nextStatus,
    updatedByUserId,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeBlockFromPageSection(
  pageId: string,
  sectionId: string,
  blockId: string,
  updatedByUserId: string
): Promise<PageRecord | null> {
  const page = await getPageById(pageId);

  if (!page) {
    return null;
  }

  const section = page.sections.find((item) => item.sectionId === sectionId);

  if (!section) {
    throw new Error("Section not found.");
  }

  const nextSections = page.sections.map((item) => {
    if (item.sectionId !== sectionId) {
      return item;
    }

    const nextBlockIds = item.blockIds.filter((id) => id !== blockId);

    return {
      ...item,
      blockIds: nextBlockIds,
      completed: isSectionComplete({
        ...item,
        blockIds: nextBlockIds,
      }),
    };
  });

  const normalisedSections = normaliseSectionInstances(nextSections);
  const nextStatus = derivePageStatusFromSections(page.status, normalisedSections);

  return updatePage(pageId, {
    sections: normalisedSections,
    status: nextStatus,
    updatedByUserId,
    updatedAt: new Date().toISOString(),
  });
}