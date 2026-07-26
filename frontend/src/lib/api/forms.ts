import { request } from "./client";
import type { Form, FormCreate, FormListItem, FormUpdate } from "../types";

export function listForms(): Promise<FormListItem[]> {
  return request("/api/forms");
}

export function getForm(id: number): Promise<Form> {
  return request(`/api/forms/${id}`);
}

export function createForm(payload: FormCreate): Promise<Form> {
  return request("/api/forms", { method: "POST", body: JSON.stringify(payload) });
}

export function updateForm(id: number, payload: FormUpdate): Promise<Form> {
  return request(`/api/forms/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteForm(id: number): Promise<void> {
  return request(`/api/forms/${id}`, { method: "DELETE" });
}

export function duplicateForm(id: number): Promise<Form> {
  return request(`/api/forms/${id}/duplicate`, { method: "POST" });
}

export function publishForm(id: number): Promise<Form> {
  return request(`/api/forms/${id}/publish`, { method: "POST" });
}

export function unpublishForm(id: number): Promise<Form> {
  return request(`/api/forms/${id}/unpublish`, { method: "POST" });
}
