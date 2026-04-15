import { COMPONENT_REGISTRY } from "@/lib/component-registry";

export type ComponentPreviewCategory =
  | "hero"
  | "content"
  | "media"
  | "conversion"
  | "proof"
  | "navigation"
  | "utility"
  | "general";

export type ComponentVariantOption = {
  id: string;
  label: string;
  description?: string;
  previewKey?: string;
};

export type ComponentOption = {
  id: string;
  name: string;
  category: ComponentPreviewCategory;
  description: string;
  tags?: string[];
  previewKey?: string;
  variants: ComponentVariantOption[];
};

export type ComponentCategoryGroup = {
  category: ComponentPreviewCategory;
  components: ComponentOption[];
};

function normaliseCategory(value: string | undefined): ComponentPreviewCategory {
  switch (value) {
    case "hero":
    case "content":
    case "media":
    case "conversion":
    case "proof":
    case "navigation":
    case "utility":
      return value;
    default:
      return "general";
  }
}

function buildVariantPreviewKey(variant: {
  id: string;
  allowedLayouts?: string[];
}) {
  return variant.allowedLayouts?.[0] || variant.id;
}

export const COMPONENT_OPTIONS: ComponentOption[] = COMPONENT_REGISTRY.map(
  (component) => {
    const category = normaliseCategory(component.category);

    return {
      id: component.id,
      name: component.name,
      category,
      description: component.description || "",
      tags: component.tags || [],
      previewKey: category,
      variants: [...(component.variants || [])]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((variant) => ({
          id: variant.id,
          label: variant.label,
          description: variant.description || "",
          previewKey: buildVariantPreviewKey(variant),
        })),
    };
  }
).sort((a, b) => a.name.localeCompare(b.name));

export const COMPONENT_OPTIONS_BY_CATEGORY: ComponentCategoryGroup[] = Object.entries(
  COMPONENT_OPTIONS.reduce<Record<string, ComponentOption[]>>((acc, component) => {
    const category = component.category || "general";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(component);
    return acc;
  }, {})
)
  .map(([category, components]) => ({
    category: normaliseCategory(category),
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .sort((a, b) => a.category.localeCompare(b.category));