import { promises as fs } from "fs";
import path from "path";
import type {
  CreateTemplateInput,
  TemplateRecord,
  TemplateSectionRule,
  TemplateSummary,
  TemplateStatus,
  UpdateTemplateInput,
} from "@/lib/template-types";

const DATA_DIR = path.join(process.cwd(), ".visionir-data");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");

async function ensureTemplatesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(TEMPLATES_FILE);
  } catch {
    await fs.writeFile(TEMPLATES_FILE, "[]", "utf8");
  }
}

async function readTemplates(): Promise<TemplateRecord[]> {
  await ensureTemplatesFile();

  try {
    const raw = await fs.readFile(TEMPLATES_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as TemplateRecord[];
  } catch {
    return [];
  }
}

async function writeTemplates(templates: TemplateRecord[]) {
  await ensureTemplatesFile();
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normaliseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function buildDefaultSection(
  partial: Partial<TemplateSectionRule>,
  index: number
): TemplateSectionRule {
  const label =
    typeof partial.label === "string" && partial.label.trim()
      ? partial.label.trim()
      : `Section ${index + 1}`;

  const key =
    typeof partial.key === "string" && partial.key.trim()
      ? slugify(partial.key)
      : slugify(label);

  const minInstances =
    typeof partial.minInstances === "number" && partial.minInstances >= 0
      ? partial.minInstances
      : partial.required
        ? 1
        : 0;

  const maxInstances =
    typeof partial.maxInstances === "number" && partial.maxInstances >= minInstances
      ? partial.maxInstances
      : Math.max(1, minInstances || 1);

  const allowedComponentIds = normaliseStringArray(partial.allowedComponentIds);

  const defaultComponentId =
    typeof partial.defaultComponentId === "string" &&
    partial.defaultComponentId.trim()
      ? partial.defaultComponentId.trim()
      : allowedComponentIds[0] ?? null;

  return {
    id:
      typeof partial.id === "string" && partial.id.trim()
        ? partial.id
        : crypto.randomUUID(),
    key,
    label,
    description:
      typeof partial.description === "string" ? partial.description : "",
    helpText: typeof partial.helpText === "string" ? partial.helpText : "",
    order:
      typeof partial.order === "number" ? partial.order : index,
    required: Boolean(partial.required),
    canSkip: Boolean(partial.canSkip),
    minInstances,
    maxInstances,
    allowedComponentIds,
    defaultComponentId,
    lockedOrder: Boolean(partial.lockedOrder),
    mustBeFirst: Boolean(partial.mustBeFirst),
    mustBeLast: Boolean(partial.mustBeLast),
    imageRequirement: partial.imageRequirement
      ? {
          min:
            typeof partial.imageRequirement.min === "number"
              ? partial.imageRequirement.min
              : 0,
          max:
            typeof partial.imageRequirement.max === "number"
              ? partial.imageRequirement.max
              : 0,
          requiredAltText: Boolean(partial.imageRequirement.requiredAltText),
        }
      : undefined,
    ai: partial.ai
      ? {
          promptHint:
            typeof partial.ai.promptHint === "string"
              ? partial.ai.promptHint
              : "",
          blockedInstructions: normaliseStringArray(
            partial.ai.blockedInstructions
          ),
          generateScope:
            partial.ai.generateScope === "copy_only" ||
            partial.ai.generateScope === "copy_and_layout"
              ? partial.ai.generateScope
              : "copy_and_layout",
        }
      : undefined,
    contentRules: partial.contentRules
      ? {
          minHeadlineLength:
            typeof partial.contentRules.minHeadlineLength === "number"
              ? partial.contentRules.minHeadlineLength
              : undefined,
          maxHeadlineLength:
            typeof partial.contentRules.maxHeadlineLength === "number"
              ? partial.contentRules.maxHeadlineLength
              : undefined,
          minBodyLength:
            typeof partial.contentRules.minBodyLength === "number"
              ? partial.contentRules.minBodyLength
              : undefined,
          maxBodyLength:
            typeof partial.contentRules.maxBodyLength === "number"
              ? partial.contentRules.maxBodyLength
              : undefined,
          bannedTerms: normaliseStringArray(partial.contentRules.bannedTerms),
          requiredPhrases: normaliseStringArray(
            partial.contentRules.requiredPhrases
          ),
          allowedCtas: normaliseStringArray(partial.contentRules.allowedCtas),
        }
      : undefined,
    permissions: partial.permissions
      ? {
          creatorCanEdit: Boolean(partial.permissions.creatorCanEdit),
          approverCanEdit: Boolean(partial.permissions.approverCanEdit),
          adminCanEdit:
            typeof partial.permissions.adminCanEdit === "boolean"
              ? partial.permissions.adminCanEdit
              : true,
          copyLocked: Boolean(partial.permissions.copyLocked),
          layoutLocked: Boolean(partial.permissions.layoutLocked),
        }
      : {
          creatorCanEdit: true,
          approverCanEdit: true,
          adminCanEdit: true,
          copyLocked: false,
          layoutLocked: false,
        },
  };
}

function normaliseSections(
  sections: Partial<TemplateSectionRule>[] | TemplateSectionRule[] | undefined
): TemplateSectionRule[] {
  const source = Array.isArray(sections) ? sections : [];

  const built = source.map((section, index) => buildDefaultSection(section, index));

  const sorted = [...built].sort((a, b) => a.order - b.order);

  return sorted.map((section, index) => ({
    ...section,
    order: index,
  }));
}

function buildTemplateSummary(template: TemplateRecord): TemplateSummary {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    description: template.description,
    category: template.category,
    status: template.status,
    version: template.version,
    updatedAt: template.updatedAt,
    publishedAt: template.publishedAt ?? null,
    sectionCount: template.sections.length,
    requiredSectionCount: template.sections.filter((s) => s.required).length,
  };
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  const templates = await readTemplates();

  return [...templates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listTemplateSummaries(): Promise<TemplateSummary[]> {
  const templates = await listTemplates();
  return templates.map(buildTemplateSummary);
}

export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  const templates = await readTemplates();
  return templates.find((template) => template.id === id) ?? null;
}

export async function getTemplateBySlug(
  slug: string
): Promise<TemplateRecord | null> {
  const templates = await readTemplates();
  return templates.find((template) => template.slug === slug) ?? null;
}

export async function createTemplate(
  input: CreateTemplateInput,
  meta: {
    createdByUserId: string;
    updatedByUserId: string;
  }
): Promise<TemplateRecord> {
  const templates = await readTemplates();
  const now = new Date().toISOString();

  const name = input.name.trim();
  const slugBase = input.slug?.trim() ? input.slug.trim() : name;
  let slug = slugify(slugBase);

  if (!slug) {
    slug = `template-${crypto.randomUUID().slice(0, 8)}`;
  }

  const existingSlugs = new Set(templates.map((template) => template.slug));
  let uniqueSlug = slug;
  let counter = 2;

  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter += 1;
  }

  const status: TemplateStatus = input.status ?? "draft";
  const sections = normaliseSections(input.sections);

  const template: TemplateRecord = {
    id: crypto.randomUUID(),
    name,
    slug: uniqueSlug,
    description: input.description?.trim() ?? "",
    category: input.category ?? "custom",
    status,
    version: 1,
    audience: input.audience?.trim() ?? "",
    purpose: input.purpose?.trim() ?? "",
    defaultAiInstruction: input.defaultAiInstruction?.trim() ?? "",
    sections,
    createdByUserId: meta.createdByUserId,
    updatedByUserId: meta.updatedByUserId,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "published" ? now : null,
  };

  templates.push(template);
  await writeTemplates(templates);

  return template;
}

export async function updateTemplate(
  id: string,
  patch: UpdateTemplateInput
): Promise<TemplateRecord | null> {
  const templates = await readTemplates();
  const index = templates.findIndex((template) => template.id === id);

  if (index === -1) return null;

  const existing = templates[index];
  const nextStatus = patch.status ?? existing.status;

  let nextSlug = existing.slug;
  if (typeof patch.slug === "string" && patch.slug.trim()) {
    const candidate = slugify(patch.slug);
    if (candidate) {
      const duplicate = templates.find(
        (template) => template.id !== id && template.slug === candidate
      );
      if (!duplicate) {
        nextSlug = candidate;
      }
    }
  } else if (typeof patch.name === "string" && patch.name.trim()) {
    const candidate = slugify(patch.name);
    if (candidate) {
      const duplicate = templates.find(
        (template) => template.id !== id && template.slug === candidate
      );
      if (!duplicate) {
        nextSlug = candidate;
      }
    }
  }

  const updated: TemplateRecord = {
    ...existing,
    name:
      typeof patch.name === "string" && patch.name.trim()
        ? patch.name.trim()
        : existing.name,
    slug: nextSlug,
    description:
      typeof patch.description === "string"
        ? patch.description
        : existing.description,
    category: patch.category ?? existing.category,
    status: nextStatus,
    version:
      typeof patch.version === "number" && patch.version >= 1
        ? patch.version
        : existing.version,
    audience:
      typeof patch.audience === "string" ? patch.audience : existing.audience,
    purpose:
      typeof patch.purpose === "string" ? patch.purpose : existing.purpose,
    defaultAiInstruction:
      typeof patch.defaultAiInstruction === "string"
        ? patch.defaultAiInstruction
        : existing.defaultAiInstruction,
    sections: patch.sections
      ? normaliseSections(patch.sections)
      : existing.sections,
    updatedByUserId: patch.updatedByUserId ?? existing.updatedByUserId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
    publishedAt:
      nextStatus === "published"
        ? patch.publishedAt ?? existing.publishedAt ?? new Date().toISOString()
        : nextStatus === "draft"
          ? null
          : existing.publishedAt ?? null,
  };

  templates[index] = updated;
  await writeTemplates(templates);

  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const templates = await readTemplates();
  const next = templates.filter((template) => template.id !== id);

  if (next.length === templates.length) {
    return false;
  }

  await writeTemplates(next);
  return true;
}