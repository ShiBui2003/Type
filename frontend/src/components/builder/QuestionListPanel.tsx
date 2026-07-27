"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, MoveRight } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { AddQuestionMenu } from "./AddQuestionMenu";
import { DeleteQuestionModal } from "./DeleteQuestionModal";
import { QuestionListItem } from "./QuestionListItem";

export function QuestionListPanel() {
  const { form, formId, selectedQuestionId, selectQuestion, addQuestion, reorderQuestion, reorderPending } =
    useFormBuilder();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // distance: 8 so a plain click-to-select isn't eaten by drag-start.
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const sensors = useSensors(pointerSensor);

  if (!form) return null;
  const questions = form.questions;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(questions, oldIndex, newIndex);
    const afterId = newOrder[newIndex - 1]?.id ?? null;
    const beforeId = newOrder[newIndex + 1]?.id ?? null;
    reorderQuestion(newOrder, Number(active.id), afterId, beforeId);
  }

  return (
    <div
      // No border - real Typeform separates this panel from the canvas by
      // a background-color shift alone (surface-panel vs surface-canvas).
      className={`flex h-full flex-col overflow-y-auto bg-surface-panel ${
        reorderPending ? "pointer-events-none opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-2 p-3 pb-5">
        <h2 className="px-1 text-sm font-medium text-ink">Pages</h2>
        {/* Welcome screen preview only - clicking this shows the
            preview-only canvas state in LivePreviewPanel (see there for
            why there's no editor for it yet). Not draggable, not part
            of the question list/reorder. */}
        <button
          onClick={() => selectQuestion(null)}
          className={`flex items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors duration-200 ease-tf ${
            selectedQuestionId === null ? "bg-ink/6" : "hover:bg-surface-panel"
          }`}
        >
          <LogIn className="h-4 w-4 shrink-0 text-ink-muted" />
          Welcome screen
        </button>
        {/* At most one reorder request is ever in flight. dnd-kit's
            DndContext has its own internal effect keyed on the `sensors`
            array, so swapping it to [] while pending (to "disable" drag)
            changes that array's length between renders and violates
            React's hook-order rule. pointer-events-none blocks the drag
            gesture from ever starting instead, without touching sensors. */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((question) => (
              <QuestionListItem
                key={question.id}
                question={question}
                isSelected={question.id === selectedQuestionId}
                onSelect={() => selectQuestion(question.id)}
                onDeleteClick={() => setDeleteTarget(question.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <AddQuestionMenu onSelect={(entry) => addQuestion(entry.type, entry.variant)} />
      </div>

      <div className="flex flex-col gap-2 border-t border-ink-faint p-3 pt-4">
        <h2 className="px-1 text-sm font-medium text-ink">Endings</h2>
        {/* Real Typeform supports multiple ending screens; our schema only
            has one thank-you screen (forms.thank_you_title/description),
            so this links to the single Settings editor rather than
            building a multi-ending list our data model doesn't support. */}
        <Link
          href={`/forms/${formId}/settings`}
          className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-ink-muted transition-colors duration-200 ease-tf hover:bg-surface-canvas hover:text-ink"
        >
          Thank you screen
          <MoveRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <DeleteQuestionModal questionId={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
