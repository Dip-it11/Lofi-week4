"use client";

import { useState } from "react";
import { TypewriterContactForm } from "@/components/typewriter-form";
import { PreviewFrame } from "@/components/site/PreviewFrame";

export function Preview() {
  const [fail, setFail] = useState(false);
  return (
    <PreviewFrame
      note="sound is on — mute it with the speaker key"
      tools={
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-medium text-muted transition hover:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} className="size-4 accent-brand" />
          Simulate send error
        </label>
      }
    >
      {(key) => (
        <TypewriterContactForm
          key={key}
          onSubmit={() =>
            new Promise<void>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("Network")) : resolve()), 1500))
          }
        />
      )}
    </PreviewFrame>
  );
}
