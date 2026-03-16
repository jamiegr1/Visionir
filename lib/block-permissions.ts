import {
    canEditBlock,
    canSubmitBlock,
    canApproveBlock,
    canRejectBlock,
    canPublishBlock,
    type BlockStatus,
    type UserLike,
  } from "./permissions";
  
  export function getBlockPermissions(
    user: UserLike,
    block: { createdByUserId: string; status: BlockStatus }
  ) {
    return {
      canEdit: canEditBlock(user, block),
      canSubmit: canSubmitBlock(user, block),
      canApprove: canApproveBlock(user, block),
      canReject: canRejectBlock(user, block),
      canPublish: canPublishBlock(user, block),
    };
  }