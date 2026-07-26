"use client";

import { CreditCard, Upload, Users, Webhook, Zap } from "lucide-react";

import { ComingSoonCard } from "@/components/settings/ComingSoonCard";
import { ThankYouEditor } from "@/components/settings/ThankYouEditor";
import { ThemePicker } from "@/components/settings/ThemePicker";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <ThankYouEditor />
      <ThemePicker />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">More settings</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ComingSoonCard
            icon={Zap}
            title="Logic jumps"
            description="Branch to different questions based on an answer."
          />
          <ComingSoonCard
            icon={Webhook}
            title="Integrations & webhooks"
            description="Send responses to other tools automatically."
          />
          <ComingSoonCard
            icon={Users}
            title="Team collaboration"
            description="Invite teammates to edit this form together."
          />
          <ComingSoonCard
            icon={Upload}
            title="File upload question"
            description="Let respondents attach a file as an answer."
          />
          <ComingSoonCard
            icon={CreditCard}
            title="Payment question"
            description="Collect a payment as part of the form."
          />
        </div>
      </div>
    </div>
  );
}
