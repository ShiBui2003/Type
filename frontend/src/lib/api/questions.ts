import { request } from "./client";
import type { Question, QuestionCreate, QuestionUpdate, ReorderPayload } from "../types";

export function createQuestion(formId: number, payload: QuestionCreate): Promise<Question> {
  return request(`/api/forms/${formId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuestion(id: number, payload: QuestionUpdate): Promise<Question> {
  return request(`/api/questions/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteQuestion(id: number): Promise<void> {
  return request(`/api/questions/${id}`, { method: "DELETE" });
}

export function reorderQuestions(
  formId: number,
  payload: ReorderPayload
): Promise<Question[]> {
  return request(`/api/forms/${formId}/questions/reorder`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
