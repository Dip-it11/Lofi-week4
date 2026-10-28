import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export type CodeLang = "tsx" | "bash";

let highlighter: Promise<HighlighterCore> | null = null;

/** One shared, lazily-created highlighter (JS regex engine — no WASM, works at build time and in the browser). */
function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [import("shiki/dist/themes/github-dark-default.mjs")],
    langs: [import("shiki/dist/langs/tsx.mjs"), import("shiki/dist/langs/bash.mjs")],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export async function highlight(code: string, lang: CodeLang = "tsx") {
  const h = await getHighlighter();
  return h.codeToHtml(code, { lang, theme: "github-dark-default" });
}
