"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ShareLinkModal } from "@/components/ui/ShareLinkModal";
import { useFormBuilder } from "@/context/FormBuilderContext";

// Measured empty state (spec section 7): "No responses" at 21px/400,
// 14px muted description, solid 8px-radius primary button. The real
// Typeform pairs it with a "Generate test response" outline button -
// deliberately omitted here: it fabricates response data, which is
// outside this phase's scope.
export function EmptyResponses() {
  const { form } = useFormBuilder();
  const [shareOpen, setShareOpen] = useState(false);

  if (!form) return null;
  const isPublished = form.status === "published" && form.slug !== null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-[21px] font-normal text-ink">No responses</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        {isPublished
          ? "Share your form to start collecting responses. They'll show up here as they come in."
          : "Publish your form to start collecting responses. They'll show up here as they come in."}
      </p>
      {isPublished && (
        <>
          <Button onClick={() => setShareOpen(true)}>Share your form</Button>
          <ShareLinkModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            slug={form.slug as string}
            title={form.title}
          />
        </>
      )}
    </div>
  );
}
