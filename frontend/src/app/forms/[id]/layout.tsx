"use client";

import { use } from "react";
import Link from "next/link";

import { FormBuilderProvider, useFormBuilder } from "@/context/FormBuilderContext";
import { BuilderHeader } from "@/components/builder/BuilderHeader";

// Only this file touches the raw route param - Next 16 requires
// `use(params)` even in Client Components (no plain destructuring).
// Everything under it reads formId from FormBuilderContext instead, so
// the same promise isn't re-unwrapped in multiple files.
export default function FormLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const formId = Number(id);

  // Keying on formId forces a clean remount if a user ever navigates
  // directly between two forms' builders - Next doesn't guarantee a
  // fresh component instance across sibling dynamic-segment navigations.
  return (
    <FormBuilderProvider key={formId} formId={formId}>
      <FormLayoutInner>{children}</FormLayoutInner>
    </FormBuilderProvider>
  );
}

function FormLayoutInner({ children }: { children: React.ReactNode }) {
  const { loading, error } = useFormBuilder();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading form…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Form not found</p>
        <Link href="/" className="text-ink underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <BuilderHeader />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
