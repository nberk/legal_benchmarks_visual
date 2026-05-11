import { useEffect, useRef, useState } from "react";
import MiniSearch from "minisearch";
import type { SearchIndexEntry } from "@/lib/types";
import { WORK_TYPE_LABEL } from "@/lib/practice-areas";

type Hit = SearchIndexEntry & { score?: number };

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<MiniSearch<SearchIndexEntry> | null>(null);
  const [results, setResults] = useState<Hit[]>([]);
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadIndex() {
    if (search || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/data/index.json");
      const entries = (await r.json()) as SearchIndexEntry[];
      const ms = new MiniSearch<SearchIndexEntry>({
        idField: "id",
        fields: ["title", "tags", "practiceAreaName"],
        storeFields: ["id", "title", "practiceArea", "practiceAreaName", "taskSlug", "scenarioId", "workType", "tags", "criterionCount", "documentCount"],
        searchOptions: {
          boost: { title: 3, practiceAreaName: 1.5 },
          prefix: true,
          fuzzy: 0.15,
          combineWith: "AND",
        },
      });
      ms.addAll(entries);
      setSearch(ms);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const found = search.search(q).slice(0, 12) as unknown as Hit[];
    setResults(found);
    setFocusIdx(0);
  }, [query, search]);

  function hrefFor(t: Hit) {
    const slug = t.scenarioId ? `${t.taskSlug}--${t.scenarioId}` : t.taskSlug;
    return `/practice-areas/${t.practiceArea}/${slug}`;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[focusIdx]) {
      window.location.href = hrefFor(results[focusIdx]);
    }
  }

  const wtColors: Record<string, string> = {
    analyze: "bg-accent-100 text-accent-700",
    draft: "bg-accent-50 text-accent-600",
    review: "bg-ink-100 text-ink-700",
    research: "bg-ink-50 text-ink-700",
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search 1,251 tasks..."
          onFocus={() => {
            setOpen(true);
            loadIndex();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full text-[13px] border border-ink-200 bg-white rounded-md pl-8 pr-9 py-1.5 focus:outline-none focus:border-accent-500 placeholder:text-ink-400"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11 L14 14" strokeLinecap="round" />
          </svg>
        </span>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-400 font-mono border border-ink-200 rounded px-1 py-px pointer-events-none hidden sm:block">⌘K</kbd>
      </div>

      {open && (query || loading) && (
        <div className="absolute right-0 mt-1.5 w-[420px] max-w-[90vw] bg-white border border-[var(--rule)] rounded-md shadow-lg z-40 overflow-hidden">
          {loading && (
            <div className="px-3 py-3 text-[12px] text-ink-500">Loading search index...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-3 py-3 text-[12px] text-ink-500">
              No tasks matching <span className="font-mono text-ink-700">{query}</span>.
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-ink-100">
              {results.map((t, i) => (
                <li key={t.id}>
                  <a
                    href={hrefFor(t)}
                    onMouseEnter={() => setFocusIdx(i)}
                    className={`block px-3 py-2.5 transition ${i === focusIdx ? "bg-accent-50" : "hover:bg-ink-50/60"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${wtColors[t.workType] ?? "bg-ink-100 text-ink-700"}`}>
                        {WORK_TYPE_LABEL[t.workType]}
                      </span>
                      <span className="text-[11px] text-ink-500">{t.practiceAreaName}</span>
                      {t.scenarioId && (
                        <span className="text-[10px] font-mono text-ink-400">{t.scenarioId.replace("scenario-", "S")}</span>
                      )}
                    </div>
                    <div className="text-[13px] text-ink-900 leading-snug line-clamp-2">{t.title}</div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
