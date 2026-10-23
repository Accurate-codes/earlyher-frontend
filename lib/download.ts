"use client";

/**
 * Saves a file the person asked for (summary PDF, calendar reminder) to their device.
 * Nothing is uploaded: the file is built in the page and handed to the browser.
 */
export function downloadFile(name: string, data: BlobPart, type: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}
