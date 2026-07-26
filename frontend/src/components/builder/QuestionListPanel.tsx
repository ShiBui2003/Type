"use client";

import { useState } from "react";
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
import type { QuestionType } from "@/lib/types";
import { AddQuestionMenu } from "./AddQuestionMenu";
import { DeleteQuestionModal } from "./DeleteQuestionModal";
import { QuestionListItem } from "./QuestionListItem";

export function QuestionListPanel() {
  const { form, selectedQuestionId, selectQuestion, addQuestion, reorderQuestion, reorderPending } =
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
      className={`flex h-full flex-col gap-2 overflow-y-auto border-r border-zinc-200 p-3 dark:border-zinc-800 ${
        reorderPending ? "pointer-events-none opacity-70" : ""
      }`}
    >
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

      <AddQuestionMenu onSelect={(type: QuestionType) => addQuestion(type)} />

      <DeleteQuestionModal questionId={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
