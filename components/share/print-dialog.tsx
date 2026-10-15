"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Printer } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import { useMockScenarios } from "@/lib/hooks";
import { getPrinterStatus } from "@/lib/services";
import { PrintSummary, type ShareContent } from "./print-summary";

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  content: ShareContent;
  onSmsInstead?: () => void;
}

/** Renders the summary into #print-root, the only element the print stylesheet shows. */
function PrintTarget({ content }: { content: ShareContent }) {
  // Only rendered inside an open dialog, which never happens during server rendering.
  const [root] = useState(() => {
    const element = document.createElement("div");
    element.id = "print-root";
    return element;
  });

  useEffect(() => {
    document.body.appendChild(root);
    return () => root.remove();
  }, [root]);

  return createPortal(<PrintSummary content={content} />, root);
}

export function PrintDialog({ open, onClose, content, onSmsInstead }: PrintDialogProps) {
  useMockScenarios();
  const [opened, setOpened] = useState(false);
  const unavailable = getPrinterStatus() === "unavailable";

  const close = () => {
    setOpened(false);
    onClose();
  };

  const print = () => {
    // The browser's print window gives no result, so this only records that it was opened.
    window.print();
    setOpened(true);
  };

  return (
    <Dialog open={open} onClose={close} title={ui.print.title} size="lg">
      {unavailable ? (
        <Notice tone="warning" role="alert">
          {ui.print.unavailable}
        </Notice>
      ) : (
        <>
          <PrintTarget content={content} />
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">{ui.print.previewLabel}</p>
            <PrintSummary content={content} onScreen />
          </div>
          {opened && (
            <Notice role="status">
              <p>{ui.print.opened}</p>
              <p className="text-ink-soft">{ui.print.notConfirmed}</p>
            </Notice>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        {!unavailable && (
          <Button size="lg" className="flex-1" onClick={print}>
            <Printer className="size-5" />
            {ui.print.open}
          </Button>
        )}
        {onSmsInstead && (
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setOpened(false);
              onSmsInstead();
            }}
          >
            {ui.print.smsInstead}
          </Button>
        )}
        <Button size="lg" variant="secondary" className="flex-1" onClick={close}>
          {ui.common.close}
        </Button>
      </div>
    </Dialog>
  );
}
