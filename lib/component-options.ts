import { COMPONENT_REGISTRY } from "@/lib/component-registry";

export type ComponentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export type ComponentCategoryGroup = {
  category: string;
  components: ComponentOption[];
};

export const COMPONENT_OPTIONS: ComponentOption[] = COMPONENT_REGISTRY.map(
  (component) => ({
    id: component.id,
    name: component.name,
    category: component.category || "General",
    description: component.description || "",
  })
);

// 🔥 NEW: grouped + sorted (enterprise-ready)
export const COMPONENT_OPTIONS_BY_CATEGORY: ComponentCategoryGroup[] =
  Object.values(
    COMPONENT_OPTIONS.reduce<Record<string, ComponentOption[]>>(
      (acc, component) => {
        const category = component.category || "General";

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(component);
        return acc;
      },
      {}
    )
  ).map((components) => ({
    category: components[0]?.category || "General",
    components: components.sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }))
  .sort((a, b) => a.category.localeCompare(b.category));