"use client";

import { useEffect, useState } from "react";

// Phase 0 proof-of-connectivity page: confirms the frontend can reach the
// backend through NEXT_PUBLIC_API_URL before any real feature is built on
// top of that wiring. Replaced by the forms dashboard in Phase 2.
export default function Home() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        setBody(JSON.stringify(data));
        setStatus("ok");
      })
      .catch((err) => {
        setBody(String(err));
        setStatus("error");
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
      <h1 className="text-2xl font-semibold">Phase 0 health check</h1>
      <p>API URL: {process.env.NEXT_PUBLIC_API_URL ?? "(not set)"}</p>
      <p>
        Status: <strong>{status}</strong>
      </p>
      <pre className="rounded bg-zinc-100 px-4 py-2 text-sm dark:bg-zinc-800">
        {body || "waiting for response..."}
      </pre>
    </div>
  );
}
