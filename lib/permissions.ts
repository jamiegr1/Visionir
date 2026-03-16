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
  | "block.reject"
  | "block.request_changes"
  | "block.publish"
  | "user.manage"
  | "role.manage"
  | "settings.manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  creator: [
    "block.create",
    "block.edit.own",
    "block.view.own",
    "block.submit",
    "block.publish",
  ],
  approver: [
    "block.create",
    "block.edit.own",
    "block.edit.any",
    "block.view.own",
    "block.view.team",
    "block.submit",
    "block.approve",
    "block.reject",
    "block.request_changes",
    "block.publish",
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
    "block.reject",
    "block.request_changes",
    "block.publish",
    "user.manage",
    "role.manage",
    "settings.manage",
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
  | "rejected"
  | "archived";

export type UserLike = {
  id: string;
  role: Role;
};

export type BlockLike = {
  createdByUserId: string;
  status: BlockStatus;
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

export function canRejectBlock(user: UserLike, block: BlockLike) {
  return (
    hasPermission(user.role, "block.reject") &&
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
