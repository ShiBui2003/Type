"use client";

import { LivePreviewPanel } from "@/components/builder/LivePreviewPanel";
import { QuestionEditorPanel } from "@/components/builder/QuestionEditorPanel";
import { QuestionListPanel } from "@/components/builder/QuestionListPanel";

// Three-panel builder: question list, editor, live preview. Collapses to
// a single stacked column below md - the brief only asks the builder to
// degrade gracefully on tablet width, not to be phone-perfect.
export default function BuilderPage() {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[240px_1fr_1fr] lg:grid-cols-[280px_1fr_1fr]">
      <QuestionListPanel />
      <QuestionEditorPanel />
      <LivePreviewPanel />
    </div>
  );
}
