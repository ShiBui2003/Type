"use client";

import { use } from "react";

import { RespondentFlow } from "@/components/respondent/RespondentFlow";
import { RespondentFlowProvider } from "@/context/RespondentFlowContext";

// Fully separate, full-screen namespace - no dashboard/builder chrome.
// Next 16 requires `use(params)` even in Client Components.
export default function RespondentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <RespondentFlowProvider key={slug} slug={slug}>
      <RespondentFlow />
    </RespondentFlowProvider>
  );
}
