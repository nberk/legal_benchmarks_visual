export type WorkType = "analyze" | "draft" | "review" | "research";

export const WORK_TYPES: readonly WorkType[] = ["analyze", "draft", "review", "research"];

export type Deliverable = {
  filename: string;
  description?: string;
};

export type Criterion = {
  id: string;
  title: string;
  deliverables: string[];
  matchCriteria: string;
};

export type DocumentPreviewType = "html" | "table" | "text" | "none";

export type DocumentEntry = {
  id: string;
  name: string;
  ext: string;
  sizeBytes: number;
  githubUrl: string;
  rawUrl: string;
  previewType: DocumentPreviewType;
  previewPath?: string;
  snippet?: string;
};

export type Task = {
  id: string;
  practiceArea: string;
  practiceAreaName: string;
  taskSlug: string;
  scenarioId?: string;
  title: string;
  workType: WorkType;
  tags: string[];
  instructions: string;
  deliverables: Deliverable[];
  criteria: Criterion[];
  documents: DocumentEntry[];
  upstreamPath: string;
  githubUrl: string;
};

export type SearchIndexEntry = {
  id: string;
  practiceArea: string;
  practiceAreaName: string;
  title: string;
  workType: WorkType;
  tags: string[];
  scenarioId?: string;
  taskSlug: string;
  criterionCount: number;
  documentCount: number;
};

export type WorkTypeHistogram = Record<WorkType, number>;

export type PracticeAreaSummary = {
  slug: string;
  name: string;
  taskCount: number;
  scenarioCount: number;
  documentCount: number;
  workTypes: WorkTypeHistogram;
  topTags: { tag: string; count: number }[];
};

export type SiteSummary = {
  generatedAt: string;
  upstreamSha: string;
  upstreamRepo: string;
  totalTasks: number;
  totalScenarios: number;
  totalCriteria: number;
  totalDocuments: number;
  totalPracticeAreas: number;
  workTypes: WorkTypeHistogram;
};
