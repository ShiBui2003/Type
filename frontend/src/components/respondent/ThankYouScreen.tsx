"use client";

import { useRespondentFlow } from "@/context/RespondentFlowContext";

export function ThankYouScreen() {
  const { submitResult, form } = useRespondentFlow();
  const title = submitResult?.thank_you_title || form?.thank_you_title || "Thank you!";
  const description = submitResult?.thank_you_description ?? form?.thank_you_description;

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      {description && <p className="mt-3 text-base opacity-70">{description}</p>}
    </div>
  );
}
