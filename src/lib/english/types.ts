export type AssetKind =
  | "photo"
  | "illustration"
  | "infographic"
  | "map"
  | "chart"
  | "decorative"
  | string;

export type Asset = {
  id: string;
  kind: AssetKind;
  src: string;
  alt?: string;
  caption?: string;
  bookPage?: string | number;
  placement?: string;
};

export type Choice = { id: string; text: string };

export type Item = {
  id: string;
  interaction: string;
  prompt: string;
  group?: string;
  groupLabel?: string;
  groupPrompt?: string;
  skill?: string;
  choices?: Choice[];
  blanks?: { options: string[] }[];
  bank?: string[];
  pairs?: { id: string; text: string }[];
  answer?: string | string[] | boolean;
  paragraphIds?: string[];
  assetIds?: string[];
  imagePlacement?: "above" | "beside" | string;
  multi?: boolean;
};

export type FigureRef = { assetId: string; position?: string };

export type Paragraph = {
  id: string;
  html: string;
  heading?: string;
  relatedItemIds?: string[];
};

export type GlossaryEntry = {
  term: string;
  def: string;
  anchorParagraphId?: string;
};

export type Block = {
  id: string;
  kind: string;
  title?: string;
  html?: string;
  assetId?: string;
  assetIds?: string[];
  figures?: FigureRef[];
  paragraphs?: Paragraph[];
  glossary?: GlossaryEntry[];
  items?: Item[];
};

export type Lesson = {
  courseId: string;
  unit: number;
  lessonId: string;
  type: string;
  title: string;
  theme: string;
  themeZh?: string;
  readingSkill?: string;
  bookPages?: string;
  sourcePdf?: string;
  assets: Asset[];
  blocks: Block[];
};

export type CatalogLesson = {
  id: string;
  title: string;
  skill: string;
  bookPages: string;
  blockCount: number;
  itemCount: number;
};

export type CatalogUnit = {
  unit: number;
  theme: string;
  themeZh?: string;
  bookPages: string;
  lessons: CatalogLesson[];
};

export type Catalog = {
  courseId: string;
  title: string;
  edition?: string;
  units: CatalogUnit[];
};
