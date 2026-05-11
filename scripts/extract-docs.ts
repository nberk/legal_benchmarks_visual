import { readFile } from "node:fs/promises";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export const MAX_SNIPPET_CHARS = 280;

function tidyText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}

export async function getSnippet(
  filePath: string,
  ext: string,
): Promise<string | undefined> {
  try {
    const e = ext.toLowerCase();
    if (e === ".docx") {
      const buffer = await readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return clip(tidyText(result.value), MAX_SNIPPET_CHARS);
    }
    if (e === ".eml" || e === ".txt" || e === ".md") {
      const text = await readFile(filePath, "utf8");
      const body = e === ".eml" ? text.split(/\r?\n\r?\n/).slice(1).join("\n") : text;
      return clip(tidyText(body), MAX_SNIPPET_CHARS);
    }
    if (e === ".xlsx") {
      const buf = await readFile(filePath);
      const wb = XLSX.read(buf, { type: "buffer" });
      const summary = wb.SheetNames.map((name) => {
        const sheet = wb.Sheets[name];
        const ref = sheet["!ref"];
        if (!ref) return name;
        const range = XLSX.utils.decode_range(ref);
        const rows = range.e.r - range.s.r + 1;
        const cols = range.e.c - range.s.c + 1;
        return `${name} (${rows}×${cols})`;
      }).join(", ");
      return clip(`Workbook with sheets: ${summary}`, MAX_SNIPPET_CHARS);
    }
    return undefined;
  } catch {
    return undefined;
  }
}
