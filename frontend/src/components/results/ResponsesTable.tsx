"use client";

import { formatDateTime } from "@/lib/answerDisplay";
import type { ResponseDetail } from "@/lib/types";

// Row structure is our own design on the token system - the spec
// explicitly GAPs real Typeform's response table (the recon form had
// zero responses). Responses arrive newest-first from the backend;
// numbering counts down so "#1" is the oldest submission and the
// number is stable as new responses arrive.
export function ResponsesTable({
  responses,
  onView,
}: {
  responses: ResponseDetail[];
  onView: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface-canvas shadow-ring-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[13px] font-normal text-ink-muted">
            <th className="px-4 py-3 font-normal">Response</th>
            <th className="px-4 py-3 font-normal">Submitted</th>
            <th className="px-4 py-3 font-normal">Answers</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {responses.map((response, i) => (
            <tr
              key={response.id}
              onClick={() => onView(response.id)}
              className="cursor-pointer border-t border-ink-faint transition-colors duration-200 ease-tf hover:bg-surface-panel"
            >
              <td className="px-4 py-3 text-ink">#{responses.length - i}</td>
              <td className="px-4 py-3 text-ink">
                {formatDateTime(response.submitted_at ?? response.started_at)}
              </td>
              <td className="px-4 py-3 text-ink-muted">{response.answers.length}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    // The row itself opens the detail too; the explicit
                    // button exists so keyboard/screen-reader users have
                    // a real focusable control.
                    e.stopPropagation();
                    onView(response.id);
                  }}
                  className="text-[13px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
