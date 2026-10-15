"use client";

import { useState } from "react";
import { ui } from "@/content/en/ui";
import { appConfig } from "@/lib/config";
import { useMockScenarios } from "@/lib/hooks";
import { mockScenarios, type MockScenarios } from "@/lib/services/mock-scenarios";
import { isMockMode } from "@/lib/services";

const options: { [K in keyof MockScenarios]: { label: string; values: MockScenarios[K][] } } = {
  ai: { label: ui.dev.ai, values: ["success", "timeout", "invalid", "error"] },
  sms: { label: ui.dev.sms, values: ["accepted", "queued", "failure"] },
  facilities: { label: ui.dev.facilities, values: ["unavailable", "fixtures", "empty", "error"] },
  printer: { label: ui.dev.printer, values: ["unknown", "unavailable"] },
};

/** Reviewer tool for stepping through mock service states. Never rendered for the public. */
export function DemoStatePanel() {
  const scenarios = useMockScenarios();
  const [open, setOpen] = useState(false);

  if (!appConfig.showDevFixtures || !isMockMode) return null;

  return (
    <aside className="mx-auto w-full max-w-6xl px-4 pb-4 pt-8 sm:px-6 print:hidden">
      <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/70 text-sky-950">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold"
        >
          <span>
            {ui.dev.title} <span className="font-normal">· {ui.dev.note}</span>
          </span>
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="grid gap-3 border-t border-sky-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(options) as (keyof MockScenarios)[]).map((key) => (
              <label key={key} className="flex flex-col gap-1 text-sm font-medium">
                {options[key].label}
                <select
                  value={scenarios[key]}
                  onChange={(event) => mockScenarios.set({ [key]: event.target.value } as Partial<MockScenarios>)}
                  className="min-h-12 rounded-xl border border-sky-300 bg-white px-3 text-base"
                >
                  {options[key].values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
