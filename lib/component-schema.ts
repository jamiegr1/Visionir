export type UserRole = "creator" | "approver" | "admin";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "multi-select"
  | "image"
  | "icon"
  | "url"
  | "cta"
  | "group"
  | "repeater"
  | "date"
  | "json"
  | "color";

export type ValidationRule =
  | {
      type: "required";
      message?: string;
    }
  | {
      type: "minLength";
      value: number;
      message?: string;
    }
  | {
      type: "maxLength";
      value: number;
      message?: string;
    }
  | {
      type: "minItems";
      value: number;
      message?: string;
    }
  | {
      type: "maxItems";
      value: number;
      message?: string;
    }
  | {
      type: "min";
      value: number;
      message?: string;
    }
  | {
      type: "max";
      value: number;
      message?: string;
    }
  | {
      type: "regex";
      value: string;
      message?: string;
    }
  | {
      type: "allowedValues";
      value: string[];
      message?: string;
    }
  | {
      type: "url";
      message?: string;
    };

export type RolePermission = {
  canView: UserRole[];
  canEdit: UserRole[];
  canApprove?: UserRole[];
  canPublish?: UserRole[];
};

export type AiRule = {
  aiEditable: boolean;
  aiGenerate: boolean;
  aiRewrite: boolean;
  promptHint?: string;
  blockedInstructions?: string[];
  requiresHumanReview?: boolean;
};

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldCondition = {
  fieldId: string;
  operator: "equals" | "notEquals" | "includes" | "notIncludes" | "exists";
  value?: string | number | boolean;
};

export type ComponentField = {
  id: string;
  label: string;
  type: FieldType;
  description?: string;
  helpText?: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FieldOption[];
  validation?: ValidationRule[];
  permissions: RolePermission;
  ai: AiRule;

  locked?: boolean;
  hidden?: boolean;
  required?: boolean;

  localisable?: boolean;
  allowedLocales?: string[];
  regionLocks?: string[];

  tokenBound?: boolean;
  tokenReference?: string;

  approvalRequired?: boolean;
  approvalReason?: string;

  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;

  conditions?: FieldCondition[];

  children?: ComponentField[];
};

export type ComponentVariant = {
  id: string;
  label: string;
  description?: string;
  allowedLayouts?: string[];
  allowedBackgrounds?: string[];
  deprecated?: boolean;
  deprecatedReason?: string;
};

export type ApprovalRule = {
  requiresApproval: boolean;
  approvalReason?: string;
  requiresLegalReview?: boolean;
  requiresRegionalReview?: boolean;
  requiredApproverRoles?: UserRole[];
};

export type CompositionRule = {
  allowedParents?: string[];
  allowedChildren?: string[];
  cannotFollow?: string[];
  mustBeFirst?: boolean;
  mustBeLast?: boolean;
  maxPerPage?: number;
  minPerPage?: number;
};

export type DeploymentTarget =
  | "optimizely"
  | "sitecore"
  | "adobe"
  | "framer"
  | "custom";

export type DeploymentMapping = {
  sourceField: string;
  targetField: string;
  required?: boolean;
};

export type DeploymentRule = {
  deployable: boolean;
  targetCms: DeploymentTarget[];
  requiredMappings?: string[];
  fieldMappings?: DeploymentMapping[];
  requiresPublishValidation?: boolean;
  supportsLocales?: boolean;
};

export type ComponentCategory =
  | "hero"
  | "content"
  | "media"
  | "conversion"
  | "proof"
  | "navigation"
  | "utility";

export type ComponentStatus = "draft" | "approved" | "deprecated" | "archived";

export type ComponentVisibility = "global" | "brand" | "region" | "local";

export type ComponentSchema = {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;

  status: ComponentStatus;
  visibility?: ComponentVisibility;

  version: number;
  schemaVersion: number;

  ownerTeam?: string;
  tags?: string[];

  variants: ComponentVariant[];
  fields: ComponentField[];

  approvals: ApprovalRule;
  composition: CompositionRule;
  deployment: DeploymentRule;

  allowedLocales?: string[];
  inheritsBrandRules?: boolean;

  deprecatedReason?: string;

  createdAt?: string;
  updatedAt?: string;
};