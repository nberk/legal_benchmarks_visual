import { useMemo, useState } from "react";
import type { Criterion } from "@/lib/types";

interface Props {
  criteria: Criterion[];
  deliverableFilenames: string[];
}

export default function RubricList({ criteria, deliverableFilenames }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("all");
  const [allOpen, setAllOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return criteria;
    return criteria.filter((c) => c.deliverables.includes(filter));
  }, [criteria, filter]);

  const showFilter = deliverableFilenames.length > 1;

  function toggle(id: string) {
    setOpen((prev) => ({ ...prev, [id]: !(allOpen || prev[id]) }));
    setAllOpen(false);
  }

  function expandAll() {
    setAllOpen(true);
    setOpen({});
  }

  function collapseAll() {
    setAllOpen(false);
    setOpen({});
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="text-[12px] text-ink-500">
          <span className="font-mono tabular-nums text-ink-700">{filtered.length}</span> of{" "}
          <span className="font-mono tabular-nums">{criteria.length}</span> criteria
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showFilter && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-[12px] border border-ink-200 rounded px-2 py-1 bg-white"
            >
              <option value="all">All deliverables</option>
              {deliverableFilenames.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={expandAll}
            className="text-[12px] text-ink-600 hover:text-ink-900 underline decoration-ink-300"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[12px] text-ink-600 hover:text-ink-900 underline decoration-ink-300"
          >
            Collapse all
          </button>
        </div>
      </div>
      <ul className="divide-y divide-ink-100 border border-[var(--rule)] rounded-lg bg-white">
        {filtered.map((c) => {
          const isOpen = allOpen || open[c.id];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-ink-50/60 transition"
                aria-expanded={isOpen}
              >
                <span className="text-[11px] font-mono tabular-nums text-ink-400 mt-[3px] shrink-0 w-12">
                  {c.id}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] text-ink-900 leading-snug">
                    {c.title}
                  </span>
                  {c.deliverables.length > 0 && (
                    <span className="block mt-1 text-[11px] text-ink-500 font-mono truncate">
                      {c.deliverables.join(", ")}
                    </span>
                  )}
                </span>
                <span
                  className="text-ink-400 text-[12px] mt-[2px] transition-transform shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[68px] text-[13px] text-ink-700 leading-relaxed whitespace-pre-wrap">
                  {c.matchCriteria}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
