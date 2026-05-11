import { lazy, Suspense, useState } from "react";
import type { DocumentEntry } from "@/lib/types";

const DocumentViewer = lazy(() => import("./DocumentViewer"));

interface Props {
  documents: DocumentEntry[];
}

const extLabel: Record<string, string> = {
  ".docx": "DOCX",
  ".xlsx": "XLSX",
  ".pdf": "PDF",
  ".eml": "EML",
  ".txt": "TXT",
  ".md": "MD",
  ".pptx": "PPTX",
};

const extColors: Record<string, string> = {
  ".docx": "bg-accent-50 text-accent-700",
  ".xlsx": "bg-emerald-50 text-emerald-700",
  ".pdf": "bg-rose-50 text-rose-700",
  ".eml": "bg-amber-50 text-amber-700",
  ".txt": "bg-ink-100 text-ink-700",
  ".md": "bg-ink-100 text-ink-700",
  ".pptx": "bg-orange-50 text-orange-700",
};

const PREVIEWABLE = new Set([".docx", ".pdf"]);

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (documents.length === 0) {
    return (
      <p className="text-[13px] text-ink-500">No reference documents attached.</p>
    );
  }

  return (
    <ul className="border border-[var(--rule)] rounded-lg bg-white divide-y divide-ink-100 overflow-hidden">
      {documents.map((doc) => {
        const ext = doc.ext.toLowerCase();
        const previewable = PREVIEWABLE.has(ext);
        const isOpen = open[doc.id] ?? false;
        return (
          <li key={doc.id}>
            <div className="px-4 py-3 hover:bg-ink-50/40 transition">
              <div className="flex items-start gap-3">
                <span
                  className={`text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded mt-[3px] shrink-0 ${
                    extColors[ext] ?? "bg-ink-100 text-ink-700"
                  }`}
                >
                  {extLabel[ext] ?? doc.ext.replace(".", "").toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[12.5px] text-ink-800 break-all">
                    {doc.name}
                  </div>
                  {doc.snippet && (
                    <p className="mt-1.5 text-[12.5px] text-ink-600 leading-snug line-clamp-2">
                      {doc.snippet}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-mono text-[11px] text-ink-400 tabular-nums">
                    {formatBytes(doc.sizeBytes)}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {previewable && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpen((prev) => ({ ...prev, [doc.id]: !isOpen }))
                        }
                        aria-expanded={isOpen}
                        className="text-[12px] text-ink-600 hover:text-ink-900 inline-flex items-center gap-1 underline decoration-ink-300 hover:decoration-accent-500"
                      >
                        {isOpen ? "Hide" : "Preview"}
                      </button>
                    )}
                    <a
                      href={doc.githubUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-[12px] text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"
                    >
                      Open
                      <span aria-hidden>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {previewable && isOpen && (
              <Suspense
                fallback={
                  <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-6 text-center text-[12.5px] text-ink-500">
                    Loading preview…
                  </div>
                }
              >
                <DocumentViewer
                  url={doc.rawUrl}
                  filename={doc.name}
                  ext={doc.ext}
                />
              </Suspense>
            )}
          </li>
        );
      })}
    </ul>
  );
}
