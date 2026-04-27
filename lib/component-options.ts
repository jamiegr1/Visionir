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
  tags: string[];
  previewKey: string;
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

function buildComponentPreviewKey(component: {
  id: string;
  category?: string;
}) {
  return component.id || normaliseCategory(component.category);
}

function buildVariantPreviewKey(variant: {
  id: string;
  allowedLayouts?: string[];
}) {
  return variant.allowedLayouts?.[0] || variant.id;
}

function sortByLabel<T extends { label?: string; name?: string; id: string }>(a: T, b: T) {
  const aLabel = (a.label || a.name || a.id).toLowerCase();
  const bLabel = (b.label || b.name || b.id).toLowerCase();
  return aLabel.localeCompare(bLabel);
}

export const COMPONENT_OPTIONS: ComponentOption[] = [...COMPONENT_REGISTRY]
  .sort((a, b) => sortByLabel(a, b))
  .map((component) => {
    const category = normaliseCategory(component.category);

    return {
      id: component.id,
      name: component.name,
      category,
      description: component.description || "",
      tags: component.tags || [],
      previewKey: buildComponentPreviewKey(component),
      variants: [...(component.variants || [])]
        .sort((a, b) => sortByLabel(a, b))
        .map((variant) => ({
          id: variant.id,
          label: variant.label,
          description: variant.description || "",
          previewKey: buildVariantPreviewKey(variant),
        })),
    };
  });

export const COMPONENT_OPTIONS_BY_CATEGORY: ComponentCategoryGroup[] = (
  Object.entries(
    COMPONENT_OPTIONS.reduce<Record<ComponentPreviewCategory, ComponentOption[]>>(
      (acc, component) => {
        const category = component.category;

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(component);
        return acc;
      },
      {
        hero: [],
        content: [],
        media: [],
        conversion: [],
        proof: [],
        navigation: [],
        utility: [],
        general: [],
      }
    )
  ) as Array<[ComponentPreviewCategory, ComponentOption[]]>
)
  .map(([category, components]) => ({
    category,
    components: [...components].sort((a, b) => sortByLabel(a, b)),
  }))
  .filter((group) => group.components.length > 0)
  .sort((a, b) => a.category.localeCompare(b.category));