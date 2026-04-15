export type Accent = "blue" | "green" | "orange" | "purple";

export type ValuePoint = {
  title: string;
  text: string;
  accent: Accent;
};

export type BlockDesign = {
  theme: "light" | "soft" | "enterprise";
  layout: "split" | "stacked";
  cardStyle: "outline" | "soft" | "filled";
  headingAlign: "left" | "center";
  borderRadius: "md" | "lg" | "xl";
  shadow: "none" | "soft" | "strong";
  background: string;
  surface: string;
  headingColor: string;
  textColor: string;
  eyebrowColor: string;
  cardColors: {
    blue: string;
    green: string;
    orange: string;
    purple: string;
  };
};

export type BlockContextMeta = {
  componentType?: string;
  componentVariant?: string;

  pageId?: string;
  pageName?: string;

  sectionId?: string;
  sectionLabel?: string;
  sectionKey?: string;

  templateName?: string;

  generatedFromPrompt?: string;
  contentLength?: "Short" | "Standard" | "Detailed";
  imageSourceMode?: "none" | "upload" | "gallery";
};

export type BlockData = BlockContextMeta & {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: ValuePoint[];
  design: BlockDesign;

  /**
   * Flexible extension area for future component-specific data.
   * This keeps the current model working while allowing broader block support later.
   */
  extraContent?: Record<string, unknown>;
};

export type BlockStatus =
  | "draft"
  | "pending_approval"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "archived";

export type BlockRecord = {
  id: string;
  data: BlockData;
  status: BlockStatus;

  createdByUserId: string;
  updatedByUserId: string;

  submittedByUserId?: string | null;
  approvedByUserId?: string | null;
  publishedByUserId?: string | null;

  submittedAt?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;

  changesRequestedByUserId?: string | null;
  changesRequestedAt?: string | null;
  changesRequestedNotes?: string | null;
  changesRequestedFields?: string[] | null;

  createdAt: string;
  updatedAt: string;
};