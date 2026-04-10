import { promises as fs } from "fs";
import path from "path";
import type {
  CreatePageFromTemplateInput,
  PageRecord,
  PageTemplateSectionInstance,
  UpdatePageInput,
} from "@/lib/template-types";
import { getTemplateById } from "@/lib/template-storage";

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

function normaliseSectionInstances(
  sections: PageTemplateSectionInstance[]
): PageTemplateSectionInstance[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      ...section,
      order: index,
      blockIds: Array.isArray(section.blockIds) ? section.blockIds : [],
      completed: Array.isArray(section.blockIds)
        ? section.blockIds.length >= Math.max(section.minInstances, section.required ? 1 : 0)
        : false,
    }));
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
    createdAt: now,
    updatedAt: now,
    sections: normaliseSectionInstances(sections),
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
    status: patch.status ?? existing.status,
    updatedByUserId: patch.updatedByUserId ?? existing.updatedByUserId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
    sections: patch.sections
      ? normaliseSectionInstances(patch.sections)
      : existing.sections,
  };

  pages[index] = updated;
  await writePages(pages);

  return updated;
}

export async function attachBlockToPageSection(
  pageId: string,
  sectionId: string,
  blockId: string,
  updatedByUserId: string
): Promise<PageRecord | null> {
  const page = await getPageById(pageId);
  if (!page) return null;

  const nextSections = page.sections.map((section) => {
    if (section.sectionId !== sectionId) {
      return section;
    }

    const nextBlockIds = section.blockIds.includes(blockId)
      ? section.blockIds
      : [...section.blockIds, blockId];

    const completed =
      nextBlockIds.length >= Math.max(section.minInstances, section.required ? 1 : 0);

    return {
      ...section,
      blockIds:
        nextBlockIds.length > section.maxInstances
          ? nextBlockIds.slice(0, section.maxInstances)
          : nextBlockIds,
      completed,
    };
  });

  const allRequiredComplete = nextSections
    .filter((section) => section.required)
    .every((section) => section.completed);

  return updatePage(pageId, {
    sections: nextSections,
    status: allRequiredComplete ? "in_progress" : page.status,
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
  if (!page) return null;

  const nextSections = page.sections.map((section) => {
    if (section.sectionId !== sectionId) {
      return section;
    }

    const nextBlockIds = section.blockIds.filter((id) => id !== blockId);
    const completed =
      nextBlockIds.length >= Math.max(section.minInstances, section.required ? 1 : 0);

    return {
      ...section,
      blockIds: nextBlockIds,
      completed,
    };
  });

  return updatePage(pageId, {
    sections: nextSections,
    updatedByUserId,
    updatedAt: new Date().toISOString(),
  });
}