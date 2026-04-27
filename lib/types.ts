export type Accent = "blue" | "green" | "orange" | "purple";

export type ContentLength = "Short" | "Standard" | "Detailed";

export type ImageSourceMode = "none" | "upload" | "gallery";

export type BlockTheme = "light" | "soft" | "enterprise";

export type BlockLayout = "split" | "stacked";

export type BlockCardStyle = "outline" | "soft" | "filled";

export type BlockHeadingAlign = "left" | "center";

export type BlockBorderRadius = "md" | "lg" | "xl";

export type BlockShadow = "none" | "soft" | "strong";

export type ValuePoint = {
  title: string;
  text: string;
  accent: Accent;
};

export type StatItem = {
  label: string;
  value: string;
  supportingText?: string;
};

export type LogoItem = {
  name: string;
  imageUrl?: string;
  altText?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type TestimonialExtraContent = {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  company?: string;
  logoUrl?: string;
};

export type CtaExtraContent = {
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
};

export type StatsBandExtraContent = {
  stats?: StatItem[];
};

export type LogoCloudExtraContent = {
  logos?: LogoItem[];
};

export type FaqExtraContent = {
  faqItems?: FaqItem[];
};

export type ContactFormExtraContent = {
  formTitle?: string;
  submitLabel?: string;
};

export type RichTextExtraContent = {
  body?: string;
  intro?: string;
  sectionHeading?: string;
};

export type GeneratedBlockMetaExtraContent = {
  generatedBlockLabel?: string;
  selectedVariant?: string;
  companyName?: string;
};

export type BlockExtraContent =
  & TestimonialExtraContent
  & CtaExtraContent
  & StatsBandExtraContent
  & LogoCloudExtraContent
  & FaqExtraContent
  & ContactFormExtraContent
  & RichTextExtraContent
  & GeneratedBlockMetaExtraContent
  & {
    [key: string]: unknown;
  };

export type BlockDesign = {
  theme: BlockTheme;
  layout: BlockLayout;
  cardStyle: BlockCardStyle;
  headingAlign: BlockHeadingAlign;
  borderRadius: BlockBorderRadius;
  shadow: BlockShadow;
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
  contentLength?: ContentLength;
  imageSourceMode?: ImageSourceMode;
};

export type BlockData = BlockContextMeta & {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: ValuePoint[];
  design: BlockDesign;
  extraContent?: BlockExtraContent;
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