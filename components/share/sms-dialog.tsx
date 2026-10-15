"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Backspace } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import { appConfig } from "@/lib/config";
import { useOnline, useSession } from "@/lib/hooks";
import { smsService } from "@/lib/services";
import { sessionStore } from "@/lib/session/session-store";
import type { ServiceErrorKind, SmsRequest, SmsResponse } from "@/lib/types/api";
import { checkPhoneNumber, formatPhoneDigits, LOCAL_NUMBER_LENGTH, sanitiseDigits } from "@/lib/validation/phone";
import type { ShareContent } from "./print-summary";

type Step =
  | { name: "offer" }
  | { name: "enter"; showError: boolean }
  | { name: "preview" }
  | { name: "sending" }
  | { name: "sent"; response: SmsResponse; simulated: boolean }
  | { name: "failed"; error: ServiceErrorKind };

interface SmsDialogProps {
  open: boolean;
  onClose: () => void;
  content: ShareContent;
  pathwayVersion?: string;
  onPrintInstead?: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const keyClass =
  "grid min-h-14 place-items-center rounded-2xl border border-line bg-white text-2xl font-semibold shadow-soft hover:bg-brand-50 active:scale-[0.97] active:bg-brand-100";

/** On-screen number pad for touchscreens without a keyboard. A hardware or phone keyboard also works. */
function NumericKeypad({ onDigit, onDelete, onClear }: { onDigit: (digit: string) => void; onDelete: () => void; onClear: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button key={key} type="button" className={keyClass} onClick={() => onDigit(key)}>
          {key}
        </button>
      ))}
      <button type="button" className={`${keyClass} text-base`} onClick={onClear}>
        {ui.sms.clear}
      </button>
      <button type="button" className={keyClass} onClick={() => onDigit("0")}>
        0
      </button>
      <button type="button" className={keyClass} onClick={onDelete} aria-label={ui.sms.delete}>
        <Backspace className="size-7" />
      </button>
    </div>
  );
}

export function SmsDialog({ open, onClose, content, pathwayVersion, onPrintInstead }: SmsDialogProps) {
  const { phoneDigits } = useSession();
  const online = useOnline();
  const [step, setStep] = useState<Step>({ name: "offer" });

  const facility = content.facility;
  const template: SmsRequest["templateId"] = facility ? "facility" : "next-step";
  const message = facility ? ui.sms.templates.facility(facility.name) : ui.sms.templates["next-step"];
  const check = checkPhoneNumber(phoneDigits);

  const setDigits = (digits: string) => sessionStore.update({ phoneDigits: sanitiseDigits(digits) });

  const close = () => {
    // The number is not kept once the dialog is closed, whatever the outcome.
    sessionStore.update({ phoneDigits: "" });
    setStep({ name: "offer" });
    onClose();
  };

  const send = async () => {
    if (!check.valid) return;
    setStep({ name: "sending" });
    const task = sessionStore.startTask();
    const result = await smsService.send(
      {
        phoneNumber: check.e164,
        templateId: template,
        recommendationId: content.recommendation?.id,
        facilityId: facility?.id,
        pathwayVersion,
        locale: appConfig.defaultLocale,
      },
      task.signal,
    );
    task.done();
    // A reply that arrives after the session ended must not touch the new session.
    if (!task.isCurrent()) return;
    setStep(result.ok ? { name: "sent", response: result.data, simulated: result.simulated } : { name: "failed", error: result.error });
  };

  const printInstead = onPrintInstead && (
    <Button
      size="lg"
      variant="secondary"
      className="flex-1"
      onClick={() => {
        close();
        onPrintInstead();
      }}
    >
      {ui.sms.printInstead}
    </Button>
  );

  const title =
    step.name === "offer" ? ui.sms.offerTitle : step.name === "enter" ? ui.sms.enterTitle : step.name === "preview" ? ui.sms.previewTitle : ui.common.sendBySms;

  return (
    <Dialog open={open} onClose={close} title={title} dismissible={step.name !== "sending"}>
      {step.name === "offer" && (
        <>
          <p className="text-lg text-ink-soft">{ui.sms.offerText}</p>
          {!online && <Notice tone="warning">{ui.sms.offline}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button size="lg" className="flex-1" disabled={!online} onClick={() => setStep({ name: "enter", showError: false })}>
              {ui.common.sendBySms}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={close}>
              {ui.sms.noThanks}
            </Button>
          </div>
          {!online && printInstead && <div className="flex">{printInstead}</div>}
        </>
      )}

      {step.name === "enter" && (
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setStep(check.valid ? { name: "preview" } : { name: "enter", showError: true });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sms-number" className="text-base font-semibold">
              {ui.sms.numberLabel}
            </label>
            <input
              id="sms-number"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              placeholder={ui.sms.placeholder}
              value={formatPhoneDigits(phoneDigits)}
              onChange={(event) => setDigits(event.target.value)}
              aria-invalid={step.showError && !check.valid}
              aria-describedby="sms-number-help"
              className="min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-center text-2xl font-semibold tracking-wider tabular-nums placeholder:font-normal placeholder:text-ink-soft/50 focus:border-brand-600 focus:outline-none"
            />
            <p id="sms-number-help" role="status" className={`text-base ${step.showError && !check.valid ? "font-semibold text-red-800" : "text-ink-soft"}`}>
              {step.showError && !check.valid ? ui.sms.errors[check.reason] : ui.sms.privacy}
            </p>
          </div>

          <NumericKeypad
            onDigit={(digit) => phoneDigits.length < LOCAL_NUMBER_LENGTH && setDigits(phoneDigits + digit)}
            onDelete={() => setDigits(phoneDigits.slice(0, -1))}
            onClear={() => setDigits("")}
          />

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button size="lg" type="submit" className="flex-1">
              {ui.sms.preview}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={close}>
              {ui.common.cancel}
            </Button>
          </div>
        </form>
      )}

      {step.name === "preview" && (
        <>
          <dl className="flex flex-col gap-3 rounded-2xl border border-line bg-brand-50 p-4 text-base">
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{ui.sms.to}</dt>
              <dd className="text-xl font-bold tabular-nums">{formatPhoneDigits(phoneDigits)}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{ui.sms.message}</dt>
              <dd className="leading-relaxed">{message}</dd>
            </div>
          </dl>
          {!online && <Notice tone="warning">{ui.sms.offline}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button size="lg" className="flex-1" disabled={!online || !check.valid} onClick={send}>
              {ui.sms.send}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => setStep({ name: "enter", showError: false })}>
              {ui.sms.edit}
            </Button>
          </div>
        </>
      )}

      {step.name === "sending" && (
        <p role="status" className="flex items-center justify-center gap-3 py-6 text-xl font-semibold">
          <span className="pulse-dot size-3 rounded-full bg-brand-600" aria-hidden="true" />
          {ui.sms.sending}
        </p>
      )}

      {step.name === "sent" && (
        <>
          <Notice role="status">
            <p className="font-semibold">{step.response.status === "queued" ? ui.sms.queued : ui.sms.accepted}</p>
            <p className="text-ink-soft">{ui.sms.notDelivery}</p>
          </Notice>
          {step.simulated && (
            <Notice tone="demo" role="status">
              {ui.sms.simulated}
            </Notice>
          )}
          <Button size="lg" onClick={close}>
            {ui.common.close}
          </Button>
        </>
      )}

      {step.name === "failed" && (
        <>
          <Notice tone="warning" role="alert">
            {step.error === "offline" ? ui.sms.offline : ui.sms.failure}
          </Notice>
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button size="lg" className="flex-1" onClick={() => setStep({ name: "preview" })}>
              {ui.common.tryAgain}
            </Button>
            {printInstead}
            <Button size="lg" variant="secondary" className="flex-1" onClick={close}>
              {ui.common.close}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
