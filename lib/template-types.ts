import type { Role } from "@/lib/permissions";

export type TemplateStatus = "draft" | "published" | "archived";

export type TemplateCategory =
  | "service"
  | "landing"
  | "article"
  | "contact"
  | "resource"
  | "custom";

export type TemplateAiGenerateScope = "copy_only" | "copy_and_layout";

export type TemplateSectionPermissions = {
  creatorCanEdit: boolean;
  approverCanEdit: boolean;
  adminCanEdit: boolean;
  copyLocked?: boolean;
  layoutLocked?: boolean;
};

export type TemplateSectionImageRequirement = {
  min: number;
  max: number;
  requiredAltText?: boolean;
};

export type TemplateSectionAiRules = {
  promptHint?: string;
  blockedInstructions?: string[];
  generateScope?: TemplateAiGenerateScope;
};

export type TemplateSectionContentRules = {
  minHeadlineLength?: number;
  maxHeadlineLength?: number;
  minBodyLength?: number;
  maxBodyLength?: number;
  bannedTerms?: string[];
  requiredPhrases?: string[];
  allowedCtas?: string[];
};

export type TemplateSectionRule = {
  id: string;
  key: string;
  label: string;
  description?: string;
  helpText?: string;
  order: number;
  required: boolean;
  canSkip?: boolean;
  minInstances: number;
  maxInstances: number;
  allowedComponentIds: string[];
  defaultComponentId?: string | null;
  lockedOrder?: boolean;
  mustBeFirst?: boolean;
  mustBeLast?: boolean;
  imageRequirement?: TemplateSectionImageRequirement;
  ai?: TemplateSectionAiRules;
  contentRules?: TemplateSectionContentRules;
  permissions?: TemplateSectionPermissions;
};

export type TemplateRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  status: TemplateStatus;
  version: number;
  audience?: string;
  purpose?: string;
  defaultAiInstruction?: string;
  sections: TemplateSectionRule[];
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type PageStatus =
  | "draft"
  | "in_progress"
  | "pending_approval"
  | "approved"
  | "published"
  | "archived";

export type PageTemplateSectionInstance = {
  sectionId: string;
  key: string;
  label: string;
  order: number;
  required: boolean;
  canSkip?: boolean;
  minInstances: number;
  maxInstances: number;
  allowedComponentIds: string[];
  defaultComponentId?: string | null;
  completed: boolean;
  blockIds: string[];
};

export type PageRecord = {
  id: string;
  templateId: string;
  templateVersion: number;
  templateName: string;
  name: string;
  slug?: string;
  status: PageStatus;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
  sections: PageTemplateSectionInstance[];
};

export type CreateTemplateInput = {
  name: string;
  slug?: string;
  description?: string;
  category?: TemplateCategory;
  audience?: string;
  purpose?: string;
  defaultAiInstruction?: string;
  status?: TemplateStatus;
  sections?: Partial<TemplateSectionRule>[];
};

export type UpdateTemplateInput = Partial<{
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  audience: string;
  purpose: string;
  defaultAiInstruction: string;
  status: TemplateStatus;
  version: number;
  sections: TemplateSectionRule[];
  updatedByUserId: string;
  updatedAt: string;
  publishedAt: string | null;
}>;

export type CreatePageFromTemplateInput = {
  templateId: string;
  name: string;
  slug?: string;
  createdByUserId: string;
  updatedByUserId: string;
};

export type UpdatePageInput = Partial<{
  name: string;
  slug: string;
  status: PageStatus;
  updatedByUserId: string;
  updatedAt: string;
  sections: PageTemplateSectionInstance[];
}>;

export type TemplateSummary = Pick<
  TemplateRecord,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "category"
  | "status"
  | "version"
  | "updatedAt"
  | "publishedAt"
> & {
  sectionCount: number;
  requiredSectionCount: number;
};

export type TemplateBuilderMode = "create" | "edit";
export type TemplateUserRole = Role;