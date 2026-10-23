"use client";

import { useState } from "react";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ExternalLink } from "@/components/ui/icons";
import { appConfig } from "@/lib/config";
import { downloadFile } from "@/lib/download";
import { useSession, useTriageText, useUi } from "@/lib/hooks";
import { sessionStore } from "@/lib/session/session-store";
import { setSaveOnDevice } from "@/lib/session/actions";
import { addDays, buildIcs } from "@/lib/triage/calendar";
import { LyingDownIllustration, MirrorIllustration } from "./illustrations";

/** Approved telemedicine link, or nothing when no provider is configured. */
export function TelemedicineLink({ label, variant = "secondary" }: { label: string; variant?: "primary" | "secondary" }) {
  const { ui } = useUi();
  const provider = appConfig.telemedicine;
  if (!provider) return null;
  return (
    <a href={provider.url} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, "lg", "w-full sm:w-auto")}>
      {label}
      <ExternalLink className="size-5" />
      <span className="sr-only">{ui.common.opensInNewTab}</span>
    </a>
  );
}

/** Emergency guidance with a call link only when a verified number has been configured. */
export function EmergencyLine({ className = "" }: { className?: string }) {
  const { text } = useTriageText();
  const number = appConfig.emergencyNumber;
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <span>{text.welcome.emergency}</span>
      {number && (
        <a href={`tel:${number}`} className="inline-flex min-h-11 items-center rounded-full bg-red-700 px-4 font-bold text-white hover:bg-red-800">
          {text.welcome.emergencyCall(number)}
        </a>
      )}
    </p>
  );
}

/** "I need help now": urgent guidance at any point. It records nothing about the person's answers. */
export function HelpNowButton() {
  const { text } = useTriageText();
  const t = text.helpNow;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-red-700 bg-white px-4 text-base font-bold text-red-800 shadow-soft hover:bg-red-50"
      >
        {t.button}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.title}>
        <p className="text-lg leading-relaxed">{t.text}</p>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-950">
          <p>{t.emergency}</p>
          {appConfig.emergencyNumber && <EmergencyLine className="mt-2" />}
        </div>
        <div className="flex flex-col gap-3">
          <ButtonLink href="/healthcare" size="lg" onClick={() => setOpen(false)}>
            {t.findCare}
          </ButtonLink>
          <TelemedicineLink label={t.talk} />
          <Button size="lg" variant="secondary" onClick={() => setOpen(false)}>
            {t.back}
          </Button>
        </div>
        <p className="text-sm text-ink-soft">{t.kept}</p>
      </Dialog>
    </>
  );
}

type ReminderKind = "tomorrow" | "recheck" | "monthly";

/** Adds a reminder to the person's own calendar. EarlyHer itself sends nothing. */
export function ReminderButton({ kind, label }: { kind: ReminderKind; label: string }) {
  const { text } = useTriageText();
  const c = text.calendar;
  const add = () => {
    const now = new Date();
    const reminder =
      kind === "tomorrow"
        ? { title: c.selfCheckTitle, description: c.selfCheckText, date: addDays(now, 1) }
        : kind === "recheck"
          ? { title: c.recheckTitle, description: c.recheckText, date: addDays(now, 14) }
          : { title: c.monthlyTitle, description: c.monthlyText, date: addDays(now, 30), repeat: "monthly" as const };
    downloadFile(c.fileName, buildIcs(reminder, now), "text/calendar;charset=utf-8");
  };
  return (
    <Button variant="secondary" size="lg" onClick={add} className="w-full sm:w-auto">
      {label}
    </Button>
  );
}

/** The self-check guide: what to look and feel for, with the two illustrations. */
export function SelfCheckGuideButton({ label }: { label: string }) {
  const { text } = useTriageText();
  const t = text.selfCheck;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.guideTitle} size="lg">
        <p className="text-lg leading-relaxed">{t.guideIntro}</p>
        <ul className="flex list-disc flex-col gap-1 pl-6 text-lg leading-relaxed">
          {t.signs.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
        <MirrorIllustration />
        <p className="text-base leading-relaxed text-ink-soft">{text.questions.N2.helper}</p>
        <LyingDownIllustration />
        <p className="text-base leading-relaxed text-ink-soft">{text.questions.N3.helper}</p>
        <p className="text-base leading-relaxed">{t.guideOutro}</p>
        <Button size="lg" onClick={() => setOpen(false)}>
          {text.helpNow.back}
        </Button>
      </Dialog>
    </>
  );
}

/** "Save my progress on this device": opt-in, with the shared-device warning and a delete action. */
export function SaveProgressToggle() {
  const session = useSession();
  const { text } = useTriageText();
  const t = text.save;
  const [deleted, setDeleted] = useState(false);
  const triage = session.triage;
  if (!appConfig.allowDeviceSave || !triage) return null;
  const saved = triage.save !== null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base font-semibold">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => {
            setDeleted(!event.target.checked);
            setSaveOnDevice(sessionStore, event.target.checked, new Date());
          }}
          className="size-6 shrink-0 accent-brand-600"
        />
        {t.label}
      </label>
      <p className="text-sm leading-relaxed text-ink-soft">{t.help}</p>
      <p role="status" className="text-sm font-semibold">
        {saved ? t.saved : deleted ? t.deleted : ""}
      </p>
      {saved && (
        <div>
          <Button
            variant="quiet"
            onClick={() => {
              setDeleted(true);
              setSaveOnDevice(sessionStore, false, new Date());
            }}
          >
            {t.delete}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Footer on every triage screen: guidance, not diagnosis, with a way to seek care at any point. */
export function GuidanceFooter({ showSave = true }: { showSave?: boolean }) {
  const { text } = useTriageText();
  return (
    <footer className="flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-base leading-relaxed">{text.footer.text}</p>
        <ButtonLink href="/healthcare" variant="secondary" className="shrink-0">
          {text.footer.findCare}
        </ButtonLink>
      </div>
      {showSave && <SaveProgressToggle />}
    </footer>
  );
}
