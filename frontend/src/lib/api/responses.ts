import { request } from "./client";
import type { FormSummary, ResponseDetail } from "../types";

export function listResponses(formId: number): Promise<ResponseDetail[]> {
  return request(`/api/forms/${formId}/responses`);
}

export function getResponse(id: number): Promise<ResponseDetail> {
  return request(`/api/responses/${id}`);
}

export function getFormSummary(formId: number): Promise<FormSummary> {
  return request(`/api/forms/${formId}/summary`);
}
