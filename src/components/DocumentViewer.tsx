import { useEffect, useState, type ComponentType } from "react";
import type { SuperDocEditorProps } from "@superdoc-dev/react";

type SuperDocReactModule = typeof import("@superdoc-dev/react");
type SuperDocEditorComponent = ComponentType<SuperDocEditorProps>;

let superdocModule: Promise<SuperDocReactModule> | null = null;

function loadSuperDoc(): Promise<SuperDocReactModule> {
  if (!superdocModule) {
    superdocModule = Promise.all([
      import("@superdoc-dev/react"),
      // @ts-expect-error - CSS side-effect import has no type declarations
      import("@superdoc-dev/react/style.css"),
    ]).then(([mod]) => mod);
  }
  return superdocModule;
}

interface Props {
  url: string;
  filename: string;
  ext: string;
}

export default function DocumentViewer({ url, filename, ext }: Props) {
  const [Editor, setEditor] = useState<SuperDocEditorComponent | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [mod, res] = await Promise.all([
          loadSuperDoc(),
          fetch(url),
        ]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const mimeType =
          ext.toLowerCase() === ".pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        setFile(new File([blob], filename, { type: mimeType }));
        setEditor(() => mod.SuperDocEditor);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, filename, ext]);

  if (error) {
    return (
      <div className="border-t border-ink-100 bg-rose-50/40 px-4 py-3 text-[12.5px] text-rose-700">
        Couldn't load preview: {error}.{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="underline decoration-rose-300"
        >
          Download instead
        </a>
        .
      </div>
    );
  }

  if (!Editor || !file) {
    return (
      <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-6 text-center text-[12.5px] text-ink-500">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="border-t border-ink-100 bg-ink-50/30">
      <div className="superdoc-host max-h-[80vh] overflow-auto">
        <Editor
          document={file}
          documentMode="viewing"
          role="viewer"
          hideToolbar
          contained
        />
      </div>
    </div>
  );
}
