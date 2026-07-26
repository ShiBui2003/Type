"use client";

import { useRespondentFlow } from "@/context/RespondentFlowContext";

export function ProgressBar() {
  const { form, currentIndex, status } = useRespondentFlow();
  if (!form || currentIndex < 0 || status === "submitted") return null;

  const percent = ((currentIndex + 1) / form.questions.length) * 100;

  return (
    <div className="h-1 w-full shrink-0 bg-current/10" style={{ color: "var(--form-fg)" }}>
      <div
        className="h-full transition-[width] duration-300 ease-tf"
        style={{ width: `${percent}%`, background: "var(--form-accent)" }}
      />
    </div>
  );
}
