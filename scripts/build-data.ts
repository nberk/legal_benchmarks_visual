#!/usr/bin/env bun
import { readdir, stat, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { TaskJsonSchema, type TaskJson } from "../src/lib/schema";
import { practiceAreaName } from "../src/lib/practice-areas";
import { getSnippet } from "./extract-docs";
import type {
  Task,
  SearchIndexEntry,
  PracticeAreaSummary,
  SiteSummary,
  WorkTypeHistogram,
  DocumentEntry,
  DocumentPreviewType,
  Criterion,
} from "../src/lib/types";

const ROOT = new URL("..", import.meta.url).pathname;
const VENDOR_DIR = join(ROOT, "vendor/harvey-labs");
const TASKS_ROOT = join(VENDOR_DIR, "tasks");
const OUT_ROOT = join(ROOT, "src/data");
const OUT_TASKS = join(OUT_ROOT, "tasks");
const EXTRACT_SNIPPETS = process.env.EXTRACT_SNIPPETS !== "0";

const UPSTREAM_REPO = "harveyai/harvey-labs";

function getUpstreamSha(): string {
  try {
    const out = execFileSync("git", ["rev-parse", "HEAD"], { cwd: VENDOR_DIR });
    return out.toString().trim();
  } catch {
    return "main";
  }
}

const UPSTREAM_SHA = getUpstreamSha();

function emptyHistogram(): WorkTypeHistogram {
  return { analyze: 0, draft: 0, review: 0, research: 0 };
}

function previewTypeFor(ext: string): DocumentPreviewType {
  const e = ext.toLowerCase();
  if (e === ".docx") return "html";
  if (e === ".xlsx") return "table";
  if (e === ".eml" || e === ".txt" || e === ".md") return "text";
  return "none";
}

function githubBlobUrl(relPath: string): string {
  return `https://github.com/${UPSTREAM_REPO}/blob/${UPSTREAM_SHA}/${relPath}`;
}

function githubRawUrl(relPath: string): string {
  return `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_SHA}/${relPath}`;
}

async function listDir(p: string): Promise<string[]> {
  try {
    return await readdir(p);
  } catch {
    return [];
  }
}

async function isDir(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function readDocuments(
  documentsDir: string,
  upstreamPathPrefix: string,
  taskIdForDocs: string,
): Promise<DocumentEntry[]> {
  if (!(await isDir(documentsDir))) return [];
  const entries = await readdir(documentsDir, { withFileTypes: true });
  const docs: DocumentEntry[] = [];
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const name = ent.name;
    if (name.startsWith(".")) continue;
    const filePath = join(documentsDir, name);
    const ext = extname(name);
    const st = await stat(filePath);
    const relPath = `${upstreamPathPrefix}/documents/${name}`;
    const previewType = previewTypeFor(ext);
    const docId = `${taskIdForDocs}__${name}`;

    let snippet: string | undefined;
    if (EXTRACT_SNIPPETS) {
      snippet = await getSnippet(filePath, ext);
    }

    docs.push({
      id: docId,
      name,
      ext,
      sizeBytes: st.size,
      githubUrl: githubBlobUrl(relPath),
      rawUrl: githubRawUrl(relPath),
      previewType,
      snippet,
    });
  }
  docs.sort((a, b) => a.name.localeCompare(b.name));
  return docs;
}

async function processTaskJson(
  jsonPath: string,
  practiceArea: string,
  taskSlug: string,
  scenarioId: string | undefined,
  scenarioDir: string,
): Promise<Task | null> {
  const raw = await readFile(jsonPath, "utf8");
  let parsed: TaskJson;
  try {
    parsed = TaskJsonSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error(`Schema validation failed for ${jsonPath}:`);
    console.error(err);
    return null;
  }

  const id = scenarioId
    ? `${practiceArea}--${taskSlug}--${scenarioId}`
    : `${practiceArea}--${taskSlug}`;

  const upstreamPath = relative(VENDOR_DIR, scenarioDir);
  const githubUrl = `https://github.com/${UPSTREAM_REPO}/tree/${UPSTREAM_SHA}/${upstreamPath}`;

  const deliverables = Object.entries(parsed.deliverables).map(
    ([filename, description]) => ({
      filename,
      description: description !== filename ? description : undefined,
    }),
  );

  const criteria: Criterion[] = parsed.criteria.map((c) => ({
    id: c.id,
    title: c.title,
    deliverables: c.deliverables,
    matchCriteria: c.match_criteria,
  }));

  const documents = await readDocuments(
    join(scenarioDir, "documents"),
    upstreamPath,
    id,
  );

  return {
    id,
    practiceArea,
    practiceAreaName: practiceAreaName(practiceArea),
    taskSlug,
    scenarioId,
    title: parsed.title,
    workType: parsed.work_type,
    tags: parsed.tags,
    instructions: parsed.instructions,
    deliverables,
    criteria,
    documents,
    upstreamPath,
    githubUrl,
  };
}

async function walkPracticeArea(practiceArea: string): Promise<Task[]> {
  const areaDir = join(TASKS_ROOT, practiceArea);
  const tasks: Task[] = [];
  for (const taskSlug of await listDir(areaDir)) {
    const taskDir = join(areaDir, taskSlug);
    if (!(await isDir(taskDir))) continue;

    const flatJson = join(taskDir, "task.json");
    if (existsSync(flatJson)) {
      const t = await processTaskJson(
        flatJson,
        practiceArea,
        taskSlug,
        undefined,
        taskDir,
      );
      if (t) tasks.push(t);
      continue;
    }

    for (const sub of await listDir(taskDir)) {
      if (!sub.startsWith("scenario-")) continue;
      const scenarioDir = join(taskDir, sub);
      if (!(await isDir(scenarioDir))) continue;
      const sjson = join(scenarioDir, "task.json");
      if (!existsSync(sjson)) continue;
      const t = await processTaskJson(
        sjson,
        practiceArea,
        taskSlug,
        sub,
        scenarioDir,
      );
      if (t) tasks.push(t);
    }
  }
  return tasks;
}

function topTagsFor(tasks: Task[], limit = 8): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    for (const tag of t.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function makeSearchEntry(t: Task): SearchIndexEntry {
  return {
    id: t.id,
    practiceArea: t.practiceArea,
    practiceAreaName: t.practiceAreaName,
    title: t.title,
    workType: t.workType,
    tags: t.tags,
    scenarioId: t.scenarioId,
    taskSlug: t.taskSlug,
    criterionCount: t.criteria.length,
    documentCount: t.documents.length,
  };
}

async function main() {
  console.log(`Building data from ${VENDOR_DIR} @ ${UPSTREAM_SHA.slice(0, 8)}`);
  if (!existsSync(TASKS_ROOT)) {
    console.error(`Missing ${TASKS_ROOT}. Did you run git submodule update --init?`);
    process.exit(1);
  }

  await rm(OUT_TASKS, { recursive: true, force: true });
  await mkdir(OUT_TASKS, { recursive: true });
  console.log(`Snippet extraction: ${EXTRACT_SNIPPETS ? "ON" : "OFF (EXTRACT_SNIPPETS=0)"}`);

  const practiceAreas = (await readdir(TASKS_ROOT, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const indexEntries: SearchIndexEntry[] = [];
  const summaries: PracticeAreaSummary[] = [];
  let totalTasks = 0;
  let totalScenarios = 0;
  let totalCriteria = 0;
  let totalDocuments = 0;
  const overallHistogram = emptyHistogram();

  for (const area of practiceAreas) {
    const tasks = await walkPracticeArea(area);
    const histogram = emptyHistogram();
    let documentCount = 0;
    const taskKeys = new Set<string>();
    for (const t of tasks) {
      histogram[t.workType] += 1;
      overallHistogram[t.workType] += 1;
      documentCount += t.documents.length;
      taskKeys.add(t.taskSlug);
      indexEntries.push(makeSearchEntry(t));
      totalCriteria += t.criteria.length;
      await writeFile(
        join(OUT_TASKS, `${t.id}.json`),
        JSON.stringify(t, null, 2),
      );
    }
    summaries.push({
      slug: area,
      name: practiceAreaName(area),
      taskCount: taskKeys.size,
      scenarioCount: tasks.length,
      documentCount,
      workTypes: histogram,
      topTags: topTagsFor(tasks),
    });
    totalTasks += taskKeys.size;
    totalScenarios += tasks.length;
    totalDocuments += documentCount;
    console.log(
      `  ${area.padEnd(48)} tasks=${taskKeys.size.toString().padStart(4)} scenarios=${tasks.length.toString().padStart(4)} docs=${documentCount}`,
    );
  }

  indexEntries.sort(
    (a, b) =>
      a.practiceAreaName.localeCompare(b.practiceAreaName) ||
      a.title.localeCompare(b.title),
  );

  const indexJson = JSON.stringify(indexEntries);
  await writeFile(join(OUT_ROOT, "index.json"), indexJson);
  const publicData = join(ROOT, "public/data");
  await mkdir(publicData, { recursive: true });
  await writeFile(join(publicData, "index.json"), indexJson);
  await writeFile(
    join(OUT_ROOT, "categories.json"),
    JSON.stringify(summaries, null, 2),
  );

  const summary: SiteSummary = {
    generatedAt: new Date().toISOString(),
    upstreamSha: UPSTREAM_SHA,
    upstreamRepo: UPSTREAM_REPO,
    totalTasks,
    totalScenarios,
    totalCriteria,
    totalDocuments,
    totalPracticeAreas: practiceAreas.length,
    workTypes: overallHistogram,
  };
  await writeFile(
    join(OUT_ROOT, "summary.json"),
    JSON.stringify(summary, null, 2),
  );

  console.log("");
  console.log(`Total practice areas: ${practiceAreas.length}`);
  console.log(`Total tasks:          ${totalTasks}`);
  console.log(`Total scenarios:      ${totalScenarios}`);
  console.log(`Total criteria:       ${totalCriteria}`);
  console.log(`Total documents:      ${totalDocuments}`);
  console.log(`Work types:           ${JSON.stringify(overallHistogram)}`);
  console.log(`Wrote ${indexEntries.length} index entries to src/data/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
