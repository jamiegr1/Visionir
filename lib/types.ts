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

export type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: ValuePoint[];
  design: BlockDesign;
};

export type BlockStatus = "draft" | "in_review" | "approved" | "rejected";

export type BlockRecord = {
  id: string;
  data: BlockData;
  status: BlockStatus;
  approvalId: string | null;
  createdAt: number;
  updatedAt: number;
};