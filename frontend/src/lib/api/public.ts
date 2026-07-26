import { request } from "./client";
import type { PublicAnswer, PublicForm, PublicSubmitResult } from "../types";

export function getPublicForm(slug: string): Promise<PublicForm> {
  return request(`/api/public/forms/${slug}`);
}

export function submitResponse(slug: string, answers: PublicAnswer[]): Promise<PublicSubmitResult> {
  return request(`/api/public/forms/${slug}/responses`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
