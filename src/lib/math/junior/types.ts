export type LevelTag = "S1" | "S2" | "S3";

export type ImagePlacement = "above" | "beside";

export type JuniorAsset = {
  id: string;
  src?: string;
  alt?: string;
  kind?: string;
  caption?: string;
};

export type JuniorChoice = {
  id: string;
  text: string;
};

export type JuniorItem = {
  id: string;
  interaction: string;
  prompt: string;
  choices?: JuniorChoice[];
  answer?: string | boolean | string[];
  acceptedAnswers?: string[];
  solution?: string;
  level?: string;
  levelTag?: string;
  assetIds?: string[];
  imagePlacement?: ImagePlacement | null;
};

export type JuniorParagraph = {
  id: string;
  html: string;
};

export type JuniorBlock = {
  id: string;
  kind: string;
  title?: string;
  items?: JuniorItem[];
  paragraphs?: JuniorParagraph[];
};

export type JuniorLesson = {
  courseId: string;
  level: string;
  slug: string;
  titleEn: string;
  titleZh?: string;
  edbUnit?: string;
  difficulty?: {
    core?: string;
    stretch?: string;
    mixNote?: string;
  };
  objectives?: string[];
  blocks: JuniorBlock[];
  assets?: JuniorAsset[];
};

export type TopicYear = "s1" | "s2";

export type TopicRef = {
  year: TopicYear;
  slug: string;
  title: string;
  levelLabel: string;
  questions: number;
};
