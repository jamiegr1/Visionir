export type Role = "creator" | "approver" | "admin";

export type Permission =
  | "block.create"
  | "block.edit.own"
  | "block.edit.any"
  | "block.view.own"
  | "block.view.team"
  | "block.view.all"
  | "block.submit"
  | "block.approve"
  | "block.request_changes"
  | "block.publish"
  | "block_type.create"
  | "block_type.view"
  | "block_type.submit"
  | "block_type.approve"
  | "block_type.request_changes"
  | "template.create"
  | "template.edit"
  | "template.view"
  | "template.publish"
  | "template.archive"
  | "template.delete"
  | "page.create"
  | "page.edit.own"
  | "page.edit.any"
  | "page.view.own"
  | "page.view.team"
  | "page.view.all"
  | "page.submit"
  | "page.approve"
  | "page.request_changes"
  | "page.publish"
  | "user.manage"
  | "role.manage"
  | "settings.manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  creator: [
    "block.create",
    "block.edit.own",
    "block.view.own",
    "block.submit",
    "template.view",
    "page.create",
    "page.edit.own",
    "page.view.own",
    "page.submit",
    "block_type.create",
"block_type.view",
"block_type.submit",
  ],
  approver: [
    "block.create",
    "block.edit.own",
    "block.edit.any",
    "block.view.own",
    "block.view.team",
    "block.submit",
    "block.approve",
    "block.request_changes",
    "block.publish",
    "template.view",
    "page.create",
    "page.edit.own",
    "page.edit.any",
    "page.view.own",
    "page.view.team",
    "page.submit",
    "page.approve",
    "page.request_changes",
    "page.publish",
    "block_type.create",
"block_type.view",
"block_type.submit",
"block_type.approve",
"block_type.request_changes",
  ],
  admin: [
    "block.create",
    "block.edit.own",
    "block.edit.any",
    "block.view.own",
    "block.view.team",
    "block.view.all",
    "block.submit",
    "block.approve",
    "block.request_changes",
    "block.publish",
    "template.create",
    "template.edit",
    "template.view",
    "template.publish",
    "template.archive",
    "template.delete",
    "page.create",
    "page.edit.own",
    "page.edit.any",
    "page.view.own",
    "page.view.team",
    "page.view.all",
    "page.submit",
    "page.approve",
    "page.request_changes",
    "page.publish",
    "user.manage",
    "role.manage",
    "settings.manage",
    "block_type.create",
"block_type.view",
"block_type.submit",
"block_type.approve",
"block_type.request_changes",
  ],
};

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export type BlockStatus =
  | "draft"
  | "pending_approval"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "archived";

export type TemplateStatus = "draft" | "published" | "archived";

export type PageStatus =
  | "draft"
  | "in_progress"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "published"
  | "archived";

export type UserLike = {
  id: string;
  role: Role;
};

export type BlockLike = {
  createdByUserId: string;
  status: BlockStatus;
};

export type TemplateLike = {
  createdByUserId: string;
  status: TemplateStatus;
};

export type PageLike = {
  createdByUserId: string;
  status: PageStatus;
};

export function canEditBlock(user: UserLike, block: BlockLike) {
  if (hasPermission(user.role, "block.edit.any")) return true;

  return (
    hasPermission(user.role, "block.edit.own") &&
    block.createdByUserId === user.id &&
    ["draft", "changes_requested"].includes(block.status)
  );
}

export function canSubmitBlock(user: UserLike, block: BlockLike) {
  return (
    hasPermission(user.role, "block.submit") &&
    block.createdByUserId === user.id &&
    ["draft", "changes_requested"].includes(block.status)
  );
}

export function canApproveBlock(user: UserLike, block: BlockLike) {
  return (
    hasPermission(user.role, "block.approve") &&
    (block.status === "pending_approval" || block.status === "in_review")
  );
}

export function canRequestChanges(user: UserLike, block: BlockLike) {
  return (
    hasPermission(user.role, "block.request_changes") &&
    (block.status === "pending_approval" || block.status === "in_review")
  );
}

export function canPublishBlock(user: UserLike, block: BlockLike) {
  return (
    hasPermission(user.role, "block.publish") &&
    block.status === "approved"
  );
}

export function canViewTemplate(user: UserLike) {
  return hasPermission(user.role, "template.view");
}

export function canCreateTemplate(user: UserLike) {
  return hasPermission(user.role, "template.create");
}

export function canEditTemplate(user: UserLike, template: TemplateLike) {
  if (!hasPermission(user.role, "template.edit")) return false;
  if (user.role === "admin") return true;

  return template.createdByUserId === user.id && template.status === "draft";
}

export function canPublishTemplate(user: UserLike, template: TemplateLike) {
  return (
    hasPermission(user.role, "template.publish") &&
    template.status === "draft"
  );
}

export function canArchiveTemplate(user: UserLike, template: TemplateLike) {
  return (
    hasPermission(user.role, "template.archive") &&
    (template.status === "draft" || template.status === "published")
  );
}

export function canDeleteTemplate(user: UserLike, template: TemplateLike) {
  return (
    hasPermission(user.role, "template.delete") &&
    template.status === "draft"
  );
}

export function canEditPage(user: UserLike, page: PageLike) {
  if (hasPermission(user.role, "page.edit.any")) return true;

  return (
    hasPermission(user.role, "page.edit.own") &&
    ["draft", "in_progress", "changes_requested"].includes(page.status)
  );
}

export function canSubmitPage(user: UserLike, page: PageLike) {
  return (
    hasPermission(user.role, "page.submit") &&
    ["draft", "in_progress", "changes_requested"].includes(page.status)
  );
}

export function canApprovePage(user: UserLike, page: PageLike) {
  return (
    hasPermission(user.role, "page.approve") &&
    page.status === "pending_approval"
  );
}

export function canRequestChangesPage(user: UserLike, page: PageLike) {
  return (
    hasPermission(user.role, "page.request_changes") &&
    page.status === "pending_approval"
  );
}

export function canPublishPage(user: UserLike, page: PageLike) {
  return (
    hasPermission(user.role, "page.publish") &&
    page.status === "approved"
  );
}

export type BlockTypeStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "archived";

export type BlockTypeLike = {
  createdByUserId: string;
  status: BlockTypeStatus;
};

export function canCreateBlockType(user: UserLike) {
  return hasPermission(user.role, "block_type.create");
}

export function canSubmitBlockType(user: UserLike, blockType: BlockTypeLike) {
  return (
    hasPermission(user.role, "block_type.submit") &&
    blockType.createdByUserId === user.id &&
    ["draft", "changes_requested"].includes(blockType.status)
  );
}

export function canApproveBlockType(user: UserLike, blockType: BlockTypeLike) {
  return (
    hasPermission(user.role, "block_type.approve") &&
    blockType.status === "pending_approval"
  );
}

export function canRequestChangesBlockType(
  user: UserLike,
  blockType: BlockTypeLike
) {
  return (
    hasPermission(user.role, "block_type.request_changes") &&
    blockType.status === "pending_approval"
  );
}

export function canAccessApprovals(user: UserLike) {
  return (
    hasPermission(user.role, "block.approve") ||
    hasPermission(user.role, "block.request_changes") ||
    hasPermission(user.role, "page.approve") ||
    hasPermission(user.role, "page.request_changes") ||
    hasPermission(user.role, "block_type.approve") ||
    hasPermission(user.role, "block_type.request_changes")
  );
}