"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/ToastProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Mirrors the slug the backend puts in Content-Disposition. Kept on both
// sides on purpose: the header is what anyone hitting the endpoint
// directly (curl, a browser address bar) gets, while the blob download
// below names the file client-side - reading the header instead would
// mean exposing it through CORS for a cosmetic detail.
function filenameFor(formTitle: string): string {
  const slug = formTitle.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${slug || "form"}-responses.csv`;
}

// The single export implementation. Both entry points - the Results view
// and the dashboard card's menu - go through this, so there's no second
// copy that could drift.
export async function downloadResponsesCsv(formId: number, formTitle: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/forms/${formId}/responses/export`);
  if (!res.ok) throw new Error(`Export failed (${res.status})`);

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filenameFor(formTitle);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

// Wraps the download with the app's toast conventions and a busy flag, so
// both entry points share the UX too, not just the fetch.
export function useExportCsv() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportCsv = useCallback(
    async (formId: number, formTitle: string) => {
      if (exporting) return;
      setExporting(true);
      try {
        await downloadResponsesCsv(formId, formTitle);
        showToast("CSV exported");
      } catch {
        showToast("Couldn't export CSV", "error");
      } finally {
        setExporting(false);
      }
    },
    [exporting, showToast]
  );

  return { exportCsv, exporting };
}
