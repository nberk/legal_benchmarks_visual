import { useMemo, useState } from "react";
import type { SearchIndexEntry, WorkType } from "@/lib/types";
import { WORK_TYPE_LABEL } from "@/lib/practice-areas";

interface Props {
  tasks: SearchIndexEntry[];
  practiceArea: string;
}

const WORK_TYPES: WorkType[] = ["analyze", "draft", "review", "research"];

export default function FilterBar({ tasks }: Props) {
  const [workType, setWorkType] = useState<WorkType | "all">("all");
  const [tag, setTag] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      for (const tg of t.tags) counts.set(tg, (counts.get(tg) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 30);
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (workType !== "all" && t.workType !== workType) return false;
      if (tag !== "all" && !t.tags.includes(tag)) return false;
      if (q) {
        const haystack = `${t.title} ${t.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, workType, tag, query]);

  const wtColors: Record<string, string> = {
    analyze: "bg-accent-100 text-accent-700",
    draft: "bg-accent-50 text-accent-600",
    review: "bg-ink-100 text-ink-700",
    research: "bg-ink-50 text-ink-700",
  };

  const isFiltered = workType !== "all" || tag !== "all" || query.trim() !== "";
  const resetFilters = () => {
    setWorkType("all");
    setTag("all");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">Search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="title or tag..."
            className="text-[13px] border border-ink-200 rounded px-2.5 py-1.5 bg-white w-64 focus:outline-none focus:border-accent-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">Work type</span>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value as WorkType | "all")}
            className="text-[13px] border border-ink-200 rounded px-2 py-1.5 bg-white"
          >
            <option value="all">All</option>
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>{WORK_TYPE_LABEL[w]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">Tag</span>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="text-[13px] border border-ink-200 rounded px-2 py-1.5 bg-white max-w-64"
          >
            <option value="all">All tags</option>
            {tagOptions.map(([tg, count]) => (
              <option key={tg} value={tg}>{tg} ({count})</option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-ink-500">
          <span>
            <span className="font-mono tabular-nums text-ink-900">{filtered.length}</span>
            <span> of </span>
            <span className="font-mono tabular-nums">{tasks.length}</span>
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] text-ink-600 hover:text-ink-900 underline decoration-ink-300 hover:decoration-accent-500"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--rule)] bg-white rounded-lg px-6 py-10 text-center">
          <p className="text-[14px] text-ink-700">No tasks match these filters.</p>
          <p className="mt-1 text-[12.5px] text-ink-500">Try a different work type or tag, or clear the search.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-700 hover:text-ink-900 border border-ink-200 hover:border-ink-400 rounded-md px-3 py-1.5 transition"
          >
            Reset filters
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => {
          const scenarioPath = t.scenarioId ? `${t.taskSlug}--${t.scenarioId}` : t.taskSlug;
          const href = `/practice-areas/${t.practiceArea}/${scenarioPath}`;
          return (
            <a
              key={t.id}
              href={href}
              className="block border border-[var(--rule)] bg-white rounded-lg p-4 hover:border-ink-300 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${wtColors[t.workType] ?? "bg-ink-100 text-ink-700"}`}>
                  {WORK_TYPE_LABEL[t.workType]}
                </span>
                {t.scenarioId && (
                  <span className="text-[11px] text-ink-500 font-mono">{t.scenarioId.replace("scenario-", "S")}</span>
                )}
                <span className="ml-auto text-[11px] text-ink-400 font-mono tabular-nums">
                  {t.criterionCount} criteria · {t.documentCount} docs
                </span>
              </div>
              <h3 className="font-medium text-[14px] leading-snug text-ink-900 group-hover:text-accent-700 transition">
                {t.title}
              </h3>
              {t.tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {t.tags.slice(0, 6).map((tg) => (
                    <span key={tg} className="text-[10.5px] text-ink-500 px-1.5 py-0.5 rounded bg-ink-50 border border-ink-100">
                      {tg}
                    </span>
                  ))}
                  {t.tags.length > 6 && (
                    <span className="text-[10.5px] text-ink-400">+{t.tags.length - 6}</span>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>
      )}
    </div>
  );
}
