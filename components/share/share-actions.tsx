"use client";

import { useLayoutEffect, useState } from "react";
import { PrintDialog } from "./print-dialog";
import type { ShareContent } from "./print-summary";
import { SmsDialog } from "./sms-dialog";

/** Print and SMS dialogs for a screen, each offering the other as an alternative. */
export function useShare(content: ShareContent, pathwayVersion?: string) {
  const [active, setActive] = useState<"print" | "sms" | null>(null);

  // Do not come back to an open dialog after navigating away from the screen.
  useLayoutEffect(() => () => setActive(null), []);

  return {
    openPrint: () => setActive("print"),
    openSms: () => setActive("sms"),
    dialogs: (
      <>
        <PrintDialog
          open={active === "print"}
          onClose={() => setActive(null)}
          content={content}
          onSmsInstead={() => setActive("sms")}
        />
        <SmsDialog
          open={active === "sms"}
          onClose={() => setActive(null)}
          content={content}
          pathwayVersion={pathwayVersion}
          onPrintInstead={() => setActive("print")}
        />
      </>
    ),
  };
}
