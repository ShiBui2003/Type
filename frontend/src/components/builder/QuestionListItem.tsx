"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { QuestionTypeIcon } from "@/components/ui/QuestionTypeIcon";
import type { Question } from "@/lib/types";

export function QuestionListItem({
  question,
  isSelected,
  onSelect,
  onDeleteClick,
}: {
  question: Question;
  isSelected: boolean;
  onSelect: () => void;
  onDeleteClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors duration-200 ease-tf ${
        isSelected
          ? "border-ink bg-ink/5 dark:bg-ink/20"
          : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-zinc-400 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <QuestionTypeIcon type={question.type} className="h-4 w-4 shrink-0 text-zinc-500" />
      <span className="min-w-0 flex-1 truncate">{question.title || "Untitled question"}</span>
      {question.is_required && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-label="Required" />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
        aria-label="Delete question"
        className="shrink-0 text-zinc-400 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
