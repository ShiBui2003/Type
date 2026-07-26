"use client";

import { BuilderToolbar } from "@/components/builder/BuilderToolbar";
import { LivePreviewPanel } from "@/components/builder/LivePreviewPanel";
import { QuestionEditorPanel } from "@/components/builder/QuestionEditorPanel";
import { QuestionListPanel } from "@/components/builder/QuestionListPanel";

// Three-panel builder: question list ("Pages"), a centered mobile-card
// canvas (live preview), and contextual settings for the selected
// question - matching the real Typeform builder's structure rather than
// three equal-width flat panels. Collapses to a single stacked column
// below md - the brief only asks the builder to degrade gracefully on
// tablet width, not to be phone-perfect.
export default function BuilderPage() {
  return (
    <div className="flex h-full flex-col">
      <BuilderToolbar />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_1fr_300px] lg:grid-cols-[256px_1fr_340px]">
        <QuestionListPanel />
        <LivePreviewPanel />
        <QuestionEditorPanel />
      </div>
    </div>
  );
}
