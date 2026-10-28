import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CodeFile } from "@/components/site/CodeTabs";
import { highlight } from "@/lib/highlight";

export type SourceFile = {
  name: string;
  /** Show a shortened preview (Copy still copies the whole file). */
  preview?: boolean;
  note?: string;
};

/** Large data files are copyable in full but only previewed. */
function previewOf(code: string, maxLines = 18, maxCols = 140) {
  const shown = code
    .split("\n")
    .slice(0, maxLines)
    .map((l) => (l.length > maxCols ? `${l.slice(0, maxCols)}…"],` : l));
  return `${shown.join("\n")}\n\n// … ${(code.length / 1024).toFixed(0)} KB of data — use “Copy” to get the full file.\n`;
}

/** Reads and highlights a component's source files at build time. Usage example first. */
export async function loadComponentFiles(importDir: string, files: SourceFile[], usage: string): Promise<CodeFile[]> {
  const dir = path.join(process.cwd(), importDir);
  const sources = await Promise.all(
    files.map(async (f) => {
      const code = await readFile(path.join(dir, f.name), "utf8");
      return {
        name: f.name,
        code,
        html: await highlight(f.preview ? previewOf(code) : code),
        note: f.note ?? `${importDir}/${f.name}`,
      };
    }),
  );
  return [{ name: "Usage.tsx", code: usage, html: await highlight(usage) }, ...sources];
}
