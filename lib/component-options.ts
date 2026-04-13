import { COMPONENT_REGISTRY } from "@/lib/component-registry";

export type ComponentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export const COMPONENT_OPTIONS: ComponentOption[] = COMPONENT_REGISTRY.map(
  (component) => ({
    id: component.id,
    name: component.name,
    category: component.category,
    description: component.description,
  })
);