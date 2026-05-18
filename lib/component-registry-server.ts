import "server-only";

import { COMPONENT_REGISTRY } from "@/lib/component-registry";
import { listBlockTypes } from "@/lib/block-type-storage";

function mapBlockTypeToComponentSchema(blockType: any) {
    return {
      ...blockType,
  
      variants: Array.isArray(blockType.variants)
        ? blockType.variants
        : [],
  
      fields: Array.isArray(blockType.fields)
        ? blockType.fields
        : [],
  
      preview: blockType.preview || {
        key: blockType.id,
        label: blockType.name,
        style: "wireframe",
        aspectRatio: "wide",
      },
  
      tags: blockType.tags || [],
  
      useCaseLabel:
        blockType.useCaseLabel ||
        blockType.description ||
        "Custom block type",
    };
  }

  export async function getApprovedComponentRegistry() {
    const customBlockTypes = await listBlockTypes();
  
    const approvedCustomBlockTypes = customBlockTypes
      .filter((blockType) => blockType.status === "approved")
      .map(mapBlockTypeToComponentSchema);
  
    return [...COMPONENT_REGISTRY, ...approvedCustomBlockTypes];
  }
  
  export async function getAllComponentRegistryItems() {
    const customBlockTypes = await listBlockTypes();
  
    const mapped = customBlockTypes.map(mapBlockTypeToComponentSchema);
  
    return [...COMPONENT_REGISTRY, ...mapped];
  }